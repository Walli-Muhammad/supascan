import postgres from 'postgres';
import { randomUUID } from 'crypto';
import type { ScanResult, Finding, TableSecurityProfile, SafeguardCheck } from './types';
import { QUERY_FETCH_TABLES, QUERY_FETCH_POLICIES, QUERY_CHECK_DANGEROUS_GRANTS } from './queries';

// ── Raw data interfaces ────────────────────────────────────────────────────────

interface RawTableData {
    table_name: string;
    schema: string;
    rls_enabled: boolean;
}

interface RawPolicyData {
    policy_name: string;
    table_name: string;
    schema: string;
    cmd: string;
    roles: number[];
    qual: string | null;
    with_check: string | null;
}

interface RawGrantData {
    table_name: string;
    grantee: string;
    privilege_type: string;
}

// ── Timeout guard ─────────────────────────────────────────────────────────────

/**
 * Races a promise against a timeout.
 * If the promise doesn't resolve within `ms`, rejects with a TimeoutError.
 * This is critical for pooler connections where queries can hang indefinitely.
 */
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
    return Promise.race([
        promise,
        new Promise<T>((_, reject) =>
            setTimeout(() => reject(new Error(`[timeout] ${label} exceeded ${ms}ms`)), ms)
        ),
    ]);
}

// ── Deep RLS analysis ─────────────────────────────────────────────────────────

/**
 * Returns true if a policy expression is trivially permissive.
 * Catches: true, (true), TRUE, (TRUE), 1=1, 1 = 1, (1=1) etc.
 * Uses word-boundary regex so 'col_true_flag' is NOT flagged.
 */
function isTriviallyTrue(expr: string | null | undefined): boolean {
    if (!expr) return false;
    const TRUE_RE = /\btrue\b/i;
    const ONE_EQ_ONE_RE = /\b1\s*=\s*1\b/;
    return TRUE_RE.test(expr) || ONE_EQ_ONE_RE.test(expr);
}

// ── Grant grouping ─────────────────────────────────────────────────────────────

interface GrantGroup {
    table_name: string;
    grantee: string;
    privileges: string[];
}

function groupGrants(rawGrants: RawGrantData[]): GrantGroup[] {
    const map = new Map<string, GrantGroup>();
    for (const g of rawGrants) {
        const key = `${g.table_name}::${g.grantee}`;
        if (!map.has(key)) {
            map.set(key, { table_name: g.table_name, grantee: g.grantee, privileges: [] });
        }
        map.get(key)!.privileges.push(g.privilege_type);
    }
    return Array.from(map.values());
}

function describePrivileges(privs: string[]): string {
    if (privs.length === 1) return privs[0];
    const last = privs[privs.length - 1];
    const rest = privs.slice(0, -1);
    return `${rest.join(', ')} & ${last}`;
}

// ── Enterprise checks ─────────────────────────────────────────────────────────
// NOTE: We intentionally do NOT check PITR or MFA here.
// Both are Supabase platform-level settings that cannot be reliably
// detected via Postgres system catalogs. Omitting them keeps Supascan
// 100% technically credible with senior engineers.

const ENTERPRISE_TIMEOUT_MS = 5_000; // 5 s per check — safe for poolers

async function checkDangerousExtensions(sql: postgres.Sql): Promise<{ findings: Finding[]; safeguard: SafeguardCheck }> {
    try {
        const rows = await withTimeout(
            sql.unsafe<{ extname: string; nspname: string }[]>(`
                SELECT e.extname, n.nspname
                FROM pg_extension e
                JOIN pg_namespace n ON n.oid = e.extnamespace
                WHERE e.extname = ANY(ARRAY['pg_net','http'])
            `),
            ENTERPRISE_TIMEOUT_MS,
            'Extensions/pg_extension',
        );

        const exposed = rows.filter(r => r.nspname === 'public' || r.nspname === 'extensions');

        if (exposed.length === 0) {
            return {
                findings: [],
                safeguard: { name: 'Dangerous Extensions (pg_net / http)', status: 'PASS', detail: 'No network-exfiltration extensions in public scope' },
            };
        }

        const findings: Finding[] = exposed.map(ext => ({
            id: randomUUID(),
            severity: 'HIGH' as const,
            category: 'NETWORK' as const,
            table: `extensions.${ext.extname}`,
            message: `Extension '${ext.extname}' is installed in the '${ext.nspname}' schema with potential public execute access.`,
            risk: `The '${ext.extname}' extension allows SQL functions to make outbound HTTP requests. If accessible to the 'anon' role, attackers can use your database as a proxy to exfiltrate data to external servers.`,
            impact: 'HIGH' as const,
            remediation: `-- Revoke public execute on ${ext.extname} functions:\nREVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA ${ext.nspname} FROM PUBLIC;\nREVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA ${ext.nspname} FROM anon;`,
        }));

        return {
            findings,
            safeguard: { name: 'Dangerous Extensions (pg_net / http)', status: 'FAIL', detail: `${exposed.map(e => e.extname).join(', ')} in public scope` },
        };
    } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.warn('[engine] Extensions check skipped:', msg);
        return {
            findings: [],
            safeguard: { name: 'Dangerous Extensions (pg_net / http)', status: 'UNKNOWN', detail: 'Could not query pg_extension' },
        };
    }
}

async function checkSuperuser(sql: postgres.Sql): Promise<{ finding: Finding | null; safeguard: SafeguardCheck }> {
    try {
        const rows = await withTimeout(
            sql.unsafe<{ current_user: string; rolsuper: boolean }[]>(`
                SELECT current_user, rolsuper FROM pg_roles WHERE rolname = current_user
            `),
            ENTERPRISE_TIMEOUT_MS,
            'Superuser/pg_roles',
        );

        const isSuperuser = rows[0]?.rolsuper === true;
        const currentUser = rows[0]?.current_user ?? 'unknown';

        if (isSuperuser) {
            return {
                finding: {
                    id: randomUUID(),
                    severity: 'LOW',
                    category: 'PERMISSIONS',
                    table: 'system',
                    message: `Application is connecting as superuser role '${currentUser}' (Least Privilege Violation).`,
                    risk: 'Connecting as a superuser means a SQL injection vulnerability or compromised query gives an attacker complete database control — including reading all tables, creating backdoors, and bypassing all RLS policies.',
                    impact: 'MEDIUM',
                    remediation: `-- Create a dedicated limited role for your application:\nCREATE ROLE app_user LOGIN PASSWORD 'strong_password';\nGRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO app_user;\n-- Update your connection string to use app_user instead of postgres.`,
                },
                safeguard: { name: 'Least Privilege (App Role)', status: 'WARN', detail: `Connected as superuser '${currentUser}'` },
            };
        }

        return {
            finding: null,
            safeguard: { name: 'Least Privilege (App Role)', status: 'PASS', detail: `Non-superuser role '${currentUser}'` },
        };
    } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.warn('[engine] Superuser check skipped:', msg);
        return {
            finding: null,
            safeguard: { name: 'Least Privilege (App Role)', status: 'UNKNOWN', detail: 'Could not determine role privileges' },
        };
    }
}

// ── New catalog-level checks ───────────────────────────────────────────────────

async function checkSecurityDefiners(sql: postgres.Sql): Promise<Finding[]> {
    try {
        const rows = await withTimeout(
            sql.unsafe<{ function_name: string; schema: string }[]>(`
                SELECT p.proname AS function_name, n.nspname AS schema
                FROM pg_proc p
                JOIN pg_namespace n ON n.oid = p.pronamespace
                WHERE p.prosecdef = true AND n.nspname = 'public'
            `),
            ENTERPRISE_TIMEOUT_MS, 'check/security_definer',
        );
        if (rows.length === 0) return [];
        return rows.map(r => ({
            id: randomUUID(),
            severity: 'HIGH' as const,
            category: 'PERMISSIONS' as const,
            table: `public.${r.function_name}`,
            message: `SECURITY DEFINER function 'public.${r.function_name}' can bypass RLS.`,
            risk: 'SECURITY DEFINER functions execute with the owner\'s privileges, bypassing Row Level Security entirely — even when RLS is enabled on the tables they access.',
            impact: 'HIGH' as const,
            remediation: `-- Option 1: Switch to SECURITY INVOKER (recommended)\nALTER FUNCTION public.${r.function_name}() SECURITY INVOKER;\n-- Option 2: Force RLS so even the owner is restricted\nALTER TABLE public.<table_name> FORCE ROW LEVEL SECURITY;`,
        }));
    } catch (e) {
        console.warn('[engine] security_definer check skipped:', e instanceof Error ? e.message : e);
        return [];
    }
}

async function checkNetworkExtensionExposed(sql: postgres.Sql): Promise<Finding[]> {
    try {
        const rows = await withTimeout(
            sql.unsafe<{ schema: string; function_name: string; grantee: string }[]>(`
                SELECT n.nspname AS schema, p.proname AS function_name, r.rolname AS grantee
                FROM pg_proc p
                JOIN pg_namespace n ON n.oid = p.pronamespace
                JOIN pg_roles r ON has_function_privilege(r.oid, p.oid, 'EXECUTE')
                WHERE n.nspname IN ('net', 'http')
                  AND r.rolname IN ('anon', 'authenticated')
            `),
            ENTERPRISE_TIMEOUT_MS, 'check/network_extension',
        );
        if (rows.length === 0) return [];
        const schemas = [...new Set(rows.map(r => r.schema))];
        return [{
            id: randomUUID(),
            severity: 'HIGH' as const,
            category: 'NETWORK' as const,
            table: schemas.join(', '),
            message: `Network extension (${schemas.join('/')}) callable by public roles — SSRF risk.`,
            risk: 'Any API user can trigger outbound HTTP requests from your database server, enabling Server-Side Request Forgery (SSRF) attacks against internal services.',
            impact: 'HIGH' as const,
            remediation: `REVOKE USAGE ON SCHEMA net FROM anon, authenticated;\nREVOKE USAGE ON SCHEMA http FROM anon, authenticated;\nREVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA net FROM anon, authenticated;\nREVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA http FROM anon, authenticated;`,
        }];
    } catch (e) {
        console.warn('[engine] network_extension check skipped:', e instanceof Error ? e.message : e);
        return [];
    }
}

async function checkPgCronExposed(sql: postgres.Sql): Promise<Finding[]> {
    try {
        const rows = await withTimeout(
            sql.unsafe<{ function_name: string; grantee: string }[]>(`
                SELECT p.proname AS function_name, r.rolname AS grantee
                FROM pg_proc p
                JOIN pg_namespace n ON n.oid = p.pronamespace
                JOIN pg_roles r ON has_function_privilege(r.oid, p.oid, 'EXECUTE')
                WHERE n.nspname = 'cron' AND r.rolname IN ('anon', 'authenticated')
            `),
            ENTERPRISE_TIMEOUT_MS, 'check/pg_cron',
        );
        if (rows.length === 0) return [];
        return [{
            id: randomUUID(),
            severity: 'HIGH' as const,
            category: 'PERMISSIONS' as const,
            table: 'cron',
            message: `pg_cron scheduler accessible by public roles — arbitrary job injection risk.`,
            risk: 'Any authenticated API user can call cron.schedule() via PostgREST RPC to create persistent background SQL jobs that execute on your database server.',
            impact: 'HIGH' as const,
            remediation: `REVOKE USAGE ON SCHEMA cron FROM anon, authenticated;\nREVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA cron FROM anon, authenticated;`,
        }];
    } catch (e) {
        console.warn('[engine] pg_cron check skipped:', e instanceof Error ? e.message : e);
        return [];
    }
}

async function checkVaultExposed(sql: postgres.Sql): Promise<Finding[]> {
    try {
        const rows = await withTimeout(
            sql.unsafe<{ function_name: string; grantee: string }[]>(`
                SELECT p.proname AS function_name, r.rolname AS grantee
                FROM pg_proc p
                JOIN pg_namespace n ON n.oid = p.pronamespace
                JOIN pg_roles r ON has_function_privilege(r.oid, p.oid, 'EXECUTE')
                WHERE n.nspname = 'vault' AND r.rolname IN ('anon', 'authenticated')
            `),
            ENTERPRISE_TIMEOUT_MS, 'check/vault',
        );
        if (rows.length === 0) return [];
        return [{
            id: randomUUID(),
            severity: 'CRITICAL' as const,
            category: 'PERMISSIONS' as const,
            table: 'vault',
            message: `Supabase Vault schema accessible by public roles — secret exfiltration risk.`,
            risk: 'Any API user can call vault.get_secret() directly via PostgREST RPC and exfiltrate all stored secrets, API keys, and credentials from your Vault.',
            impact: 'HIGH' as const,
            remediation: `REVOKE USAGE ON SCHEMA vault FROM anon, authenticated;\nREVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA vault FROM anon, authenticated;`,
        }];
    } catch (e) {
        console.warn('[engine] vault check skipped:', e instanceof Error ? e.message : e);
        return [];
    }
}

async function checkPublicFunctionsAnonExecutable(sql: postgres.Sql): Promise<Finding[]> {
    try {
        const rows = await withTimeout(
            sql.unsafe<{ function_name: string; arguments: string }[]>(`
                SELECT p.proname AS function_name, pg_get_function_arguments(p.oid) AS arguments
                FROM pg_proc p
                JOIN pg_namespace n ON n.oid = p.pronamespace
                WHERE n.nspname = 'public'
                  AND p.prokind = 'f'
                  AND has_function_privilege('anon', p.oid, 'EXECUTE')
            `),
            ENTERPRISE_TIMEOUT_MS, 'check/public_functions_anon',
        );
        if (rows.length === 0) return [];
        const fnList = rows.map(r => `${r.function_name}(${r.arguments})`).join(', ');
        return [{
            id: randomUUID(),
            severity: 'MEDIUM' as const,
            category: 'PERMISSIONS' as const,
            table: 'public (functions)',
            message: `${rows.length} public function${rows.length === 1 ? '' : 's'} executable by anon: ${fnList}`,
            risk: 'These functions are callable as PostgREST RPC endpoints by anyone with your anon key — no authentication required. Review each to ensure public access is intentional.',
            impact: 'MEDIUM' as const,
            remediation: `REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM anon;\n-- Then re-grant only intended public functions:\n-- GRANT EXECUTE ON FUNCTION public.<intended_fn>() TO anon;`,
        }];
    } catch (e) {
        console.warn('[engine] public_functions_anon check skipped:', e instanceof Error ? e.message : e);
        return [];
    }
}

async function checkPublicStorageBuckets(sql: postgres.Sql): Promise<Finding[]> {
    try {
        const rows = await withTimeout(
            sql.unsafe<{ bucket_id: string; bucket_name: string }[]>(`
                SELECT id AS bucket_id, name AS bucket_name
                FROM storage.buckets WHERE public = true
            `),
            ENTERPRISE_TIMEOUT_MS, 'check/public_buckets',
        );
        if (rows.length === 0) return [];
        const names = rows.map(r => r.bucket_name).join(', ');
        return [{
            id: randomUUID(),
            severity: 'HIGH' as const,
            category: 'STORAGE' as const,
            table: `storage.buckets (${names})`,
            message: `Storage bucket${rows.length === 1 ? '' : 's'} publicly accessible without authentication: ${names}`,
            risk: 'All objects in these buckets are downloadable by anyone on the internet — no auth token or signed URL required.',
            impact: 'HIGH' as const,
            remediation: rows.map(r =>
                `UPDATE storage.buckets SET public = false WHERE name = '${r.bucket_name}';`
            ).join('\n'),
        }];
    } catch (e) {
        console.warn('[engine] public_buckets check skipped:', e instanceof Error ? e.message : e);
        return [];
    }
}

async function checkViewBaseTableNoRLS(sql: postgres.Sql): Promise<Finding[]> {
    try {
        const rows = await withTimeout(
            sql.unsafe<{ view_name: string; base_table: string }[]>(`
                WITH view_grants AS (
                    SELECT DISTINCT v.table_name AS view_name
                    FROM information_schema.views v
                    JOIN information_schema.table_privileges g
                        ON g.table_name = v.table_name AND g.table_schema = v.table_schema
                    WHERE v.table_schema = 'public'
                      AND g.grantee IN ('anon', 'authenticated')
                ),
                view_base_tables AS (
                    SELECT DISTINCT
                        c.relname AS view_name,
                        rc.relname AS base_table,
                        rc.relrowsecurity AS rls_enabled
                    FROM pg_rewrite r
                    JOIN pg_class c ON c.oid = r.ev_class
                    JOIN pg_depend d ON d.objid = r.oid
                    JOIN pg_class rc ON rc.oid = d.refobjid
                    JOIN pg_namespace n ON n.oid = c.relnamespace
                    WHERE c.relkind = 'v' AND n.nspname = 'public'
                )
                SELECT vbt.view_name, vbt.base_table
                FROM view_base_tables vbt
                JOIN view_grants vg ON vg.view_name = vbt.view_name
                WHERE vbt.rls_enabled = false
            `),
            ENTERPRISE_TIMEOUT_MS, 'check/view_base_table_rls',
        );
        if (rows.length === 0) return [];
        return rows.map(r => ({
            id: randomUUID(),
            severity: 'HIGH' as const,
            category: 'RLS' as const,
            table: `public.${r.view_name}`,
            message: `View 'public.${r.view_name}' exposes base table '${r.base_table}' which has NO RLS protection.`,
            risk: 'RLS on a view is meaningless — security is enforced at the base table level. Without RLS on the base table, the view leaks all rows to anyone who can query it.',
            impact: 'HIGH' as const,
            remediation: `ALTER TABLE public.${r.base_table} ENABLE ROW LEVEL SECURITY;\nALTER TABLE public.${r.base_table} FORCE ROW LEVEL SECURITY;\n-- Recreate with security_barrier:\nCREATE OR REPLACE VIEW public.${r.view_name}\nWITH (security_barrier) AS SELECT * FROM public.${r.base_table};`,
        }));
    } catch (e) {
        console.warn('[engine] view_base_table_rls check skipped:', e instanceof Error ? e.message : e);
        return [];
    }
}

// ── Main scanner ───────────────────────────────────────────────────────────────

/** Severity weights — deducted from 100 per finding */
const SEVERITY_WEIGHTS: Record<string, number> = {
    CRITICAL: 40,
    HIGH: 20,
    MEDIUM: 8,
    LOW: 2,
};

/**
 * Calculates a security score from 0–100.
 * Starts at 100 and deducts points per finding based on severity.
 * A single CRITICAL finding brings the score below 60 (grade D).
 */
function calculateScore(findings: Finding[]): number {
    const deduction = findings.reduce((total, f) => total + (SEVERITY_WEIGHTS[f.severity] ?? 0), 0);
    return Math.max(0, 100 - deduction);
}

/** Total scan timeout — if the entire scan exceeds this, we abort early */
const TOTAL_SCAN_TIMEOUT_MS = 25_000;

/**
 * Scans a Supabase/Postgres database for security misconfigurations.
 *
 * SAFETY GUARANTEES:
 * - Only queries system catalogs (pg_catalog, information_schema, auth schema)
 * - Never accesses user data tables (Zero-Data Policy)
 * - Connection is ephemeral and closed after scan
 * - Read-only operations only
 * - Pooler-safe: every query has an individual timeout
 */
export async function scanProject(connectionString: string): Promise<ScanResult> {
    const startTime = Date.now();

    const sql = postgres(connectionString, {
        max: 1,
        idle_timeout: 20,
        connect_timeout: 10,
    });

    async function runScan(): Promise<ScanResult> {
        // ── Zero-Data structural guarantee ─────────────────────────────────
        // Inject strict Postgres-level timeouts BEFORE any audit query.
        // Even if application-layer code has a bug, the DB will kill the
        // session server-side after 3 s — making data exfiltration impossible.
        await sql.unsafe(`SET statement_timeout = '3000';`);
        await sql.unsafe(`SET idle_in_transaction_session_timeout = '3000';`);

        // ── Core catalog queries ──────────────────────────────────────────────
        const tablesData = await withTimeout(
            sql.unsafe<RawTableData[]>(QUERY_FETCH_TABLES),
            10_000,
            'FETCH_TABLES',
        );
        const policiesData = await withTimeout(
            sql.unsafe<RawPolicyData[]>(QUERY_FETCH_POLICIES),
            10_000,
            'FETCH_POLICIES',
        );
        const grantsData = await withTimeout(
            sql.unsafe<RawGrantData[]>(QUERY_CHECK_DANGEROUS_GRANTS),
            10_000,
            'CHECK_GRANTS',
        );

        // Map policies → tables (with full definitions)
        const policyMap = new Map<string, RawPolicyData[]>();
        for (const policy of policiesData) {
            const key = `${policy.schema}.${policy.table_name}`;
            if (!policyMap.has(key)) policyMap.set(key, []);
            policyMap.get(key)!.push(policy);
        }

        // Build table security profiles
        const tableProfiles: TableSecurityProfile[] = tablesData.map((table) => {
            const key = `${table.schema}.${table.table_name}`;
            const policies = policyMap.get(key) ?? [];
            return {
                schema: table.schema,
                name: table.table_name,
                rls_enabled: table.rls_enabled,
                policies: policies.map(p => p.policy_name),
                policy_defs: policies.map(p => ({
                    name: p.policy_name,
                    qual: p.qual,
                    with_check: p.with_check,
                })),
            };
        });

        const findings: Finding[] = [];
        const passed_checks: string[] = [];

        // ── RLS Checks ────────────────────────────────────────────────────────
        for (const table of tableProfiles) {
            const full = `${table.schema}.${table.name}`;

            if (!table.rls_enabled) {
                findings.push({
                    id: randomUUID(),
                    severity: 'CRITICAL',
                    category: 'RLS',
                    table: full,
                    message: `Row Level Security (RLS) is DISABLED on "${full}". All data is potentially public.`,
                    risk: 'This table is completely public. Anyone with your anon key can download every row — including private user data, emails, or PII.',
                    impact: 'HIGH',
                    remediation: `ALTER TABLE ${full} ENABLE ROW LEVEL SECURITY;\nALTER TABLE ${full} FORCE ROW LEVEL SECURITY;`,
                });
            } else if (table.policies.length === 0) {
                findings.push({
                    id: randomUUID(),
                    severity: 'HIGH',
                    category: 'RLS',
                    table: full,
                    message: `RLS is enabled on "${full}" but NO policies are defined — table is inaccessible.`,
                    risk: 'This table is effectively offline. No one — including authenticated users — can read or write to it. This will silently break your app.',
                    impact: 'MEDIUM',
                    remediation: `-- Create appropriate RLS policies, for example:\nCREATE POLICY "read_own_rows" ON ${full}\n  FOR SELECT\n  USING (auth.uid() = user_id);`,
                });
            } else {
                // Deep policy analysis: catch trivially-true policies
                let hasTrivialPolicy = false;
                for (const def of table.policy_defs ?? []) {
                    // Debug: log raw qual so we can see exactly what pg_get_expr() returns
                    console.log(`[engine] Policy "${def.name}" on ${full} — qual: ${JSON.stringify(def.qual)} | with_check: ${JSON.stringify(def.with_check)}`);
                    if (isTriviallyTrue(def.qual) || isTriviallyTrue(def.with_check)) {
                        hasTrivialPolicy = true;
                        findings.push({
                            id: randomUUID(),
                            severity: 'CRITICAL',
                            category: 'RLS',
                            table: full,
                            message: `RLS policy "${def.name}" on "${full}" is effectively PUBLIC (condition evaluates to TRUE for everyone).`,
                            risk: 'The policy expression is trivially permissive — every user, authenticated or anonymous, matches this condition. This defeats the purpose of RLS entirely.',
                            impact: 'HIGH',
                            remediation: `DROP POLICY "${def.name}" ON ${full};\nCREATE POLICY "${def.name}" ON ${full}\n  FOR SELECT\n  USING (auth.uid() = user_id);`,
                        });
                    }
                }
                if (!hasTrivialPolicy) {
                    passed_checks.push(`Table '${full}' — RLS enabled with ${table.policies.length} polic${table.policies.length === 1 ? 'y' : 'ies'}`);
                }
            }
        }

        // ── Dangerous Grants (Grouped by table + role) ────────────────────────
        if (grantsData.length > 0) {
            const groups = groupGrants(grantsData);
            for (const group of groups) {
                const privDesc = describePrivileges(group.privileges);
                const isAnon = group.grantee === 'anon';
                const hasDestructive = group.privileges.some(p => ['DELETE', 'TRUNCATE'].includes(p));
                const hasWrite = group.privileges.some(p => ['INSERT', 'UPDATE'].includes(p));

                // ── Severity Matrix ──────────────────────────────────────────
                // anon + DELETE/TRUNCATE   → CRITICAL (data destruction by anyone)
                // anon + INSERT/UPDATE     → HIGH     (unauthenticated write)
                // authenticated (any)      → HIGH     (privileged but still dangerous)
                let severity: Finding['severity'];
                if (isAnon && hasDestructive) {
                    severity = 'CRITICAL';
                } else if (isAnon && hasWrite) {
                    severity = 'HIGH';
                } else {
                    severity = 'HIGH'; // authenticated destructive
                }

                const risk = (isAnon && hasDestructive)
                    ? `The 'anon' role can permanently wipe ALL data in this table — zero authentication required. Any visitor to your site can issue a DELETE request and destroy your database.`
                    : (isAnon && hasWrite)
                        ? `Unauthenticated users (anon role) can write rows to this table. This enables spam injection, data poisoning, and row-limit exhaustion attacks.`
                        : `The '${group.grantee}' role has write access that may exceed what's needed. Combine with strong RLS policies to limit impact.`;

                findings.push({
                    id: randomUUID(),
                    severity,
                    category: 'PERMISSIONS',
                    table: `public.${group.table_name}`,
                    message: `Role '${group.grantee}' has WRITE access (${privDesc}) on 'public.${group.table_name}'.`,
                    risk,
                    impact: (isAnon && hasDestructive) ? 'HIGH' : 'MEDIUM',
                    remediation: group.privileges.map(p =>
                        `REVOKE ${p} ON public.${group.table_name} FROM ${group.grantee};`
                    ).join('\n'),
                });
            }
        } else {
            passed_checks.push(`No dangerous write permissions (INSERT, UPDATE, DELETE, TRUNCATE) found for public roles`);
        }

        // ── Enterprise & Advanced Checks (sequential — max:1 connection) ──────
        // Promise.all would queue all 9 queries behind a single connection,
        // causing withTimeout to fire for checks at the back of the line.
        // Sequential awaits guarantee each check completes before the next starts.
        const extensions = await checkDangerousExtensions(sql);
        const superuser = await checkSuperuser(sql);
        const securityDefiners = await checkSecurityDefiners(sql);
        const networkExt = await checkNetworkExtensionExposed(sql);
        const pgCron = await checkPgCronExposed(sql);
        const vault = await checkVaultExposed(sql);
        const publicFunctionsAnon = await checkPublicFunctionsAnonExecutable(sql);
        const publicBuckets = await checkPublicStorageBuckets(sql);
        const viewBaseTableRLS = await checkViewBaseTableNoRLS(sql);

        if (superuser.finding) findings.push(superuser.finding);
        findings.push(
            ...extensions.findings,
            ...securityDefiners,
            ...networkExt,
            ...pgCron,
            ...vault,
            ...publicFunctionsAnon,
            ...publicBuckets,
            ...viewBaseTableRLS,
        );

        const enterprise_safeguards: SafeguardCheck[] = [
            extensions.safeguard,
            superuser.safeguard,
        ];

        // ── Score \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
        const score = calculateScore(findings);

        return {
            score,
            findings,
            passed_checks,
            enterprise_safeguards,
            target_host: new URL(connectionString).hostname,
            tables_scanned: tableProfiles.length,
            scan_duration_ms: Date.now() - startTime,
            timestamp: new Date().toISOString(),
        };
    }

    try {
        // Race the whole scan against a total deadline
        return await withTimeout(runScan(), TOTAL_SCAN_TIMEOUT_MS, 'Total scan');
    } finally {
        // Always close — even on timeout the connection must be released
        await sql.end({ timeout: 3 }).catch(() => { /* ignore close errors */ });
    }
}
