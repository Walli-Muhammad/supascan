Supascan: Enterprise Security Auditor for Supabase
GitHub:
Live: https://supascan-qcdl.vercel.app 

Supascan is an automated vulnerability scanner designed specifically for Supabase and Postgres architectures. It performs deep catalog auditing to detect Row Level Security (RLS) misconfigurations, dangerous extensions, and privilege escalations before they become data breaches.
Key Capabilities:
RLS Deep Audit: Detects trivially permissive policies (like USING (true)), disabled RLS, and missing policies.
Privilege Escalation Detection: Flags dangerous public WRITE / DELETE grants and SECURITY DEFINER functions that bypass RLS.
Extension & Network Risks: Identifies exposed pg_net and http extensions (SSRF risks), exposed vault schemas, and public pg_cron schedulers.
Storage Auditing: Instantly detects publicly exposed storage.buckets.
Automated Reporting: Generates severity-weighted security scores (A-F) and SOC2-style PDF reports with exact SQL remediation snippets.

<img src="https://img.sanishtech.com/u/677aa7be35f6d9f0734429130e01a84d.png" alt="UI" loading="lazy" style="max-width:100%;height:auto;">

<img src="https://img.sanishtech.com/u/85f872f6d325f18b234aa6e0f27e4e21.png" alt="loop" loading="lazy" style="max-width:100%;height:auto;">
