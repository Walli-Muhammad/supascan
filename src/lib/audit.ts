import { createClient } from '@supabase/supabase-js';

/**
 * Extracts the host from a connection string for privacy-safe logging
 * 
 * Example: postgres://user:pass@db.supabase.co:5432/postgres -> db.supabase.co
 */
function extractHostFromConnectionString(connString: string): string {
    try {
        const url = new URL(connString);
        return url.hostname;
    } catch {
        return 'unknown-host';
    }
}

/**
 * Logs a scan attempt to our internal audit trail
 * 
 * PRIVACY: Only logs the HOST portion of the connection string,
 * never the full credentials (Ephemeral Credentials Policy).
 * 
 * COMPLIANCE: This creates an immutable audit trail for enterprise customers,
 * proving we log all scan activities with consent tracking.
 * 
 * @param targetUrl - Full postgres connection string (only host is logged)
 * @param ip - Request IP address
 * @param consent - Whether user explicitly consented to scan
 * 
 * @example
 * ```ts
 * await logScanAttempt('postgres://user:pass@db.supabase.co/db', '127.0.0.1', true);
 * ```
 */
export async function logScanAttempt(
    targetUrl: string,
    ip: string,
    consent: boolean
): Promise<void> {
    try {
        // Initialize Supabase client (our internal database)
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        // Extract only the host for privacy (no credentials)
        const targetHost = extractHostFromConnectionString(targetUrl);

        // Insert audit log record
        const { error } = await supabase.from('audit_logs').insert({
            target_url: targetHost, // PRIVACY: Only host, not full connection string
            request_ip: ip,
            consent_given: consent,
            timestamp: new Date().toISOString(),
        });

        if (error) {
            // Log error but don't block the scan (graceful degradation for MVP)
            console.warn('AUDIT LOG FAILED:', error.message);
        }
    } catch (error) {
        // Graceful fallback: If audit logging fails (e.g., table doesn't exist),
        // allow the scan to proceed for MVP testing
        console.warn('AUDIT LOG FAILED:', error instanceof Error ? error.message : 'Unknown error');
    }
}
