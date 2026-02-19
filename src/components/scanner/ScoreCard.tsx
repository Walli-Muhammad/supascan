import { AlertTriangle, ShieldAlert, BadgeCheck, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ScoreCardProps {
    score: number;
}

type ScoreTier = {
    grade: string;
    label: string;
    labelIcon: typeof BadgeCheck;
    ring: string;
    glow: string;
    scoreText: string;
    gradeText: string;
    badgeBg: string;
    badgeText: string;
    bg: string;
    arc: string;
};

function getTier(score: number): ScoreTier {
    if (score >= 90) return {
        grade: 'A',
        label: 'SECURE',
        labelIcon: BadgeCheck,
        ring: 'border-emerald-500/60',
        glow: 'shadow-emerald-500/20',
        scoreText: 'text-emerald-400',
        gradeText: 'text-emerald-300',
        badgeBg: 'bg-emerald-500/15 border-emerald-500/30',
        badgeText: 'text-emerald-400',
        bg: 'bg-emerald-500/5',
        arc: '#10b981',
    };
    if (score >= 70) return {
        grade: 'B',
        label: 'WARNING',
        labelIcon: AlertTriangle,
        ring: 'border-amber-500/60',
        glow: 'shadow-amber-500/20',
        scoreText: 'text-amber-400',
        gradeText: 'text-amber-300',
        badgeBg: 'bg-amber-500/15 border-amber-500/30',
        badgeText: 'text-amber-400',
        bg: 'bg-amber-500/5',
        arc: '#f59e0b',
    };
    return {
        grade: 'F',
        label: 'CRITICAL',
        labelIcon: ShieldAlert,
        ring: 'border-rose-500/60',
        glow: 'shadow-rose-500/20',
        scoreText: 'text-rose-400',
        gradeText: 'text-rose-300',
        badgeBg: 'bg-rose-500/15 border-rose-500/30',
        badgeText: 'text-rose-400',
        bg: 'bg-rose-500/5',
        arc: '#ef4444',
    };
}

export function ScoreCard({ score }: ScoreCardProps) {
    const tier = getTier(score);
    const Icon = tier.labelIcon;

    // SVG arc progress
    const radius = 78;
    const circumference = 2 * Math.PI * radius;
    const progress = (score / 100) * circumference;
    const gap = circumference - progress;

    return (
        <div className={cn(
            'rounded-2xl border p-6 flex flex-col items-center text-center transition-all duration-500 animate-in fade-in zoom-in-95',
            tier.ring,
            tier.bg,
            'shadow-xl',
            tier.glow,
        )}>
            {/* SVG score ring */}
            <div className="relative w-48 h-48 mb-4">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 180 180">
                    {/* Track */}
                    <circle
                        cx="90" cy="90" r={radius}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="8"
                        className="text-slate-800"
                    />
                    {/* Progress arc */}
                    <circle
                        cx="90" cy="90" r={radius}
                        fill="none"
                        stroke={tier.arc}
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={`${progress} ${gap}`}
                        style={{ filter: `drop-shadow(0 0 6px ${tier.arc}80)` }}
                    />
                </svg>

                {/* Centre content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <Icon className={cn('w-6 h-6 mb-1 opacity-70', tier.scoreText)} />
                    <span className={cn('text-6xl font-black tabular-nums leading-none', tier.scoreText)}>
                        {score}
                    </span>
                    <span className="text-xs text-slate-500 mt-1 uppercase tracking-widest">/ 100</span>
                </div>
            </div>

            {/* Grade badge */}
            <div className={cn(
                'flex items-center gap-2 px-4 py-1.5 rounded-full border text-sm font-bold uppercase tracking-widest mb-3',
                tier.badgeBg,
                tier.badgeText,
            )}>
                <Icon className="w-3.5 h-3.5" />
                {tier.label}
            </div>

            {/* Grade letter */}
            <div className="flex items-center gap-2">
                <TrendingUp className="w-3.5 h-3.5 text-slate-600" />
                <span className="text-xs text-slate-500">Security Grade</span>
                <span className={cn('text-xl font-black', tier.gradeText)}>{tier.grade}</span>
            </div>
        </div>
    );
}
