import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { ShieldCheck, LayoutDashboard, LogIn, Zap } from 'lucide-react';

export async function Navbar() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    return (
        <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-slate-950/80 backdrop-blur-md">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2.5 group">
                    <div className="p-1.5 rounded-lg bg-emerald-500/10 ring-1 ring-emerald-500/20 group-hover:bg-emerald-500/20 transition-colors">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    </div>
                    <span className="font-bold text-white tracking-tight">Supascan</span>
                    <span className="hidden sm:block text-[10px] font-semibold text-emerald-400/70 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                        Beta
                    </span>
                </Link>

                {/* Nav links */}
                <nav className="hidden md:flex items-center gap-6 text-sm text-slate-400">
                    <a href="#features" className="hover:text-white transition-colors">Features</a>
                    <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
                </nav>

                {/* CTA */}
                <div className="flex items-center gap-3">
                    {user ? (
                        <Link
                            href="/dashboard"
                            className="flex items-center gap-2 text-sm font-semibold text-slate-900 bg-emerald-400 hover:bg-emerald-300 px-4 py-2 rounded-lg transition-all active:scale-95"
                        >
                            <LayoutDashboard className="w-4 h-4" />
                            Dashboard
                        </Link>
                    ) : (
                        <>
                            <Link
                                href="/login"
                                className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors"
                            >
                                <LogIn className="w-4 h-4" />
                                Login
                            </Link>
                            <Link
                                href="/login"
                                className="flex items-center gap-2 text-sm font-semibold text-slate-900 bg-emerald-400 hover:bg-emerald-300 px-4 py-2 rounded-lg transition-all active:scale-95"
                            >
                                <Zap className="w-4 h-4" />
                                Get Started Free
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
}
