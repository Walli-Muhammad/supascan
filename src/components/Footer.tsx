import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';

export function Footer() {
    return (
        <footer className="border-t border-slate-800/60 py-10 px-4 sm:px-6 mt-auto">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <span className="font-bold text-white text-sm">Supascan</span>
                    <span className="text-slate-600 text-xs ml-2">© {new Date().getFullYear()}</span>
                </div>

                <nav className="flex items-center gap-6 text-xs text-slate-500">
                    <Link href="/#features" className="hover:text-slate-300 transition-colors">Features</Link>
                    <Link href="/pricing" className="hover:text-slate-300 transition-colors">Pricing</Link>
                    <Link href="/terms" className="hover:text-slate-300 transition-colors">Terms</Link>
                    <Link href="/privacy" className="hover:text-slate-300 transition-colors">Privacy</Link>
                </nav>
            </div>
        </footer>
    );
}
