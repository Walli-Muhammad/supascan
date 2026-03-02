import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ScannerPage } from '@/components/scanner/ScannerPage';

/**
 * /new — Authenticated scanner page.
 * Logged-in users land here to run a new scan.
 * Unauthenticated users are sent to /login.
 */
export default async function NewScanPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect('/login');

    const { data: profile } = await supabase
        .from('profiles')
        .select('is_pro')
        .eq('id', user.id)
        .maybeSingle();

    const isPro = profile?.is_pro ?? false;

    return <ScannerPage isPro={isPro} />;
}
