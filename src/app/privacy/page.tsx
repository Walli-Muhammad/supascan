import { Footer } from '@/components/Footer';
import Link from 'next/link';

export default function PrivacyPage() {
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
                <h1 className="text-3xl font-bold tracking-tight text-white mb-8">Privacy Policy</h1>

                <p className="text-sm text-slate-400 mb-8">Last updated: March 2, 2026</p>

                <h2 className="text-xl font-bold text-white mt-8 mb-4">1. Information We Collect</h2>
                <p className="mb-4">
                    Supascan is a security auditing tool for Supabase. To provide our service, we collect:
                </p>
                <ul className="list-disc pl-5 mb-6 space-y-2 text-slate-300">
                    <li>
                        <strong>Account Information:</strong> We collect your email address when you sign in via Supabase Auth.
                    </li>
                    <li>
                        <strong>Connection Strings:</strong> We temporarily process your Postgres connection strings purely to execute the security scan. <strong>We do not store database passwords.</strong> Passwords are used ephemerally in memory during the scan and are never persisted to our database or logs. A 3-second server-side timeout is enforced structurally on every connection.
                    </li>
                    <li>
                        <strong>Scan Results:</strong> We store the full results of your security scans — including numeric score, letter grade, and the list of findings (severity, check ID, affected object, remediation SQL) — in our <code>scans</code> table. We store only metadata derived from Postgres system catalogs. We do not store or query your application&apos;s user data.
                    </li>
                    <li>
                        <strong>Consent Ledger (scan_consent_log):</strong> Before every scan, we record an immutable entry containing your User ID (if authenticated), the Target Project Reference (a non-sensitive identifier derived from your connection string host), your IP address, your browser User-Agent string, and a UTC timestamp. This is required to prove you authorized each scan and to enforce rate limits. This data cannot be modified or deleted by users.
                    </li>
                    <li>
                        <strong>Rate Limit Data:</strong> IP addresses collected in the Consent Ledger are used exclusively to enforce rate limits (5 scans/hour for authenticated users, 2/hour for unauthenticated visitors). They are not used for tracking, profiling, or advertising.
                    </li>
                </ul>

                <h2 className="text-xl font-bold text-white mt-8 mb-4">2. What We Do NOT Collect</h2>
                <ul className="list-disc pl-5 mb-6 space-y-2 text-slate-300">
                    <li>We do not read, copy, or store any rows from your application&apos;s data tables.</li>
                    <li>We do not store your database password at any point.</li>
                    <li>We do not use third-party analytics or advertising trackers.</li>
                    <li>We do not sell your data to any party.</li>
                </ul>

                <h2 className="text-xl font-bold text-white mt-8 mb-4">3. Use of Information</h2>
                <p className="mb-6">
                    The information we collect is used solely to provide, maintain, and improve the Supascan service. This includes authenticating your account, performing security audits against system catalogs only, enforcing rate limits, generating your security score and findings report, generating PDF reports (Agency tier), enforcing the scan history depth per subscription tier, and processing payments via our merchant of record, Lemon Squeezy.
                </p>

                <h2 className="text-xl font-bold text-white mt-8 mb-4">4. Third-Party Services</h2>
                <p className="mb-4">We rely on trusted third-party services to operate Supascan:</p>
                <ul className="list-disc pl-5 mb-6 space-y-2 text-slate-300">
                    <li><strong>Supabase:</strong> For user authentication and storing your project metadata, scan history, full scan results, and the consent ledger. Data is stored in Supabase-managed PostgreSQL with Row Level Security enforced on all user-facing tables.</li>
                    <li><strong>Vercel:</strong> For hosting the application and executing serverless scan actions. Your connection string is processed within a Vercel serverless function and never written to disk.</li>
                    <li><strong>Lemon Squeezy:</strong> For processing subscription payments. We do not process or store your credit card information.</li>
                </ul>

                <h2 className="text-xl font-bold text-white mt-8 mb-4">5. Data Retention</h2>
                <ul className="list-disc pl-5 mb-6 space-y-2 text-slate-300">
                    <li><strong>Scan results</strong> are retained as long as your account is active. Deleting a project deletes all associated scans via cascading database rules.</li>
                    <li><strong>Consent ledger entries</strong> are retained indefinitely as a legal compliance requirement. They cannot be deleted by users.</li>
                    <li><strong>Account data</strong> is deleted on account termination.</li>
                </ul>

                <h2 className="text-xl font-bold text-white mt-8 mb-4">6. Cookies and Tracking</h2>
                <p className="mb-6">
                    We use essential cookies required for authentication (Supabase session tokens). We do not use intrusive tracking cookies or sell your data to third-party advertisers.
                </p>

                <h2 className="text-xl font-bold text-white mt-8 mb-4">7. Contact Us</h2>
                <p className="mb-6">
                    If you have any questions about this Privacy Policy, please contact us at support@supascan.com.
                </p>
            </main>

            <Footer />
        </div>
    );
}
