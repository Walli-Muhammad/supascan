import { createClient } from '@supabase/supabase-js';

/**
 * Supabase admin client using the SERVICE_ROLE key.
 * Bypasses RLS — ONLY use server-side for trusted internal operations:
 *   - Writing to scan_consent_log (no user INSERT policy)
 *   - Writing scan results with guaranteed identity
 * NEVER expose this client to the browser.
 */
export const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    }
);
