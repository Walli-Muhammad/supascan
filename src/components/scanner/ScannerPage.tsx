'use client';

import { useActionState } from 'react';
import { useSearchParams } from 'next/navigation';
import { performScan } from '@/app/actions/scan';
import { signout } from '@/app/login/actions';
import { ScanInput } from '@/components/scanner/ScanInput';
import { ScoreCard } from '@/components/scanner/ScoreCard';
import { FindingsList } from '@/components/scanner/FindingsList';
import { DownloadButton } from '@/components/scanner/DownloadButton';
import { ShieldCheck, Activity, LogOut } from 'lucide-react';

const initialState = {
    success: false as const,
    error: '',
};

/**
 * Client component containing the full scanner UI.
 * Extracted from page.tsx so the root page can be a server component
 * (needed for the auth redirect).
 */
export function ScannerPage() {
    const [state, formAction] = useActionState(performScan, initialState);
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

                    {/* Error Message */}
                    {'error' in state && state.error && (
                        <div className="mt-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-lg max-w-2xl mx-auto animate-in shake">
                            <div className="flex items-center gap-3">
                                <Activity className="w-5 h-5 text-rose-500" />
                                <p className="text-rose-200 text-sm font-medium">{state.error}</p>
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
                                <FindingsList findings={state.report.findings} passed_checks={state.report.passed_checks} />
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
