'use client';

import { useActionState, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { performScan } from '@/app/actions/scan';
import { signout } from '@/app/login/actions';
import { ScanInput } from '@/components/scanner/ScanInput';
import { ScoreCard } from '@/components/scanner/ScoreCard';
import { FindingsList } from '@/components/scanner/FindingsList';
import { DownloadButton } from '@/components/scanner/DownloadButton';
import { UpgradeButton } from '@/components/UpgradeButton';
import { ShieldCheck, Activity, LogOut, Clock } from 'lucide-react';

const initialState = {
    success: false as const,
    error: '',
};

const READ_ONLY_SQL = `-- Step 1: Create the read-only role
CREATE ROLE supascan_readonly WITH LOGIN PASSWORD 'replace_with_strong_password';
-- Step 2: Allow the role to connect to the database
GRANT CONNECT ON DATABASE postgres TO supascan_readonly;
-- Step 3: Allow the role to see the public schema
GRANT USAGE ON SCHEMA public TO supascan_readonly;
-- Step 4: Grant SELECT on all current tables in public (for pg_catalog access)
GRANT SELECT ON ALL TABLES IN SCHEMA public TO supascan_readonly;
-- Step 5: Grant access to system catalog schemas used by the scanner
GRANT USAGE ON SCHEMA pg_catalog TO supascan_readonly;
GRANT USAGE ON SCHEMA information_schema TO supascan_readonly;
-- Step 6: Grant SELECT on storage schema (for bucket checks)
GRANT USAGE ON SCHEMA storage TO supascan_readonly;
GRANT SELECT ON storage.buckets TO supascan_readonly;
-- Supascan only queries system catalogs.
-- This role cannot read, modify, or delete any of your application data.`;

/**
 * Client component containing the full scanner UI.
 * Extracted from page.tsx so the root page can be a server component
 * (needed for the auth redirect).
 */
export function ScannerPage({ isPro }: { isPro: boolean }) {
    const [state, formAction] = useActionState(performScan, initialState);
    const [showReadOnly, setShowReadOnly] = useState(false);
    const [copied, setCopied] = useState(false);


    function handleCopy() {
        navigator.clipboard.writeText(READ_ONLY_SQL);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }
    const searchParams = useSearchParams();

    // Build a template connection string when ?project= is present
    // The user still needs to paste their password — we never store it
    const projectParam = searchParams.get('project');
    const defaultConnectionString = projectParam
        ? `postgres://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@${projectParam}:6543/postgres`
        : undefined;

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 selection:bg-emerald-500/30">
            {/* Background Grid Pattern */}
            <div className="fixed inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-20 pointer-events-none" />

            {/* Top-right Sign Out */}
            <div className="fixed top-4 right-4 z-50">
                <form action={signout}>
                    <button
                        type="submit"
                        className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-300 bg-slate-900/80 hover:bg-slate-800 border border-slate-800 rounded-lg px-3 py-2 transition-all backdrop-blur-sm"
                    >
                        <LogOut className="w-3.5 h-3.5" />
                        Sign Out
                    </button>
                </form>
            </div>

            <main className="relative max-w-6xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
                {/* Header Section */}
                <div className="text-center space-y-4 mb-16 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="inline-flex items-center justify-center p-2 bg-emerald-500/10 rounded-full mb-4 ring-1 ring-emerald-500/20">
                        <ShieldCheck className="w-6 h-6 text-emerald-500 mr-2" />
                        <span className="text-sm font-medium text-emerald-400 tracking-wide uppercase">Project Sentinel Active</span>
                    </div>

                    <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400">
                        Supascan
                    </h1>

                    <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
                        Automated security auditor for your Supabase projects. Detect <span className="text-rose-400 font-medium">RLS misconfigurations</span> and public data leaks in seconds.
                    </p>
                </div>

                {/* Input Form Section */}
                <div className="mb-16 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
                    <form action={formAction}>
                        <ScanInput defaultValue={defaultConnectionString} />
                    </form>

                    {/* ── Read-only role snippet ──────────────────────────────── */}
                    <div className="max-w-2xl mx-auto mt-4">
                        <button
                            type="button"
                            onClick={() => setShowReadOnly(v => !v)}
                            className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-300 transition-colors group"
                        >
                            <span className="text-slate-600 group-hover:text-emerald-500 transition-colors">🔒</span>
                            <span>Prefer a Read-Only Role?</span>
                            <span className={`transition-transform duration-200 ${showReadOnly ? 'rotate-180' : ''}`}>▾</span>
                        </button>

                        {showReadOnly && (
                            <div className="mt-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 animate-in fade-in slide-in-from-top-2 duration-200">
                                <p className="text-xs text-slate-400 mb-3">
                                    Run this in your{' '}
                                    <a
                                        href="https://supabase.com/dashboard/project/_/sql"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-emerald-400 hover:text-emerald-300 underline"
                                    >
                                        Supabase SQL Editor
                                    </a>
                                    . It creates a dedicated read-only role with the minimum permissions Supascan needs.{' '}
                                    <strong className="text-white">Your application roles and data are completely unaffected.</strong>
                                </p>
                                <div className="relative">
                                    <pre className="text-xs font-mono text-slate-300 bg-slate-900 rounded-lg p-4 overflow-x-auto leading-relaxed border border-slate-800">{READ_ONLY_SQL}</pre>
                                    <button
                                        type="button"
                                        onClick={handleCopy}
                                        className="absolute top-2 right-2 text-[10px] font-bold px-2 py-1 rounded-md bg-slate-800 border border-slate-700 hover:border-emerald-500/40 text-slate-400 hover:text-emerald-400 transition-all"
                                    >
                                        {copied ? '✓ Copied!' : 'Copy'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Rate limit banner */}
                    {'rate_limited' in state && state.rate_limited && (
                        <div className="mt-6 max-w-2xl mx-auto rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 flex items-start gap-3 animate-in fade-in duration-300">
                            <Clock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-semibold text-amber-400">Scan limit reached</p>
                                <p className="text-sm text-amber-300/80 mt-0.5">
                                    You can run up to 5 scans per hour. Please wait a moment before scanning again.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Error / Paywall Message */}
                    {'error' in state && state.error && (
                        <div className={`mt-6 p-4 rounded-lg max-w-2xl mx-auto animate-in shake ${state.paywall ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-rose-500/10 border border-rose-500/20'
                            }`}>
                            <div className="flex flex-col gap-4">
                                <div className="flex items-center gap-3">
                                    <Activity className={`w-5 h-5 ${state.paywall ? 'text-amber-500' : 'text-rose-500'}`} />
                                    <p className={`text-sm font-medium ${state.paywall ? 'text-amber-200' : 'text-rose-200'}`}>
                                        {state.error}
                                    </p>
                                </div>
                                {state.paywall && (
                                    <div className="pt-2 border-t border-amber-500/20">
                                        <UpgradeButton />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Results Section */}
                {'report' in state && state.success && state.report && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                        {/* Results toolbar */}
                        <div className="flex items-center justify-between bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-3 backdrop-blur-sm">
                            <div className="flex items-center gap-2.5">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
                                <span className="text-sm font-semibold text-slate-300 tracking-wide">Audit Results</span>
                                <span className="text-slate-700">·</span>
                                <span className="text-xs font-mono text-slate-500">{state.report.target_host}</span>
                                {'saved' in state && state.saved && (
                                    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2.5 py-0.5">
                                        <ShieldCheck className="w-3 h-3" />
                                        Saved
                                    </span>
                                )}
                            </div>
                            <DownloadButton
                                report={state.report}
                                targetHost={state.report.target_host}
                            />
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                            {/* Left sidebar — sticky on desktop, static on mobile */}
                            <div className="lg:col-span-4 h-fit lg:sticky lg:top-24 space-y-4">
                                <ScoreCard score={state.report.score} />

                                {/* Metadata card */}
                                <div className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden">
                                    <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-800/80 bg-slate-900/70">
                                        <Activity className="w-3.5 h-3.5 text-emerald-500" />
                                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Scan Metadata</span>
                                    </div>
                                    <dl className="divide-y divide-slate-800/60">
                                        <div className="flex items-center justify-between px-4 py-3">
                                            <dt className="text-xs text-slate-500">Tables Analyzed</dt>
                                            <dd className="text-sm font-mono font-bold text-slate-200">{state.report.tables_scanned}</dd>
                                        </div>
                                        <div className="flex items-center justify-between px-4 py-3">
                                            <dt className="text-xs text-slate-500">Duration</dt>
                                            <dd className="text-sm font-mono font-bold text-slate-200">{state.report.scan_duration_ms}<span className="text-slate-600 font-normal text-xs">ms</span></dd>
                                        </div>
                                        <div className="flex items-center justify-between px-4 py-3">
                                            <dt className="text-xs text-slate-500">Issues Found</dt>
                                            <dd className={`text-sm font-mono font-bold ${state.report.findings.length > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                                                {state.report.findings.length}
                                            </dd>
                                        </div>
                                        <div className="flex items-center justify-between px-4 py-3">
                                            <dt className="text-xs text-slate-500">Passed Checks</dt>
                                            <dd className="text-sm font-mono font-bold text-emerald-400">{state.report.passed_checks.length}</dd>
                                        </div>
                                    </dl>
                                </div>
                            </div>

                            {/* Right column — findings, scrolls freely */}
                            <div className="lg:col-span-8">
                                <FindingsList findings={state.report.findings} passed_checks={state.report.passed_checks} isPro={isPro} />
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
