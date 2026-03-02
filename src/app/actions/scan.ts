'use server';

import { scanProject } from '@/lib/scanner/engine';
import { validateConnectionString } from '@/lib/scanner/validator';
import { logScanAttempt } from '@/lib/audit';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { headers } from 'next/headers';
import type { ScanResult } from '@/lib/scanner/types';

type ScanActionResult =
    | { success: true; report: ScanResult; saved: boolean }
    | { success: false; error: string; paywall?: true; rate_limited?: true };

/**
 * Derives a letter grade from a numeric score.
 * Must match the thresholds in ScoreCard.tsx getTier().
 */
function scoreToGrade(score: number): string {
    if (score >= 90) return 'A';
    if (score >= 75) return 'B';
    if (score >= 60) return 'C';
    if (score >= 40) return 'D';
    return 'F';
}

/**
 * Rate limit check against scan_consent_log.
 * Authenticated: 5 scans per hour per user_id.
 * Unauthenticated: 2 scans per hour per IP.
 * Throws 'RATE_LIMIT_EXCEEDED' — caller converts to a typed return value.
 */
async function checkRateLimit(userId: string | null, ipAddress: string | null): Promise<void> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    if (userId) {
        const { count } = await supabaseAdmin
            .from('scan_consent_log')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .gte('consented_at', oneHourAgo);
        if ((count ?? 0) >= 5) throw new Error('RATE_LIMIT_EXCEEDED');
    } else if (ipAddress) {
        const { count } = await supabaseAdmin
            .from('scan_consent_log')
            .select('*', { count: 'exact', head: true })
            .eq('ip_address', ipAddress)
            .is('user_id', null)
            .gte('consented_at', oneHourAgo);
        if ((count ?? 0) >= 2) throw new Error('RATE_LIMIT_EXCEEDED');
    }
}

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
 * 2. Logs consent to immutable audit trail BEFORE connecting (compliance)
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

        // Step 3: Extract IP + user early (needed for rate limit check)
        const reqHeaders = await headers();
        const ipRaw = reqHeaders.get('x-forwarded-for') ?? reqHeaders.get('x-real-ip') ?? null;
        const ip = ipRaw ? ipRaw.split(',')[0].trim() : null;
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        // Step 3a: Rate limit — checked BEFORE opening the target DB connection
        try {
            await checkRateLimit(user?.id ?? null, ip);
        } catch (e) {
            if (e instanceof Error && e.message === 'RATE_LIMIT_EXCEEDED') {
                return {
                    success: false,
                    error: 'You have reached the limit of 5 scans per hour. Please wait before scanning again.',
                    rate_limited: true,
                };
            }
            throw e;
        }

        // Step 4: Legacy audit log (compliance)
        await logScanAttempt(validation.data, ip ?? '127.0.0.1', true);

        // Step 5: Log consent (reuse reqHeaders, user, ip from Step 3)
        try {
            await supabaseAdmin.from('scan_consent_log').insert({
                user_id: user?.id ?? null,
                project_ref: projectRef,
                ip_address: ip,
                user_agent: reqHeaders.get('user-agent') ?? null,
            });
        } catch (consentErr) {
            // Non-blocking: log failure but never prevent the scan
            console.error('[scan] Consent log insert failed:', consentErr);
        }

        // Step 5: Execute security scan
        const report = await scanProject(validation.data);
        const grade = scoreToGrade(report.score);

        // Step 7: Persist results if user is authenticated
        let saved = false;

        try {
            // Reuse already-resolved user from the rate-limit step

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
                    // ── Insert full scan result into `scans` (new table) ──────
                    // Use supabaseAdmin so the write is guaranteed regardless
                    // of RLS edge cases at the service layer.
                    const { error: scanError } = await supabaseAdmin.from('scans').insert({
                        project_id: project.id,
                        user_id: user.id,
                        score: report.score,
                        grade,
                        findings: report.findings,
                        tables_analyzed: report.tables_scanned,
                        duration_ms: report.scan_duration_ms,
                    });

                    if (scanError) {
                        console.error('[scan] Scans insert failed:', scanError.message);
                    }

                    // ── Keep scan_history for backwards-compat (legacy cache) ─
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
            // Non-blocking: DB failure must never prevent the user seeing results
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
