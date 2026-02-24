import { Footer } from '@/components/Footer';
import Link from 'next/link';

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col">
            <header className="border-b border-slate-800/60 bg-slate-950/80 backdrop-blur-sm sticky top-0 z-40">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
                    <Link href="/" className="font-bold text-white tracking-tight text-sm">
                        ← Supascan
                    </Link>
                </div>
            </header>

            <main className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 py-16 w-full prose prose-invert prose-slate prose-a:text-emerald-400 hover:prose-a:text-emerald-300">
                <h1 className="text-3xl font-bold tracking-tight text-white mb-8">Terms & Conditions</h1>

                <p className="text-sm text-slate-400 mb-8">Last updated: February 23, 2026</p>

                <h2 className="text-xl font-bold text-white mt-8 mb-4">1. Acceptance of Terms</h2>
                <p className="mb-4">
                    By accessing and using Supascan (the "Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the applicable terms, please do not use this service.
                </p>

                <h2 className="text-xl font-bold text-white mt-8 mb-4">2. Description of Service & Ephemeral Credentials</h2>
                <p className="mb-4">
                    Supascan provides automated security auditing tools specifically designed for Supabase projects. The service connects to your database instance via the connection string you provide, analyzes Postgres system catalogs (e.g., Row Level Security policies, user roles, extensions), and generates a security report.
                </p>
                <p className="mb-6 font-semibold">
                    <strong className="text-emerald-400 block mb-1">Ephemeral Credentials:</strong>
                    Database connection credentials provided for the scan are held in memory (RAM) only for the duration of the scan and are NEVER permanently stored in our database. We do not query, read, or export your application's user data from standard application tables.
                </p>

                <h2 className="text-xl font-bold text-white mt-8 mb-4">3. Proof of Authorization (Consent to Scan)</h2>
                <p className="mb-6">
                    Because Supascan interacts directly with database infrastructure, you must have explicit legal permission to scan the target database. By submitting a connection string, you warrant that you are the owner, or have the legal right and authorization from the owner, to scan the target database. To prove authorization and prevent abuse, every scan event is logged in our internal Consent Ledger with a User ID, Target Project ID, and Timestamp.
                </p>

                <h2 className="text-xl font-bold text-white mt-8 mb-4">4. Acceptable Use and Rate Limiting</h2>
                <p className="mb-6">
                    To protect our platform and your database from Denial of Service (DoS) conditions or performance degradation, we implement strict throttling and rate limits. You agree not to use automated scripts to rapidly trigger scans. Attempting to bypass these limits, or using the Service to scan unauthorized third-party databases, will result in immediate account termination and potential IP bans.
                </p>

                <h2 className="text-xl font-bold text-white mt-8 mb-4">5. Disclaimer of Warranty and Liability</h2>
                <p className="mb-4">
                    The Service is provided on an "AS IS" and "AS AVAILABLE" basis. While Supascan relies on best practices to identify common misconfigurations and security issues:
                </p>
                <ul className="list-disc pl-5 mb-6 space-y-2 text-slate-300">
                    <li>We do not guarantee that our scans will catch 100% of vulnerabilities or misconfigurations.</li>
                    <li>We are not responsible for any security breaches, data loss, or damages that occur to your application or database.</li>
                    <li>You remain solely responsible for validating and securing your own Supabase project.</li>
                </ul>
                <p className="mb-6 font-bold text-rose-400 uppercase">
                    In no event shall Supascan be liable for any direct, indirect, incidental, special, or consequential damages resulting from the use or the inability to use the Service.
                </p>

                <h2 className="text-xl font-bold text-white mt-8 mb-4">6. Subscriptions and Payments</h2>
                <p className="mb-6">
                    Certain features of Supascan are offered on a paid basis, which may include one-time purchases or recurring subscriptions (e.g., the "Agency Plan"). Payments are securely processed via our merchant of record, Lemon Squeezy. By subscribing, you agree to their terms of sale. Subscriptions are billed monthly and automatically renew unless cancelled. You may cancel your subscription at any time through the customer portal. There are no prorated refunds for partial months.
                </p>

                <h2 className="text-xl font-bold text-white mt-8 mb-4">7. Account Termination</h2>
                <p className="mb-6">
                    We reserve the right to suspend or terminate your account and refuse any and all current or future use of the Service for any reason at any time, including but not limited to abuse, unauthorized scanning, or payment failure.
                </p>

                <h2 className="text-xl font-bold text-white mt-8 mb-4">8. Changes to Terms</h2>
                <p className="mb-6">
                    We reserve the right to modify these terms at any time. Your continued use of the Service following any such modification constitutes your acceptance of the new Terms & Conditions.
                </p>

                <p className="mt-12 text-sm text-slate-400 border-t border-slate-800/60 pt-6">
                    Contact us at support@supascan.com.
                </p>
            </main>

            <Footer />
        </div>
    );
}
