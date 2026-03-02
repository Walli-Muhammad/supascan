import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { ProjectCard } from '@/components/dashboard/ProjectCard';
import { DashboardActions } from '@/components/dashboard/DashboardActions';
import { signout } from '@/app/login/actions';
import {
    ShieldCheck,
    Plus,
    LogOut,
    Activity,
    Layers,
    AlertTriangle,
    Lock,
    Clock,
    FileText,
    ScanLine,
} from 'lucide-react';

export default async function Dashboard() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect('/login');

    const [projectResult, profileResult] = await Promise.all([
        supabase.from('projects').select('*').eq('user_id', user.id).order('last_scan_at', { ascending: false }),
        supabase.from('profiles').select('is_pro').eq('id', user.id).maybeSingle(),
    ]);

    if (projectResult.error) {
        console.error('[dashboard] Failed to fetch projects:', projectResult.error.message);
    }

    const projectList = projectResult.data ?? [];
    const isPro = profileResult.data?.is_pro ?? false;

    // Aggregate stats
    const avgScore = projectList.length > 0
        ? Math.round(projectList.reduce((sum, p) => sum + (p.last_scan_score ?? 0), 0) / projectList.length)
        : null;
    const criticalCount = projectList.filter(p => p.last_scan_score !== null && p.last_scan_score < 70).length;

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200">
            {/* Background grid */}
            <div className="fixed inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-10 pointer-events-none" />

            {/* Top Nav */}
            <header className="relative border-b border-slate-800/60 bg-slate-950/80 backdrop-blur-sm sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="p-1.5 rounded-lg bg-emerald-500/10 ring-1 ring-emerald-500/20">
                            <ShieldCheck className="w-4 h-4 text-emerald-500" />
                        </div>
                        <span className="font-bold text-white tracking-tight">Supascan</span>
                        <span className="text-slate-600 text-sm">/</span>
                        <span className="text-slate-400 text-sm">Mission Control</span>
                    </div>

                    <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-500 hidden sm:block">{user.email}</span>
                        <form action={signout}>
                            <button
                                type="submit"
                                className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg px-3 py-1.5 transition-all"
                            >
                                <LogOut className="w-3.5 h-3.5" />
                                Sign Out
                            </button>
                        </form>
                    </div>
                </div>
            </header>

            <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

                {/* Page header */}
                <div className="flex items-start justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">Mission Control</h1>
                        <p className="text-slate-400 text-sm mt-1">
                            {projectList.length === 0
                                ? 'No projects yet. Add your first project to begin.'
                                : `Monitoring ${projectList.length} project${projectList.length !== 1 ? 's' : ''}`}
                        </p>
                    </div>

                    <DashboardActions isPro={isPro} projectCount={projectList.length} />
                </div>

                {/* Stats bar — only show when there are projects */}
                {projectList.length > 0 && (
                    <div className="grid grid-cols-3 gap-4 mb-8">
                        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
                            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                                <Layers className="w-3.5 h-3.5" />
                                Total Projects
                            </div>
                            <p className="text-2xl font-bold text-white">{projectList.length}</p>
                        </div>
                        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
                            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                                <Activity className="w-3.5 h-3.5" />
                                Avg. Score
                            </div>
                            <p className={`text-2xl font-bold ${avgScore !== null && avgScore >= 90 ? 'text-emerald-400' : avgScore !== null && avgScore >= 70 ? 'text-amber-400' : 'text-rose-400'}`}>
                                {avgScore ?? '—'}
                            </p>
                        </div>
                        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
                            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                Critical Projects
                            </div>
                            <p className={`text-2xl font-bold ${criticalCount > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                                {criticalCount}
                            </p>
                        </div>
                    </div>
                )}

                {/* Project grid or empty state */}
                {projectList.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-700 bg-slate-900/30 py-20 px-8 text-center">
                        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 ring-1 ring-emerald-500/20">
                            <ShieldCheck className="h-7 w-7 text-emerald-400" />
                        </div>
                        <h2 className="text-lg font-semibold text-slate-100">
                            Run your first security audit
                        </h2>
                        <p className="mt-2 max-w-sm text-sm text-slate-400">
                            Connect a Supabase project and get your security score in under 60 seconds.
                            We check RLS policies, role permissions, exposed schemas, and more —
                            without ever reading your data.
                        </p>
                        <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
                            <Link
                                href="/new"
                                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 transition-colors active:scale-95"
                            >
                                <ScanLine className="h-4 w-4" />
                                Start Your First Scan
                            </Link>
                            <Link
                                href="/terms"
                                className="text-sm text-slate-500 hover:text-slate-400 transition-colors"
                            >
                                How we keep your data safe →
                            </Link>
                        </div>

                        {/* Trust signals */}
                        <div className="mt-8 flex flex-wrap justify-center items-center gap-6 text-xs text-slate-500">
                            <span className="flex items-center gap-1.5">
                                <Lock className="h-3.5 w-3.5" /> Zero-data promise
                            </span>
                            <span className="flex items-center gap-1.5">
                                <Clock className="h-3.5 w-3.5" /> Results in ~60s
                            </span>
                            <span className="flex items-center gap-1.5">
                                <FileText className="h-3.5 w-3.5" /> SOC2-style report
                            </span>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {projectList.map((project) => (
                            <ProjectCard key={project.id} project={project} />
                        ))}
                    </div>
                )}

                {/* Dashboard footer */}
                <div className="mt-16 pt-8 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-500">
                    <p>© {new Date().getFullYear()} Supascan</p>
                    <div className="flex gap-4">
                        <Link href="/terms" className="hover:text-slate-300 transition-colors">Terms</Link>
                        <Link href="/privacy" className="hover:text-slate-300 transition-colors">Privacy</Link>
                    </div>
                </div>
            </main>
        </div>
    );
}
