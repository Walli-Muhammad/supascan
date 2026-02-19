import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ProjectCard } from '@/components/dashboard/ProjectCard';
import { signout } from '@/app/login/actions';
import {
    ShieldCheck,
    Plus,
    LogOut,
    Activity,
    Layers,
    AlertTriangle,
} from 'lucide-react';

export default async function Dashboard() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect('/login');

    // Fetch all projects for this user
    const { data: projects, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('last_scan_at', { ascending: false });

    if (error) {
        console.error('[dashboard] Failed to fetch projects:', error.message);
    }

    const projectList = projects ?? [];

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

                    <a
                        href="/new"
                        className="flex items-center gap-2 text-sm font-semibold text-slate-900 bg-emerald-400 hover:bg-emerald-300 px-4 py-2 rounded-lg transition-all active:scale-95"
                    >
                        <Plus className="w-4 h-4" />
                        Add Project
                    </a>
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
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                        <div className="p-4 rounded-2xl bg-emerald-500/10 ring-1 ring-emerald-500/20 mb-5">
                            <ShieldCheck className="w-10 h-10 text-emerald-500" />
                        </div>
                        <h2 className="text-xl font-semibold text-white mb-2">Welcome to Mission Control</h2>
                        <p className="text-slate-400 text-sm max-w-sm mb-6">
                            Add your first Supabase project to start monitoring its security health score.
                        </p>
                        <a
                            href="/new"
                            className="flex items-center gap-2 text-sm font-semibold text-slate-900 bg-emerald-400 hover:bg-emerald-300 px-5 py-2.5 rounded-lg transition-all active:scale-95"
                        >
                            <Plus className="w-4 h-4" />
                            Run Your First Scan
                        </a>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {projectList.map((project) => (
                            <ProjectCard key={project.id} project={project} />
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
