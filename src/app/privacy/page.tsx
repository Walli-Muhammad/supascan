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

                <p className="text-sm text-slate-400 mb-8">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>

                <h2 className="text-xl font-bold text-white mt-8 mb-4">1. Information We Collect</h2>
                <p className="mb-4">
                    Supascan is a security auditing tool for Supabase. To provide our service, we collect:
                </p>
                <ul className="list-disc pl-5 mb-6 space-y-2 text-slate-300">
                    <li><strong>Account Information:</strong> We collect your email address when you sign in via Supabase Auth.</li>
                    <li><strong>Connecting Strings:</strong> We temporarily process your Postgres connection strings purely to execute the security scan. <strong>We do not store database passwords.</strong> Passwords are used ephemerally in memory during the scan and are never persisted to our database or logs.</li>
                    <li><strong>Scan Results:</strong> We store the metadata of your scan results (e.g., security scores, finding categories, table names) to populate your dashboard and history. We do not store or query your application's user data.</li>
                </ul>

                <h2 className="text-xl font-bold text-white mt-8 mb-4">2. Use of Information</h2>
                <p className="mb-4">
                    The information we collect is used solely to provide, maintain, and improve the Supascan service. This includes authenticating your account, performing security audits, generating PDF reports, and processing payments via our merchant of record, Lemon Squeezy.
                </p>

                <h2 className="text-xl font-bold text-white mt-8 mb-4">3. Third-Party Services</h2>
                <p className="mb-4">We rely on trusted third-party services to operate Supascan:</p>
                <ul className="list-disc pl-5 mb-6 space-y-2 text-slate-300">
                    <li><strong>Supabase:</strong> For user authentication and storing your project metadata and scan history.</li>
                    <li><strong>Vercel:</strong> For hosting the application and executing serverless scan actions.</li>
                    <li><strong>Lemon Squeezy:</strong> For processing subscription payments. We do not process or store your credit card information.</li>
                </ul>

                <h2 className="text-xl font-bold text-white mt-8 mb-4">4. Cookies and Tracking</h2>
                <p className="mb-6">
                    We use essential cookies required for authentication (Supabase session tokens). We do not use intrusive tracking cookies or sell your data to third-party advertisers.
                </p>

                <h2 className="text-xl font-bold text-white mt-8 mb-4">5. Contact Us</h2>
                <p className="mb-6">
                    If you have any questions about this Privacy Policy, please contact us at support@supascan.com.
                </p>
            </main>

            <Footer />
        </div>
    );
}
