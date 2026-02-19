import { ShieldCheck, ShieldAlert, Shield, Clock, ArrowRight, History } from 'lucide-react';
import Link from 'next/link';

interface Project {
    id: string;
    name: string;
    project_ref: string;
    last_scan_score: number | null;
    last_scan_at: string | null;
}

interface ProjectCardProps {
    project: Project;
}

function getGrade(score: number | null): { grade: string; label: string; bg: string; border: string; text: string; icon: typeof ShieldCheck } {
    if (score === null) return { grade: '—', label: 'Not scanned', bg: 'bg-slate-800/60', border: 'border-slate-700', text: 'text-slate-400', icon: Shield };
    if (score >= 90) return { grade: 'A', label: 'Secure', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', icon: ShieldCheck };
    if (score >= 70) return { grade: 'B', label: 'Fair', bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400', icon: Shield };
    return { grade: 'F', label: 'Critical', bg: 'bg-rose-500/10', border: 'border-rose-500/30', text: 'text-rose-400', icon: ShieldAlert };
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

export function ProjectCard({ project }: ProjectCardProps) {
    const grade = getGrade(project.last_scan_score);
    const Icon = grade.icon;

    return (
        <div className={`group relative rounded-xl border ${grade.border} bg-slate-900/60 p-5 hover:bg-slate-900/90 transition-all duration-200 hover:shadow-lg hover:shadow-black/20 flex flex-col`}>
            {/* Top row: grade + status */}
            <div className="flex items-start justify-between mb-4">
                <div className={`flex items-center justify-center w-12 h-12 rounded-xl ${grade.bg} border ${grade.border}`}>
                    <span className={`text-xl font-black ${grade.text}`}>{grade.grade}</span>
                </div>
                <div className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${grade.bg} ${grade.text} border ${grade.border}`}>
                    <Icon className="w-3 h-3" />
                    {grade.label}
                </div>
            </div>

            {/* Project info */}
            <div className="mb-4 flex-1">
                <h3 className="text-base font-semibold text-slate-100 truncate mb-0.5">
                    {project.name}
                </h3>
                <p className="text-xs text-slate-500 font-mono truncate">{project.project_ref}</p>
            </div>

            {/* Meta row */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Clock className="w-3 h-3" />
                    <span>{timeAgo(project.last_scan_at)}</span>
                </div>
                {project.last_scan_score !== null && (
                    <span className={`text-xs font-mono font-bold ${grade.text}`}>
                        {project.last_scan_score}/100
                    </span>
                )}
            </div>

            {/* Action buttons — always visible */}
            <div className="flex gap-2">
                <Link
                    href={`/project/${encodeURIComponent(project.project_ref)}`}
                    className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-300 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 rounded-lg py-2 transition-all"
                >
                    <History className="w-3.5 h-3.5" />
                    History
                </Link>
                <Link
                    href={`/new?project=${encodeURIComponent(project.project_ref)}`}
                    className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-900 bg-emerald-400 hover:bg-emerald-300 rounded-lg py-2 transition-all"
                >
                    Scan Now
                    <ArrowRight className="w-3.5 h-3.5" />
                </Link>
            </div>
        </div>
    );
}
