'use client';

import { useState } from 'react';
import {
    ShieldAlert,
    Shield,
    ShieldCheck,
    AlertTriangle,
    Lock,
    Terminal,
    CheckCircle2,
    ChevronDown,
    Copy,
    Check,
} from 'lucide-react';
import type { Finding } from '@/lib/scanner/types';

interface FindingsListProps {
    findings: Finding[];
    passed_checks: string[];
}

// ── Severity config ────────────────────────────────────────────────────────────

const SEVERITY = {
    CRITICAL: {
        card: 'border-rose-500/25 bg-rose-500/5 hover:border-rose-500/40',
        accent: 'bg-rose-500/10 border-rose-500/25',
        dot: 'bg-rose-500 shadow-rose-500/50',
        badge: 'bg-rose-500 text-white',
        icon: ShieldAlert,
        iconColor: 'text-rose-400',
        label: 'text-rose-400',
    },
    HIGH: {
        card: 'border-orange-500/25 bg-orange-500/5 hover:border-orange-500/40',
        accent: 'bg-orange-500/10 border-orange-500/25',
        dot: 'bg-orange-500 shadow-orange-500/50',
        badge: 'bg-orange-500 text-white',
        icon: AlertTriangle,
        iconColor: 'text-orange-400',
        label: 'text-orange-400',
    },
    MEDIUM: {
        card: 'border-amber-500/25 bg-amber-500/5 hover:border-amber-500/40',
        accent: 'bg-amber-500/10 border-amber-500/25',
        dot: 'bg-amber-500 shadow-amber-500/50',
        badge: 'bg-amber-500 text-slate-900',
        icon: Lock,
        iconColor: 'text-amber-400',
        label: 'text-amber-400',
    },
    _default: {
        card: 'border-blue-500/25 bg-blue-500/5 hover:border-blue-500/40',
        accent: 'bg-blue-500/10 border-blue-500/25',
        dot: 'bg-blue-500 shadow-blue-500/50',
        badge: 'bg-blue-500 text-white',
        icon: Terminal,
        iconColor: 'text-blue-400',
        label: 'text-blue-400',
    },
} as const;

function getSev(sev: string) {
    return SEVERITY[sev as keyof typeof SEVERITY] ?? SEVERITY._default;
}

// ── Copy button ────────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false);
    return (
        <button
            onClick={() => {
                navigator.clipboard.writeText(text);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
            }}
            className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-slate-300 transition-colors"
        >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            {copied ? 'Copied!' : 'Copy'}
        </button>
    );
}

// ── Finding card ───────────────────────────────────────────────────────────────

function FindingCard({ finding }: { finding: Finding }) {
    const [open, setOpen] = useState(false);
    const sev = getSev(finding.severity);
    const Icon = sev.icon;

    const impactColor = finding.impact === 'HIGH'
        ? 'text-rose-400 bg-rose-500/10 border-rose-500/25'
        : finding.impact === 'MEDIUM'
            ? 'text-amber-400 bg-amber-500/10 border-amber-500/25'
            : 'text-blue-400 bg-blue-500/10 border-blue-500/25';

    return (
        <div className={`rounded-xl border transition-all duration-150 overflow-hidden ${sev.card}`}>
            {/* Header row */}
            <div className="flex items-start gap-3 px-4 pt-4 pb-3">
                {/* Coloured dot */}
                <div className={`mt-1 w-2 h-2 rounded-full shrink-0 shadow-md ${sev.dot}`} />

                <div className="flex-1 min-w-0">
                    {/* Badges row */}
                    <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-md tracking-widest ${sev.badge}`}>
                            {finding.severity}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500 bg-slate-800/60 px-2 py-0.5 rounded-md">
                            {finding.category}
                        </span>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ml-auto ${impactColor}`}>
                            {finding.impact} IMPACT
                        </span>
                    </div>

                    {/* Table name */}
                    <p className={`text-sm font-bold font-mono mb-1 ${sev.label}`}>
                        {finding.table}
                    </p>

                    {/* Message */}
                    <p className="text-xs text-slate-400 leading-relaxed">
                        {finding.message}
                    </p>
                </div>
            </div>

            {/* Risk box */}
            <div className={`mx-4 mb-3 rounded-lg border p-3 ${sev.accent}`}>
                <div className="flex items-center gap-1.5 mb-1">
                    <AlertTriangle className={`w-3 h-3 shrink-0 ${sev.iconColor}`} />
                    <span className={`text-[10px] font-black uppercase tracking-widest ${sev.iconColor}`}>
                        Why this matters
                    </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{finding.risk}</p>
            </div>

            {/* Collapsible SQL fix */}
            <div className="mx-4 mb-4">
                <button
                    onClick={() => setOpen(!open)}
                    className="w-full flex items-center justify-between text-xs text-slate-400 hover:text-slate-200 bg-slate-900/60 hover:bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 transition-all"
                >
                    <span className="flex items-center gap-1.5">
                        <Terminal className="w-3 h-3 text-emerald-500" />
                        <span className="font-mono">View SQL Fix</span>
                    </span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
                </button>

                {open && (
                    <div className="mt-1.5 rounded-lg bg-slate-950 border border-slate-800 overflow-hidden animate-in slide-in-from-top-1 duration-150">
                        {/* Code header */}
                        <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-800/60 bg-slate-900/80">
                            <div className="flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full bg-rose-500/40" />
                                <div className="w-2 h-2 rounded-full bg-amber-500/40" />
                                <div className="w-2 h-2 rounded-full bg-emerald-500/40" />
                                <span className="text-[10px] text-slate-600 font-mono ml-1">remediation.sql</span>
                            </div>
                            <CopyButton text={finding.remediation} />
                        </div>
                        <pre className="p-3 text-xs font-mono text-emerald-400/90 whitespace-pre-wrap break-all leading-relaxed overflow-x-auto">
                            <code>{finding.remediation}</code>
                        </pre>
                    </div>
                )}
            </div>
        </div>
    );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function FindingsList({ findings, passed_checks }: FindingsListProps) {
    // Group findings by severity for ordered display
    const order = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
    const sorted = [...findings].sort(
        (a, b) => order.indexOf(a.severity) - order.indexOf(b.severity)
    );

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">

            {/* ── Security Findings ── */}
            <section>
                <div className="flex items-center gap-3 mb-5">
                    <div className="flex items-center gap-2">
                        <ShieldAlert className="w-5 h-5 text-rose-400" />
                        <h2 className="text-lg font-bold text-white">Security Findings</h2>
                    </div>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${findings.length > 0
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}>
                        {findings.length} {findings.length === 1 ? 'issue' : 'issues'}
                    </span>
                </div>

                {findings.length === 0 ? (
                    <div className="text-center py-12 rounded-2xl border border-emerald-500/20 bg-emerald-500/5">
                        <div className="inline-flex p-4 rounded-2xl bg-emerald-500/10 ring-1 ring-emerald-500/20 mb-4">
                            <Shield className="w-8 h-8 text-emerald-400" />
                        </div>
                        <h3 className="text-base font-bold text-emerald-400 mb-1">All Clear</h3>
                        <p className="text-sm text-slate-500 max-w-xs mx-auto">
                            No security issues detected. Your RLS configuration is solid.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {sorted.map((finding) => (
                            <FindingCard key={finding.id} finding={finding} />
                        ))}
                    </div>
                )}
            </section>

            {/* ── Verified Safeguards ── */}
            {passed_checks.length > 0 && (
                <section>
                    <div className="flex items-center gap-3 mb-5">
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="w-5 h-5 text-emerald-400" />
                            <h2 className="text-lg font-bold text-white">Verified Safeguards</h2>
                        </div>
                        <span className="text-xs font-bold px-2.5 py-1 rounded-full border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                            {passed_checks.length} passed
                        </span>
                    </div>

                    <div className="rounded-xl border border-emerald-500/15 bg-slate-900/40 overflow-hidden">
                        {/* Terminal chrome */}
                        <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-800/80 bg-slate-900/70">
                            <div className="flex gap-1.5">
                                <div className="w-2.5 h-2.5 rounded-full bg-rose-500/50" />
                                <div className="w-2.5 h-2.5 rounded-full bg-amber-500/50" />
                                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/50" />
                            </div>
                            <span className="text-[10px] text-slate-600 font-mono">
                                system-audit — {new Date().toISOString().slice(0, 19)}Z
                            </span>
                        </div>

                        <ul className="divide-y divide-slate-800/40">
                            {passed_checks.map((check, i) => (
                                <li
                                    key={i}
                                    className="flex items-center gap-3 px-4 py-3 hover:bg-emerald-500/5 transition-colors"
                                >
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                    <span className="text-sm font-mono text-slate-300">
                                        {check.replace('✅ ', '')}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </section>
            )}
        </div>
    );
}
