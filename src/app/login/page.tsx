import { login, signup } from './actions';
import { ShieldCheck, Lock, Mail } from 'lucide-react';

interface LoginPageProps {
    searchParams: Promise<{ error?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
    const params = await searchParams;
    const error = params.error;

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 flex items-center justify-center px-4">
            {/* Background grid */}
            <div className="fixed inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-10 pointer-events-none" />

            <div className="relative w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">

                {/* Card */}
                <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-800 rounded-2xl p-8 shadow-2xl shadow-black/40">

                    {/* Logo / Header */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-500/10 ring-1 ring-emerald-500/20 mb-4">
                            <ShieldCheck className="w-7 h-7 text-emerald-500" />
                        </div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">
                            Supascan
                        </h1>
                        <p className="text-slate-400 text-sm mt-1">Command Center</p>
                    </div>

                    {/* Error Banner */}
                    {error && (
                        <div className="mb-6 flex items-start gap-3 bg-rose-500/10 border border-rose-500/20 rounded-lg px-4 py-3">
                            <Lock className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                            <p className="text-sm text-rose-300">{decodeURIComponent(error)}</p>
                        </div>
                    )}

                    {/* Form */}
                    <form className="space-y-4">
                        {/* Email */}
                        <div className="space-y-1.5">
                            <label htmlFor="email" className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                                Email
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    required
                                    autoComplete="email"
                                    placeholder="you@company.com"
                                    className="w-full bg-slate-800/60 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/50 transition-all"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div className="space-y-1.5">
                            <label htmlFor="password" className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                                Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    required
                                    autoComplete="current-password"
                                    placeholder="••••••••"
                                    className="w-full bg-slate-800/60 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/50 transition-all"
                                />
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="pt-2 space-y-3">
                            {/* Sign In */}
                            <button
                                formAction={login}
                                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 px-4 rounded-lg text-sm transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:ring-offset-2 focus:ring-offset-slate-900 active:scale-[0.98]"
                            >
                                Sign In
                            </button>

                            {/* Divider */}
                            <div className="relative flex items-center gap-3">
                                <div className="flex-1 h-px bg-slate-800" />
                                <span className="text-xs text-slate-600">or</span>
                                <div className="flex-1 h-px bg-slate-800" />
                            </div>

                            {/* Sign Up */}
                            <button
                                formAction={signup}
                                className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold py-2.5 px-4 rounded-lg text-sm border border-slate-700 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-slate-500/50 focus:ring-offset-2 focus:ring-offset-slate-900 active:scale-[0.98]"
                            >
                                Create Account
                            </button>
                        </div>
                    </form>

                    {/* Footer note */}
                    <p className="text-center text-xs text-slate-600 mt-6">
                        Secured by Supabase Auth · HttpOnly cookies
                    </p>
                </div>

                {/* Glow effect */}
                <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-emerald-500/5 to-transparent pointer-events-none" />
            </div>
        </div>
    );
}
