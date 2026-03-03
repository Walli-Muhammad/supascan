'use client';

import { useFormStatus } from 'react-dom';
import { useEffect, useRef } from 'react';
import { Terminal, Lock, ShieldCheck, Database, Loader2, Info } from 'lucide-react';

interface ScanInputProps {
    /** Pre-filled connection string template (from ?project= URL param) */
    defaultValue?: string;
}

export function ScanInput({ defaultValue }: ScanInputProps) {
    const { pending } = useFormStatus();
    const inputRef = useRef<HTMLInputElement>(null);

    // Auto-focus and select when a template value is pre-filled
    useEffect(() => {
        if (defaultValue && inputRef.current) {
            inputRef.current.focus();
            // Select all so user can immediately paste their password
            inputRef.current.select();
        }
    }, [defaultValue]);

    return (
        <div className="w-full max-w-2xl mx-auto space-y-4">
            <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-lg blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
                <div className="relative flex items-center bg-slate-900 ring-1 ring-slate-900/5 rounded-lg leading-none">
                    <div className="pl-4">
                        <Database className="w-5 h-5 text-slate-400" />
                    </div>
                    <input
                        ref={inputRef}
                        type="password"
                        name="connectionString"
                        placeholder="postgres://postgres:[YOUR-PASSWORD]@host:6543/postgres"
                        defaultValue={defaultValue}
                        required
                        className="w-full bg-transparent border-0 py-4 px-4 text-slate-200 placeholder-slate-500 focus:ring-0 focus:outline-none font-mono text-sm"
                        disabled={pending}
                    />
                </div>
            </div>

            {/* IPv4 Transaction Pooler notice */}
            <div className="flex items-start gap-2 px-1 py-2 rounded-lg bg-amber-500/5 border border-amber-500/20">
                <Info className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-400/90 leading-relaxed">
                    <span className="font-semibold">Important:</span> Please use your{' '}
                    <span className="font-semibold">IPv4 Transaction Pooler</span> connection string{' '}
                    <span className="font-mono bg-amber-500/10 px-1 rounded">(Port 6543)</span>.{' '}
                    Direct connections are not supported on Vercel.
                </p>
            </div>

            {defaultValue && (
                <p className="text-xs text-amber-400/80 flex items-center gap-1.5 px-1">
                    <Lock className="w-3 h-3 shrink-0" />
                    Replace <code className="font-mono bg-slate-800 px-1 rounded">[YOUR-PASSWORD]</code> with your database password, then click Audit.
                </p>
            )}

            <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                <div className="flex items-center gap-1.5">
                    <Lock className="w-3 h-3" />
                    <span>Credentials processed in-memory only. Never stored.</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <Terminal className="w-3 h-3" />
                    <span>Zero-Data Policy</span>
                </div>
            </div>

            <button
                type="submit"
                disabled={pending}
                className="w-full relative group overflow-hidden bg-slate-900 hover:bg-slate-800 text-white font-medium py-4 px-8 rounded-lg border border-slate-700 hover:border-emerald-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-shimmer" />
                <div className="flex items-center justify-center gap-2">
                    {pending ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />
                            <span className="text-slate-300">Running Security Audit...</span>
                        </>
                    ) : (
                        <>
                            <ShieldCheck className="w-5 h-5 text-emerald-500 group-hover:scale-110 transition-transform" />
                            <span>Run Automated Audit</span>
                        </>
                    )}
                </div>
            </button>
        </div>
    );
}
