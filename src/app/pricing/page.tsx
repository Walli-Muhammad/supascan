import { CheckCircle2, Zap } from 'lucide-react';
import { UpgradeButton } from '@/components/UpgradeButton';
import { Footer } from '@/components/Footer';
import Link from 'next/link';

const FREE_FEATURES = [
    '1 Supabase project',
    'RLS misconfiguration scan',
    'Security grading (A–F)',
    'Passed checks summary',
];

const AGENCY_FEATURES = [
    'Unlimited projects',
    'Enterprise checks (PITR, MFA, Extensions)',
    'Deep RLS policy analysis',
    'PDF audit report export',
    'Scan history & score trends',
    'Priority support',
];

export default function PricingPage() {
    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col">
            {/* Header */}
            <header className="border-b border-slate-800/60 bg-slate-950/80 backdrop-blur-sm sticky top-0 z-40">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
                    <Link href="/" className="font-bold text-white tracking-tight text-sm">
                        ← Supascan
                    </Link>
                    <Link
                        href="/dashboard"
                        className="text-xs text-slate-400 hover:text-white transition-colors"
                    >
                        Dashboard
                    </Link>
                </div>
            </header>

            <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 py-20 w-full">
                {/* Hero */}
                <div className="text-center mb-14">
                    <p className="text-xs font-semibold text-emerald-400 uppercase tracking-widest mb-3">
                        Simple Pricing
                    </p>
                    <h1 className="text-4xl sm:text-5xl font-black text-white mb-4 leading-tight">
                        Start free. Scale when ready.
                    </h1>
                    <p className="text-slate-400 max-w-xl mx-auto">
                        Scan your first Supabase project for free. Upgrade when you need
                        unlimited projects, deep enterprise checks, and PDF reports for clients.
                    </p>
                </div>

                {/* Pricing cards */}
                <div className="grid md:grid-cols-2 gap-6 items-start">
                    {/* Free */}
                    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 flex flex-col">
                        <div className="mb-6">
                            <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">
                                Hobby
                            </p>
                            <div className="flex items-baseline gap-1">
                                <span className="text-4xl font-black text-white">Free</span>
                            </div>
                            <p className="text-slate-500 text-sm mt-1">Forever. No credit card required.</p>
                        </div>

                        <ul className="space-y-3 mb-8 flex-1">
                            {FREE_FEATURES.map((f) => (
                                <li key={f} className="flex items-center gap-2.5 text-sm text-slate-300">
                                    <CheckCircle2 className="w-4 h-4 text-slate-600 shrink-0" />
                                    {f}
                                </li>
                            ))}
                        </ul>

                        <Link
                            href="/login"
                            className="w-full text-center text-sm font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 py-3 rounded-xl transition-all"
                        >
                            Get Started Free
                        </Link>
                    </div>

                    {/* Agency */}
                    <div className="relative bg-gradient-to-b from-emerald-500/10 to-slate-900/60 border border-emerald-500/30 rounded-2xl p-8 flex flex-col shadow-2xl shadow-emerald-500/10">
                        {/* Popular badge */}
                        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                            <span className="bg-emerald-400 text-slate-900 text-xs font-black px-4 py-1 rounded-full uppercase tracking-wider">
                                Most Popular
                            </span>
                        </div>

                        <div className="mb-6">
                            <p className="text-sm font-semibold text-emerald-400 uppercase tracking-wider mb-2">
                                Agency
                            </p>
                            <div className="flex items-baseline gap-1">
                                <span className="text-4xl font-black text-white">$49</span>
                                <span className="text-slate-500">/mo</span>
                            </div>
                            <p className="text-slate-400 text-sm mt-1">For agencies managing multiple clients.</p>
                        </div>

                        <ul className="space-y-3 mb-8 flex-1">
                            {AGENCY_FEATURES.map((f) => (
                                <li key={f} className="flex items-center gap-2.5 text-sm text-slate-200">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                                    {f}
                                </li>
                            ))}
                        </ul>

                        <UpgradeButton />
                    </div>
                </div>

                {/* FAQ / trust line */}
                <p className="text-center text-xs text-slate-600 mt-12 mb-8">
                    Cancel anytime · Billed monthly · Payments secured by Lemon Squeezy
                </p>
            </main>

            <Footer />
        </div>
    );
}
