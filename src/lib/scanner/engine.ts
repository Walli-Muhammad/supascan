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

// ── Enterprise checks (each isolated, each with its own timeout) ───────────────

const ENTERPRISE_TIMEOUT_MS = 5_000; // 5 s per check — safe for poolers

async function checkPITR(sql: postgres.Sql): Promise<{ finding: Finding | null; safeguard: SafeguardCheck }> {
    try {
        const rows = await withTimeout(
            sql.unsafe<{ archive_mode: string }[]>('SHOW archive_mode;'),
            ENTERPRISE_TIMEOUT_MS,
            'PITR/archive_mode',
        );
        const archiveMode = rows[0]?.archive_mode ?? 'off';

        if (archiveMode === 'off') {
            return {
                finding: {
                    id: randomUUID(),
                    severity: 'CRITICAL',
                    category: 'PITR',
                    table: 'system',
                    message: 'Point-in-Time Recovery (PITR) is Disabled.',
                    risk: 'Without PITR, a single destructive query (accidental or malicious) could cause permanent, unrecoverable data loss. You have no rollback capability beyond your last full backup.',
                    impact: 'HIGH',
                    remediation: '-- PITR is a Supabase project setting. Enable it in:\n-- Dashboard → Project Settings → Database → Point in Time Recovery',
                    remediation_cli: 'Enable via Supabase Dashboard: Settings > Database > Point in Time Recovery',
                },
                safeguard: { name: 'Point-in-Time Recovery (PITR)', status: 'FAIL', detail: `archive_mode is '${archiveMode}'` },
            };
        }

        return {
            finding: null,
            safeguard: { name: 'Point-in-Time Recovery (PITR)', status: 'PASS', detail: `archive_mode is '${archiveMode}'` },
        };
    } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.warn('[engine] PITR check skipped:', msg);
        return {
            finding: null,
            safeguard: { name: 'Point-in-Time Recovery (PITR)', status: 'UNKNOWN', detail: 'Inaccessible via pooler — check Supabase dashboard. Requires direct Postgres connection.' },
        };
    }
}

async function checkMFA(sql: postgres.Sql): Promise<{ finding: Finding | null; safeguard: SafeguardCheck }> {
    try {
        const userRows = await withTimeout(
            sql.unsafe<{ count: string }[]>(`SELECT COUNT(*)::text AS count FROM auth.users WHERE confirmed_at IS NOT NULL`),
            ENTERPRISE_TIMEOUT_MS,
            'MFA/auth.users',
        );
        const mfaRows = await withTimeout(
            sql.unsafe<{ count: string }[]>(`SELECT COUNT(*)::text AS count FROM auth.mfa_factors WHERE status = 'verified'`),
            ENTERPRISE_TIMEOUT_MS,
            'MFA/auth.mfa_factors',
        );

        const userCount = parseInt(userRows[0]?.count ?? '0', 10);
        const mfaCount = parseInt(mfaRows[0]?.count ?? '0', 10);

        if (userCount > 0 && mfaCount === 0) {
            return {
                finding: {
                    id: randomUUID(),
                    severity: 'MEDIUM',
                    category: 'AUTH',
                    table: 'auth.users',
                    message: `MFA is not enforced: ${userCount} confirmed user${userCount === 1 ? '' : 's'}, 0 MFA factors registered.`,
                    risk: 'All user accounts are accessible with only a password. A single phishing attack or leaked credential gives an attacker full account access with no second layer of defense.',
                    impact: 'MEDIUM',
                    remediation: '-- Enforce MFA via Supabase Auth settings.\n-- Dashboard → Authentication → Settings → Multi-Factor Authentication',
                    remediation_cli: 'Enable MFA enforcement: Supabase Dashboard → Auth → Settings → MFA',
                },
                safeguard: { name: 'Multi-Factor Authentication (MFA)', status: 'FAIL', detail: `${userCount} users, 0 MFA factors` },
            };
        }

        if (userCount === 0) {
            return {
                finding: null,
                safeguard: { name: 'Multi-Factor Authentication (MFA)', status: 'WARN', detail: 'No confirmed users yet' },
            };
        }

        return {
            finding: null,
            safeguard: { name: 'Multi-Factor Authentication (MFA)', status: 'PASS', detail: `${mfaCount} active MFA factor${mfaCount === 1 ? '' : 's'} across ${userCount} users` },
        };
    } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.warn('[engine] MFA check skipped:', msg);
        return {
            finding: null,
            safeguard: { name: 'Multi-Factor Authentication (MFA)', status: 'UNKNOWN', detail: 'auth schema inaccessible via pooler. Requires direct Postgres connection.' },
        };
    }
}

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

// ── Main scanner ───────────────────────────────────────────────────────────────

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

        // ── Enterprise Checks (parallel, individually timed-out) ──────────────
        const [pitr, mfa, extensions, superuser] = await Promise.all([
            checkPITR(sql),
            checkMFA(sql),
            checkDangerousExtensions(sql),
            checkSuperuser(sql),
        ]);

        if (pitr.finding) findings.push(pitr.finding);
        if (mfa.finding) findings.push(mfa.finding);
        if (superuser.finding) findings.push(superuser.finding);
        findings.push(...extensions.findings);

        const enterprise_safeguards: SafeguardCheck[] = [
            pitr.safeguard,
            mfa.safeguard,
            extensions.safeguard,
            superuser.safeguard,
        ];

        // ── Score ─────────────────────────────────────────────────────────────
        let score = 100;
        for (const f of findings) {
            switch (f.severity) {
                case 'CRITICAL': score -= 20; break;
                case 'HIGH': score -= 10; break;
                case 'MEDIUM': score -= 5; break;
                case 'LOW': score -= 2; break;
            }
        }
        score = Math.max(0, Math.min(100, score));

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
