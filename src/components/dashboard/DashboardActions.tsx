'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCheckoutUrl } from '@/app/actions/billing';
import { Zap, Plus, Lock, Loader2 } from 'lucide-react';

interface DashboardActionsProps {
    isPro: boolean;
    projectCount: number;
}

/**
 * Client component that renders the dashboard header action buttons.
 * - Free users with < 1 project: normal "+ Add Project" button
 * - Free users with >= 1 project: locked "Upgrade to Add More" button + "🚀 Upgrade" banner button
 * - Pro users: normal "+ Add Project" button (no upgrade banner)
 */
export function DashboardActions({ isPro, projectCount }: DashboardActionsProps) {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const isLocked = !isPro && projectCount >= 1;

    async function handleUpgrade() {
        setLoading(true);
        try {
            const result = await getCheckoutUrl();
            if (result.error) {
                router.push('/login');
                return;
            }
            if (result.url) window.location.href = result.url;
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex items-center gap-2">
            {/* Upgrade button — only shown to free users */}
            {!isPro && (
                <button
                    onClick={handleUpgrade}
                    disabled={loading}
                    className="flex items-center gap-1.5 text-xs font-bold text-slate-900 bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-300 hover:to-orange-300 disabled:opacity-70 px-3 py-2 rounded-lg transition-all active:scale-95 shadow-md shadow-amber-500/20"
                >
                    {loading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                        <Zap className="w-3.5 h-3.5" />
                    )}
                    Upgrade to Agency
                </button>
            )}

            {/* Add project button — hidden if free tier limit hit */}
            {!isLocked && (
                <a
                    href="/new"
                    className="flex items-center gap-2 text-sm font-semibold text-slate-900 bg-emerald-400 hover:bg-emerald-300 px-4 py-2 rounded-lg transition-all active:scale-95"
                >
                    <Plus className="w-4 h-4" />
                    Add Project
                </a>
            )}
        </div>
    );
}
