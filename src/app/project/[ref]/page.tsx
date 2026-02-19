import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { deleteProject } from '@/app/actions/project';
import {
    ArrowLeft,
    ShieldCheck,
    ShieldAlert,
    Shield,
    Clock,
    BarChart2,
    Trash2,
    AlertTriangle,
    RefreshCw,
    CalendarDays,
} from 'lucide-react';

// ── Helpers ────────────────────────────────────────────────────────────────────

function getGrade(score: number | null) {
    if (score === null) return { grade: '—', text: 'text-slate-400', bg: 'bg-slate-800/60', border: 'border-slate-700' };
    if (score >= 90) return { grade: 'A', text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' };
    if (score >= 70) return { grade: 'B', text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' };
    return { grade: 'F', text: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/30' };
}

function scoreColor(score: number | null) {
    if (score === null) return 'text-slate-400';
    if (score >= 90) return 'text-emerald-400';
    if (score >= 70) return 'text-amber-400';
    return 'text-rose-400';
}

function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
}

function timeAgo(dateStr: string | null): string {
    if (!dateStr) return 'Never';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default async function ProjectPage({
    params,
}: {
    params: Promise<{ ref: string }>;
}) {
    const { ref } = await params;
    const projectRef = decodeURIComponent(ref);

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    // Fetch project (RLS guarantees user_id match)
    const { data: project } = await supabase
        .from('projects')
        .select('*')
        .eq('project_ref', projectRef)
        .eq('user_id', user.id)
        .single();

    if (!project) notFound();

    // Fetch scan history ordered newest first
    const { data: history } = await supabase
        .from('scan_history')
        .select('id, score, findings_count, created_at')
        .eq('project_id', project.id)
        .order('created_at', { ascending: false });

    const scanHistory = history ?? [];
    const grade = getGrade(project.last_scan_score);
    const GradeIcon = project.last_scan_score === null
        ? Shield
        : project.last_scan_score >= 90 ? ShieldCheck : ShieldAlert;

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200">
            {/* Background */}
            <div className="fixed inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-10 pointer-events-none" />

            {/* Nav */}
            <header className="relative border-b border-slate-800/60 bg-slate-950/80 backdrop-blur-sm sticky top-0 z-40">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
                    <Link
                        href="/dashboard"
                        className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Mission Control
                    </Link>
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-emerald-500/10 ring-1 ring-emerald-500/20">
                            <ShieldCheck className="w-4 h-4 text-emerald-500" />
                        </div>
                        <span className="font-bold text-white tracking-tight text-sm">Supascan</span>
                    </div>
                </div>
            </header>

            <main className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">

                {/* ── Project Header ── */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
                    <div className="flex items-center gap-4">
                        <div className={`flex items-center justify-center w-14 h-14 rounded-2xl border-2 ${grade.border} ${grade.bg}`}>
                            <span className={`text-2xl font-black ${grade.text}`}>{grade.grade}</span>
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-white">{project.name}</h1>
                            <p className="text-sm font-mono text-slate-500">{project.project_ref}</p>
                        </div>
                    </div>
                    <Link
                        href={`/new?project=${encodeURIComponent(project.project_ref)}`}
                        className="flex items-center gap-2 text-sm font-semibold text-slate-900 bg-emerald-400 hover:bg-emerald-300 px-4 py-2 rounded-lg transition-all active:scale-95 self-start sm:self-auto"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Scan Now
                    </Link>
                </div>

                {/* ── Stats Row ── */}
                <div className="grid grid-cols-3 gap-4">
                    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
                        <div className="flex items-center gap-2 text-xs text-slate-500 mb-1.5">
                            <GradeIcon className="w-3.5 h-3.5" />
                            Current Score
                        </div>
                        <p className={`text-3xl font-black ${scoreColor(project.last_scan_score)}`}>
                            {project.last_scan_score ?? '—'}
                        </p>
                    </div>
                    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
                        <div className="flex items-center gap-2 text-xs text-slate-500 mb-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            Last Scan
                        </div>
                        <p className="text-base font-bold text-slate-200">
                            {timeAgo(project.last_scan_at)}
                        </p>
                    </div>
                    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
                        <div className="flex items-center gap-2 text-xs text-slate-500 mb-1.5">
                            <BarChart2 className="w-3.5 h-3.5" />
                            Total Scans
                        </div>
                        <p className="text-3xl font-black text-slate-200">
                            {scanHistory.length}
                        </p>
                    </div>
                </div>

                {/* ── Scan History ── */}
                <section>
                    <div className="flex items-center gap-2 mb-4">
                        <CalendarDays className="w-4 h-4 text-slate-500" />
                        <h2 className="text-base font-bold text-white">Scan History</h2>
                        <span className="text-xs text-slate-600 bg-slate-800 px-2 py-0.5 rounded-full">{scanHistory.length}</span>
                    </div>

                    {scanHistory.length === 0 ? (
                        <div className="text-center py-12 rounded-xl border border-slate-800 bg-slate-900/40">
                            <BarChart2 className="w-8 h-8 text-slate-700 mx-auto mb-3" />
                            <p className="text-sm text-slate-500">No scans yet. Run your first scan to see history here.</p>
                        </div>
                    ) : (
                        <div className="rounded-xl border border-slate-800 bg-slate-900/40 overflow-hidden">
                            {/* Table header */}
                            <div className="grid grid-cols-[1fr,80px,80px,100px] gap-4 px-4 py-2.5 border-b border-slate-800 bg-slate-900/70">
                                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Date</span>
                                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider text-right">Score</span>
                                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider text-right">Findings</span>
                                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider text-right">Grade</span>
                            </div>

                            {/* Rows */}
                            <ul className="divide-y divide-slate-800/60">
                                {scanHistory.map((scan, i) => {
                                    const g = getGrade(scan.score);
                                    return (
                                        <li
                                            key={scan.id}
                                            className="grid grid-cols-[1fr,80px,80px,100px] gap-4 items-center px-4 py-3 hover:bg-slate-800/30 transition-colors"
                                        >
                                            <div>
                                                <span className="text-sm text-slate-300">{formatDate(scan.created_at)}</span>
                                                {i === 0 && (
                                                    <span className="ml-2 text-[9px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                                                        Latest
                                                    </span>
                                                )}
                                            </div>
                                            <span className={`text-sm font-mono font-bold text-right ${scoreColor(scan.score)}`}>
                                                {scan.score}
                                            </span>
                                            <span className={`text-sm font-mono text-right ${scan.findings_count > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                                                {scan.findings_count}
                                            </span>
                                            <div className="flex justify-end">
                                                <span className={`text-xs font-bold px-2 py-0.5 rounded-md border ${g.text} ${g.bg} ${g.border}`}>
                                                    {g.grade}
                                                </span>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    )}
                </section>

                {/* ── Danger Zone ── */}
                <section className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-6">
                    <div className="flex items-center gap-2 mb-1">
                        <AlertTriangle className="w-4 h-4 text-rose-400" />
                        <h2 className="text-base font-bold text-rose-400">Danger Zone</h2>
                    </div>
                    <p className="text-sm text-slate-500 mb-5">
                        Permanently delete <span className="text-slate-300 font-semibold">{project.name}</span> and all
                        its scan history. This action cannot be undone.
                    </p>

                    <form
                        action={async () => {
                            'use server';
                            await deleteProject(projectRef);
                        }}
                    >
                        <button
                            type="submit"
                            className="flex items-center gap-2 text-sm font-semibold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 hover:border-rose-500/50 px-4 py-2 rounded-lg transition-all active:scale-95"
                        >
                            <Trash2 className="w-4 h-4" />
                            Delete Project
                        </button>
                    </form>
                </section>

            </main>
        </div>
    );
}
