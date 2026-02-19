import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import {
  ShieldCheck,
  ShieldAlert,
  LayoutDashboard,
  FileText,
  RefreshCw,
  Zap,
  ArrowRight,
  CheckCircle2,
  Building2,
  Users,
  Database,
  Lock,
} from 'lucide-react';

const features = [
  {
    icon: ShieldCheck,
    title: 'Deep RLS Analysis',
    desc: 'We connect via SQL introspection — not external HTTP probes. We see misconfigurations that no external scanner can, including tables that only your app can access.',
    color: 'emerald',
  },
  {
    icon: LayoutDashboard,
    title: 'Agency Dashboard',
    desc: 'Monitor 20+ client projects from a single pane. Get an instant health score for each database. Never miss a junior dev disabling RLS again.',
    color: 'blue',
  },
  {
    icon: FileText,
    title: 'Executive PDF Reports',
    desc: 'One-click audit reports your clients can actually read. Color-coded findings, risk explanations in plain English, and SQL remediation code blocks.',
    color: 'violet',
  },
  {
    icon: RefreshCw,
    title: 'Continuous Monitoring',
    desc: 'Re-scan any project in one click. Track your security score over time and prove to clients that you\'re actively maintaining their security posture.',
    color: 'amber',
  },
];

const stats = [
  { value: '10,000+', label: 'Tables Audited' },
  { value: '< 30s', label: 'Avg. Scan Time' },
  { value: '100%', label: 'Credential-Free' },
];

const hobbyFeatures = [
  '1 Project',
  'Basic RLS Scan',
  'Security Score',
  'Community Support',
];

const agencyFeatures = [
  'Unlimited Projects',
  'Deep Audit (Auth, Backups, Grants)',
  'Executive PDF Reports',
  'Agency Dashboard',
  'Slack Alerts',
  'Priority Support',
];

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Authenticated users go to dashboard
  if (user) redirect('/dashboard');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 overflow-x-hidden">
      {/* Ambient background glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-40 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/3 w-[400px] h-[400px] bg-violet-500/5 rounded-full blur-3xl" />
      </div>

      <Navbar />

      <main className="relative">
        {/* ── HERO ──────────────────────────────────────────────────────── */}
        <section className="relative pt-36 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold px-3 py-1.5 rounded-full mb-6 animate-in fade-in duration-500">
            <ShieldCheck className="w-3.5 h-3.5" />
            Automated Governance Platform — Built for Agencies
          </div>

          {/* Headline */}
          <h1 className="text-5xl sm:text-7xl font-black tracking-tight text-white mb-6 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100 leading-[1.05]">
            Secure Every Supabase{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
              Project
            </span>{' '}
            in{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-orange-400">
              30 Seconds.
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-10 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150 leading-relaxed">
            The automated security governance platform built for agencies. Detect RLS misconfigurations,
            dangerous grants, and auth vulnerabilities — then generate{' '}
            <span className="text-white font-medium">client-ready PDF reports with one click.</span>
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
            <Link
              href="/login"
              className="flex items-center gap-2 text-base font-bold text-slate-900 bg-emerald-400 hover:bg-emerald-300 px-7 py-3.5 rounded-xl transition-all active:scale-95 shadow-lg shadow-emerald-500/20"
            >
              <Zap className="w-5 h-5" />
              Start Free Audit
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#features"
              className="flex items-center gap-2 text-base font-semibold text-slate-300 hover:text-white bg-slate-800/60 hover:bg-slate-800 border border-slate-700 px-7 py-3.5 rounded-xl transition-all"
            >
              See How It Works
            </a>
          </div>

          {/* Stats bar */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 sm:gap-16 animate-in fade-in duration-700 delay-300">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl font-black text-white">{stat.value}</p>
                <p className="text-sm text-slate-500 mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── COMPARISON BANNER ─────────────────────────────────────────── */}
        <section className="py-12 border-y border-slate-800/60 bg-slate-900/30">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <p className="text-center text-xs text-slate-500 uppercase tracking-widest mb-8 font-semibold">
              Why Supascan vs External Scanners
            </p>
            <div className="grid grid-cols-2 gap-4">
              {/* Them */}
              <div className="bg-slate-900/60 border border-rose-500/10 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                  <span className="text-sm font-semibold text-rose-400">External Scanners</span>
                </div>
                <ul className="space-y-2.5 text-sm text-slate-500">
                  {['HTTP probe only', 'Sees public leaks only', 'Single project', '"Is the door open?"'].map(t => (
                    <li key={t} className="flex items-center gap-2">
                      <span className="text-rose-500 font-bold">✗</span> {t}
                    </li>
                  ))}
                </ul>
              </div>
              {/* Us */}
              <div className="bg-slate-900/60 border border-emerald-500/20 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm font-semibold text-emerald-400">Supascan</span>
                </div>
                <ul className="space-y-2.5 text-sm text-slate-300">
                  {['SQL introspection (inside-out)', 'Sees private misconfigurations', 'Agency multi-project dashboard', '"Is the building up to code?"'].map(t => (
                    <li key={t} className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> {t}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ── FEATURES ──────────────────────────────────────────────────── */}
        <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs text-emerald-400 font-semibold tracking-widest uppercase mb-3">Capabilities</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white">Everything Your Agency Needs</h2>
            <p className="text-slate-400 mt-3 max-w-xl mx-auto">Built for the inside-out. We speak SQL, not HTTP.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((f) => {
              const Icon = f.icon;
              const colorMap: Record<string, { bg: string; ring: string; text: string }> = {
                emerald: { bg: 'bg-emerald-500/10', ring: 'ring-emerald-500/20', text: 'text-emerald-400' },
                blue: { bg: 'bg-blue-500/10', ring: 'ring-blue-500/20', text: 'text-blue-400' },
                violet: { bg: 'bg-violet-500/10', ring: 'ring-violet-500/20', text: 'text-violet-400' },
                amber: { bg: 'bg-amber-500/10', ring: 'ring-amber-500/20', text: 'text-amber-400' },
              };
              const c = colorMap[f.color];
              return (
                <div key={f.title} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-colors group">
                  <div className={`inline-flex p-2.5 rounded-xl ${c.bg} ring-1 ${c.ring} mb-4`}>
                    <Icon className={`w-5 h-5 ${c.text}`} />
                  </div>
                  <h3 className="text-base font-bold text-white mb-2">{f.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── SOCIAL PROOF ──────────────────────────────────────────────── */}
        <section className="py-16 border-y border-slate-800/60 bg-gradient-to-r from-emerald-500/5 via-transparent to-blue-500/5">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-10 sm:gap-20">
              <div className="flex items-center gap-3">
                <Database className="w-8 h-8 text-emerald-500/60" />
                <div className="text-left">
                  <p className="text-2xl font-black text-white">10,000+</p>
                  <p className="text-sm text-slate-500">Tables Audited</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Building2 className="w-8 h-8 text-blue-500/60" />
                <div className="text-left">
                  <p className="text-2xl font-black text-white">500+</p>
                  <p className="text-sm text-slate-500">Projects Monitored</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Users className="w-8 h-8 text-violet-500/60" />
                <div className="text-left">
                  <p className="text-2xl font-black text-white">200+</p>
                  <p className="text-sm text-slate-500">Agencies Trust Us</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Lock className="w-8 h-8 text-amber-500/60" />
                <div className="text-left">
                  <p className="text-2xl font-black text-white">Zero</p>
                  <p className="text-sm text-slate-500">Credentials Stored</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── PRICING ───────────────────────────────────────────────────── */}
        <section id="pricing" className="py-24 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs text-emerald-400 font-semibold tracking-widest uppercase mb-3">Pricing</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white">Simple, Transparent Pricing</h2>
            <p className="text-slate-400 mt-3">Start free. Scale when your agency does.</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {/* Hobby */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 flex flex-col">
              <div className="mb-6">
                <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">Hobby</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-white">$0</span>
                  <span className="text-slate-500">/mo</span>
                </div>
                <p className="text-slate-500 text-sm mt-1">Perfect for solo devs & indie hackers.</p>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {hobbyFeatures.map((f) => (
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
                <p className="text-sm font-semibold text-emerald-400 uppercase tracking-wider mb-2">Agency</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-white">$49</span>
                  <span className="text-slate-500">/mo</span>
                </div>
                <p className="text-slate-400 text-sm mt-1">For agencies managing multiple clients.</p>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {agencyFeatures.map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-slate-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                href="/login"
                className="w-full text-center text-sm font-bold text-slate-900 bg-emerald-400 hover:bg-emerald-300 py-3 rounded-xl transition-all active:scale-95 shadow-lg shadow-emerald-500/20"
              >
                Start Agency Trial
              </Link>
            </div>
          </div>
        </section>

        {/* ── FINAL CTA ─────────────────────────────────────────────────── */}
        <section className="py-24 px-4 sm:px-6 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-5xl font-black text-white mb-4 leading-tight">
              Your clients trust you{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
                with their data.
              </span>
            </h2>
            <p className="text-slate-400 mb-8">
              Run your first audit in 30 seconds. No credit card required.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-base font-bold text-slate-900 bg-emerald-400 hover:bg-emerald-300 px-8 py-4 rounded-xl transition-all active:scale-95 shadow-lg shadow-emerald-500/20"
            >
              <Zap className="w-5 h-5" />
              Start Free Audit Now
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </section>

        {/* ── FOOTER ────────────────────────────────────────────────────── */}
        <footer className="border-t border-slate-800/60 py-10 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span className="font-bold text-white text-sm">Supascan</span>
              <span className="text-slate-600 text-xs ml-2">© {new Date().getFullYear()}</span>
            </div>

            <nav className="flex items-center gap-6 text-xs text-slate-500">
              <a href="#features" className="hover:text-slate-300 transition-colors">Features</a>
              <a href="#pricing" className="hover:text-slate-300 transition-colors">Pricing</a>
              <Link href="/login" className="hover:text-slate-300 transition-colors">Login</Link>
              <a href="#" className="hover:text-slate-300 transition-colors">Privacy</a>
            </nav>
          </div>
        </footer>
      </main>
    </div>
  );
}
