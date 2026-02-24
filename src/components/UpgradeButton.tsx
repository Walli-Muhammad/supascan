'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCheckoutUrl } from '@/app/actions/billing';
import { Loader2, Zap } from 'lucide-react';

interface UpgradeButtonProps {
    className?: string;
}

/**
 * Upgrade button for the Agency pricing tier.
 * - Logged-in users → fetches a personalised Lemon Squeezy checkout URL and redirects.
 * - Unauthenticated users (server returns error) → redirects to /login first.
 */
export function UpgradeButton({ className }: UpgradeButtonProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    async function handleClick() {
        setLoading(true);
        setError(null);

        try {
            const result = await getCheckoutUrl();

            if (result.error) {
                // Not logged in — send them to login then come back to pricing
                if (result.error.includes('logged in')) {
                    router.push('/login?redirect=/#pricing');
                    return;
                }
                setError(result.error);
                return;
            }

            if (!result.url) return; // shouldn't happen, but satisfies TypeScript

            // Redirect to Lemon Squeezy checkout
            window.location.href = result.url;
        } catch {
            setError('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex flex-col gap-2 w-full">
            <button
                onClick={handleClick}
                disabled={loading}
                className={
                    className ??
                    'w-full flex items-center justify-center gap-2 text-sm font-bold text-slate-900 bg-emerald-400 hover:bg-emerald-300 disabled:opacity-70 disabled:cursor-not-allowed py-3 rounded-xl transition-all active:scale-95 shadow-lg shadow-emerald-500/20'
                }
            >
                {loading ? (
                    <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Loading secure checkout…
                    </>
                ) : (
                    <>
                        <Zap className="w-4 h-4" />
                        Start Agency Trial
                    </>
                )}
            </button>

            {error && (
                <p className="text-xs text-red-400 text-center">{error}</p>
            )}
        </div>
    );
}
