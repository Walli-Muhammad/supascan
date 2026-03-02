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
                <h1 className="text-3xl font-bold tracking-tight text-white mb-8">Terms &amp; Conditions</h1>

                <p className="text-sm text-slate-400 mb-8">Last updated: March 2, 2026</p>

                <h2 className="text-xl font-bold text-white mt-8 mb-4">1. Acceptance of Terms</h2>
                <p className="mb-4">
                    By accessing and using Supascan (the &quot;Service&quot;), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the applicable terms, please do not use this service.
                </p>

                <h2 className="text-xl font-bold text-white mt-8 mb-4">2. Description of Service &amp; Ephemeral Credentials</h2>
                <p className="mb-4">
                    Supascan provides automated security auditing tools specifically designed for Supabase projects. The service connects to your database instance via the connection string you provide and analyzes Postgres system catalogs only — including but not limited to: Row Level Security policies (<code>pg_policy</code>), user roles (<code>pg_roles</code>), functions (<code>pg_proc</code>), extensions (<code>pg_extension</code>), storage bucket visibility (<code>storage.buckets</code>), and schema permissions.
                </p>
                <p className="mb-4">
                    Supascan runs the following categories of checks: RLS enforcement, role permission analysis, schema exposure, SECURITY DEFINER function risks, network extension exposure (pg_net, http), pg_cron scheduler exposure, Vault schema accessibility, public storage buckets, anonymous function executability, and view-level RLS bypass risks.
                </p>
                <p className="mb-6 font-semibold">
                    <strong className="text-emerald-400 block mb-1">Ephemeral Credentials &amp; Zero-Data Guarantee:</strong>
                    Database connection credentials provided for the scan are held in memory (RAM) only for the duration of the scan and are NEVER permanently stored in our database. To enforce this structurally, Supascan sets a <code>statement_timeout</code> and <code>idle_in_transaction_session_timeout</code> of 3 seconds on the connection, and closes it immediately after the scan completes. We do not query, read, or export your application&apos;s user data from standard application tables.
                </p>

                <h2 className="text-xl font-bold text-white mt-8 mb-4">3. Proof of Authorization (Consent Ledger)</h2>
                <p className="mb-4">
                    Because Supascan interacts directly with database infrastructure, you must have explicit legal permission to scan the target database. By submitting a connection string, you warrant that you are the owner, or have the legal right and authorization from the owner, to scan the target database.
                </p>
                <p className="mb-6">
                    To prove authorization and prevent abuse, every scan event is recorded in our immutable internal <strong>Consent Ledger</strong> (<code>scan_consent_log</code>) before any connection to your database is opened. This record includes: your User ID (if authenticated), the Target Project Reference, your IP address, your browser User-Agent string, and a UTC timestamp. This record is write-only for end users and cannot be modified or deleted by you or by us, serving as a legal audit trail.
                </p>

                <h2 className="text-xl font-bold text-white mt-8 mb-4">4. Acceptable Use and Rate Limiting</h2>
                <p className="mb-4">
                    To protect our platform and your database from unintended load, we enforce strict rate limits:
                </p>
                <ul className="list-disc pl-5 mb-6 space-y-2 text-slate-300">
                    <li><strong>Authenticated users:</strong> maximum 5 scans per hour per account.</li>
                    <li><strong>Unauthenticated visitors:</strong> maximum 2 scans per hour per IP address.</li>
                </ul>
                <p className="mb-6">
                    You agree not to use automated scripts to rapidly trigger scans or attempt to circumvent rate limiting. Attempting to bypass these limits, or using the Service to scan unauthorized third-party databases, will result in immediate account termination and potential IP bans.
                </p>

                <h2 className="text-xl font-bold text-white mt-8 mb-4">5. Security Score &amp; Findings</h2>
                <p className="mb-4">
                    Supascan generates a security score from 0–100 using a severity-weighted deduction model:
                </p>
                <ul className="list-disc pl-5 mb-4 space-y-2 text-slate-300">
                    <li><strong>CRITICAL finding:</strong> −40 points</li>
                    <li><strong>HIGH finding:</strong> −20 points</li>
                    <li><strong>MEDIUM finding:</strong> −8 points</li>
                    <li><strong>LOW finding:</strong> −2 points</li>
                </ul>
                <p className="mb-6">
                    Scores map to grades: A (≥90), B (≥75), C (≥60), D (≥40), F (&lt;40). Remediation SQL included in reports is generic best-practice SQL targeting system catalogs — it is not derived from your application data. Remediation SQL is available to Agency tier subscribers only.
                </p>

                <h2 className="text-xl font-bold text-white mt-8 mb-4">6. Disclaimer of Warranty and Liability</h2>
                <p className="mb-4">
                    The Service is provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis. While Supascan relies on best practices to identify common misconfigurations and security issues:
                </p>
                <ul className="list-disc pl-5 mb-6 space-y-2 text-slate-300">
                    <li>We do not guarantee that our scans will catch 100% of vulnerabilities or misconfigurations.</li>
                    <li>We are not responsible for any security breaches, data loss, or damages that occur to your application or database.</li>
                    <li>You remain solely responsible for validating and securing your own Supabase project.</li>
                </ul>
                <p className="mb-6 font-bold text-rose-400 uppercase">
                    In no event shall Supascan be liable for any direct, indirect, incidental, special, or consequential damages resulting from the use or the inability to use the Service.
                </p>

                <h2 className="text-xl font-bold text-white mt-8 mb-4">7. Subscriptions and Payments</h2>
                <p className="mb-6">
                    Certain features of Supascan are offered on a paid basis under the &quot;Agency Plan&quot;, including unlimited projects, full remediation SQL access, full scan history (up to 100 entries per project), and PDF report generation. Payments are securely processed via our merchant of record, Lemon Squeezy. By subscribing, you agree to their terms of sale. Subscriptions are billed monthly and automatically renew unless cancelled. You may cancel your subscription at any time through the customer portal. There are no prorated refunds for partial months.
                </p>

                <h2 className="text-xl font-bold text-white mt-8 mb-4">8. Account Termination</h2>
                <p className="mb-6">
                    We reserve the right to suspend or terminate your account and refuse any and all current or future use of the Service for any reason at any time, including but not limited to abuse, unauthorized scanning, rate limit circumvention, or payment failure.
                </p>

                <h2 className="text-xl font-bold text-white mt-8 mb-4">9. Changes to Terms</h2>
                <p className="mb-6">
                    We reserve the right to modify these terms at any time. Your continued use of the Service following any such modification constitutes your acceptance of the new Terms &amp; Conditions.
                </p>

                <p className="mt-12 text-sm text-slate-400 border-t border-slate-800/60 pt-6">
                    Contact us at support@supascan.com.
                </p>
            </main>

            <Footer />
        </div>
    );
}
