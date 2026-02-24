'use server';

import { scanProject } from '@/lib/scanner/engine';
import { validateConnectionString } from '@/lib/scanner/validator';
import { logScanAttempt } from '@/lib/audit';
import { createClient } from '@/lib/supabase/server';
import type { ScanResult } from '@/lib/scanner/types';

type ScanActionResult =
    | { success: true; report: ScanResult; saved: boolean }
    | { success: false; error: string; paywall?: true };

/**
 * Extracts a unique, human-readable project reference from a Postgres connection string.
 *
 * Handles three Supabase connection formats:
 * 1. Direct:  db.<ref>.supabase.co          → <ref>
 * 2. Pooler:  postgres.<ref>@<pooler-host>  → <ref>
 * 3. Fallback: host:port/db                 → host:port/db
 */
function extractProjectRef(connectionString: string): string {
    try {
        const url = new URL(connectionString);
        const host = url.hostname;
        const user = url.username;

        // Format 1 — Direct connection: db.<ref>.supabase.co
        if (host.includes('supabase.co')) {
            const parts = host.split('.');
            // db.ref-id.supabase.co → parts[1] = ref-id
            if (parts.length >= 3 && parts[0] === 'db') {
                return parts[1];
            }
        }

        // Format 2 — Pooler connection: user = postgres.<ref>
        if (user.includes('.')) {
            const suffix = user.split('.').slice(1).join('.');
            if (suffix) return suffix;
        }

        // Fallback — use host + db path as identifier
        const db = url.pathname.replace('/', '');
        return `${host}${db ? `/${db}` : ''}`;
    } catch {
        return 'unknown-project';
    }
}

/**
 * Server Action: Perform a security scan on a Supabase/Postgres database.
 *
 * SAFETY GUARANTEES:
 * 1. Validates connection string format before scanning
 * 2. Logs scan attempt to audit trail (compliance)
 * 3. Uses ephemeral connections (never persists credentials)
 * 4. Stores ONLY the project_ref — never the password
 * 5. If DB save fails, the user still receives their scan result
 */
export async function performScan(
    prevState: unknown,
    formData: FormData
): Promise<ScanActionResult> {
    try {
        // Step 1: Extract and validate connection string
        const connectionString = formData.get('connectionString');

        if (!connectionString || typeof connectionString !== 'string') {
            return { success: false, error: 'Connection string is required' };
        }

        const validation = validateConnectionString(connectionString);
        if (!validation.success) {
            return { success: false, error: validation.error };
        }

        // Step 2: Parse unique project ref (safe — no credentials)
        const projectRef = extractProjectRef(validation.data);

        // Step 3: Audit log (compliance)
        await logScanAttempt(validation.data, '127.0.0.1', true);

        // Step 4: Execute security scan
        const report = await scanProject(validation.data);

        // Step 5: Persist results if user is authenticated
        let saved = false;

        try {
            const supabase = await createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                // ── Free-tier paywall ─────────────────────────────────────────
                // Check if this is a NEW project_ref (rescans of existing are always allowed)
                const { data: existingProject } = await supabase
                    .from('projects')
                    .select('id')
                    .eq('user_id', user.id)
                    .eq('project_ref', projectRef)
                    .maybeSingle();

                const isNewProject = !existingProject;

                if (isNewProject) {
                    // Check pro status and project count in parallel
                    const [profileResult, countResult] = await Promise.all([
                        supabase.from('profiles').select('is_pro').eq('id', user.id).maybeSingle(),
                        supabase.from('projects').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
                    ]);

                    const isPro = profileResult.data?.is_pro ?? false;
                    const projectCount = countResult.count ?? 0;

                    if (!isPro && projectCount >= 1) {
                        return {
                            success: false,
                            error: 'Free tier is limited to 1 project. Upgrade to the Agency Plan to monitor unlimited projects.',
                            paywall: true,
                        };
                    }
                }

                // Upsert project — unique on (user_id, project_ref)
                const { data: project, error: projectError } = await supabase

                    .from('projects')
                    .upsert(
                        {
                            user_id: user.id,
                            name: projectRef,
                            project_ref: projectRef,
                            last_scan_score: report.score,
                            last_scan_at: report.timestamp,
                        },
                        {
                            onConflict: 'user_id,project_ref',
                            ignoreDuplicates: false,
                        }
                    )
                    .select('id')
                    .single();

                if (projectError) {
                    console.error('[scan] Project upsert failed:', projectError.message);
                } else if (project) {
                    const { error: historyError } = await supabase
                        .from('scan_history')
                        .insert({
                            project_id: project.id,
                            score: report.score,
                            findings_count: report.findings.length,
                            raw_results: report,
                        });

                    if (historyError) {
                        console.error('[scan] History insert failed:', historyError.message);
                    } else {
                        saved = true;
                    }
                }
            }
        } catch (dbError) {
            // Non-blocking: DB failure must never prevent the user from seeing results
            console.error('[scan] DB persistence error:', dbError);
        }

        return { success: true, report, saved };

    } catch (error) {
        console.error('[scan] Scan failed:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'An unexpected error occurred during scan',
        };
    }
}
