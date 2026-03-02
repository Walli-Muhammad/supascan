# Supascan — Project Overview

## What is Supascan?
Supascan is an **automated security auditing and compliance tool** specifically built for developers running on **Supabase**. It connects to a user's Supabase PostgreSQL database via a connection string, analyzes Postgres system catalogs without reading user data, and generates a comprehensive security report with an actionable SQL remediation for each finding.

The goal is to help developers instantly identify critical misconfigurations — around Row Level Security, dangerous role permissions, exposed schemas, network extensions, and more — before they become data breaches.

---

## Core Architecture

### 1. The Audit Engine (`src/lib/scanner/engine.ts`)
The engine connects via `postgres.js` and runs all checks against Postgres system catalogs only (`pg_class`, `pg_roles`, `pg_policy`, `pg_proc`, `storage.buckets`, etc.). It never touches application data tables.

**Security Architecture:**
- **Ephemeral credentials:** Connection strings are held in memory only for the duration of the scan. Never persisted.
- **Structural zero-data guarantee:** Immediately on connection open, the engine executes:
  ```sql
  SET statement_timeout = '3000';
  SET idle_in_transaction_session_timeout = '3000';
  ```
  Postgres itself kills any slow query server-side — structurally preventing data exfiltration regardless of application code.
- **Guaranteed connection cleanup:** `sql.end()` is always called in a `finally` block.

**Security Checks (all catalog-level only):**

| Check | Severity | Catalog Source |
|-------|----------|----------------|
| RLS disabled on a table | CRITICAL | `pg_class` |
| Trivially permissive policy (`USING (true)`) | CRITICAL | `pg_policy` |
| `anon` role with `DELETE` / `TRUNCATE` | CRITICAL | `pg_roles`, `information_schema` |
| Vault schema callable by public roles | CRITICAL | `pg_proc`, `pg_roles` |
| `anon` role with `INSERT` / `UPDATE` | HIGH | `pg_roles` |
| `authenticated` role with write access | HIGH | `pg_roles` |
| RLS enabled but no policies defined | HIGH | `pg_policy` |
| SECURITY DEFINER functions in public schema | HIGH | `pg_proc` |
| Network extension (`pg_net`, `http`) callable by public roles | HIGH | `pg_proc`, `pg_roles` |
| `pg_cron` scheduler callable by public roles | HIGH | `pg_proc`, `pg_roles` |
| Public storage buckets (`public = true`) | HIGH | `storage.buckets` |
| Views with base tables that have no RLS | HIGH | `pg_rewrite`, `information_schema` |
| Connecting as superuser role | LOW | `pg_roles` |
| Dangerous extension in public scope | HIGH | `pg_extension` |
| Public functions executable by `anon` | MEDIUM | `pg_proc` |

> PITR and MFA are **intentionally NOT checked** — they are Supabase platform-level settings, not queryable via `pg_catalog`.

**Score Algorithm:**
```
Score = 100 − Σ(weight per finding)
  CRITICAL: −40 pts
  HIGH:     −20 pts
  MEDIUM:   −8 pts
  LOW:      −2 pts
  Minimum: 0
```

**Grade Thresholds:**
| Score | Grade | Label |
|-------|-------|-------|
| ≥ 90 | A | Secure |
| ≥ 75 | B | Good |
| ≥ 60 | C | Fair |
| ≥ 40 | D | Poor |
| < 40 | F | Critical Risk |

---

### 2. Secure Onboarding UI (`src/components/scanner/ScannerPage.tsx`)
- Accepts an `isPro` prop (resolved server-side in `new/page.tsx`) to gate the remediation SQL.
- "🔒 Prefer a Read-Only Role?" collapsible provides a complete 6-step copyable SQL snippet — including `GRANT CONNECT`, `pg_catalog`, `information_schema`, and `storage.buckets` access — matching exactly what the engine needs.
- Real-time loading state via `useActionState` and Server Actions.
- Rate limit banner (amber, with `Clock` icon) when the user hits 5 scans/hour.
- Paywall error box for free-tier project limit with inline `UpgradeButton`.

---

### 3. Findings UI (`src/components/scanner/FindingsList.tsx`)
- Each finding card shows: severity badge, category, affected table/schema, message, risk explanation ("Why this matters"), and a collapsible **View SQL Fix** panel.
- **Remediation SQL is paywalled:**
  - **Agency users:** Full SQL with macOS-style code chrome and one-click Copy button.
  - **Free users:** Blurred SQL preview with an amber lock overlay and inline `UpgradeButton`.

---

### 4. Score Card (`src/components/scanner/ScoreCard.tsx`)
- Animated SVG arc progress ring.
- 5-grade system (A/B/C/D/F) with distinct color theming per tier.
- Footnote showing the exact scoring methodology: *Critical −40 · High −20 · Medium −8 · Low −2*.

---

### 5. PDF Export (`src/components/scanner/AuditPDF.tsx`)
- Agency tier only. Generates a SOC2-style PDF with `@react-pdf/renderer`.
- Covers: executive summary grade cards, detailed finding breakdowns, enterprise safeguard checklists.

---

### 6. Authentication & Mission Control Dashboard
- **Supabase Auth:** Email/Password.
- **Dashboard (`src/app/dashboard/page.tsx`):** Shows all previously scanned projects with security scores.
  - **Empty state:** Rich onboarding panel with dashed border, "Run your first security audit" headline, trust signals (Zero-data promise · Results in ~60s · SOC2-style report), and primary CTA → `/new`.
  - **Scan history depth** on the project detail page is tier-limited: free users see 1 entry, Agency sees up to 100. A subtle amber pill notifies free users.

---

### 7. Scan Server Action (`src/app/actions/scan.ts`)
The server action follows a strict ordered pipeline:

1. **Validate** connection string format
2. **Extract** `projectRef`, IP, user-agent, and auth user (resolved once, reused)
3. **Rate limit check** via `scan_consent_log` (before touching the target DB):
   - Authenticated: 5 scans / hour per `user_id`
   - Unauthenticated: 2 scans / hour per IP
4. **Legacy audit log** (`logScanAttempt`)
5. **Consent log insert** (via `supabaseAdmin`, immutable audit trail)
6. **Run scan engine** (`scanProject`)
7. **Paywall check** (new project + free tier + at limit → return paywall error)
8. **Upsert project** (denormalized cache: `last_scan_score`, `last_scan_at`)
9. **Insert into `scans`** (full results: score, grade, JSONB findings)
10. **Insert into `scan_history`** (backward-compat cache for project detail page)

---

### 8. Monetization — Lemon Squeezy Integration
| | Hobby (Free) | Agency ($49/mo) |
|---|---|---|
| Projects | 1 | Unlimited |
| Scans/hour | 5 | 5 |
| Remediation SQL | 🔒 Blurred | ✅ Full |
| Scan history depth | 1 entry | 100 entries |
| PDF Reports | ✗ | ✅ |

Webhooks (`src/app/api/webhooks/lemon/route.ts`) handle HMAC-SHA256 verified `subscription_created` / `updated` / `cancelled` events to flip `is_pro` in the `profiles` table.

---

### 9. Legal & Compliance Pages
- `/privacy` — Privacy Policy covering ephemeral credentials and third parties.
- `/terms` — SOC2-ready Terms & Conditions: acceptance, ephemeral credentials, Consent Ledger, acceptable use, liability disclaimer, subscriptions.
- Shared `Footer.tsx` links to both from every page.

---

### 10. Database Schema

**`profiles`** (extends `auth.users`)
- `id`, `is_pro`, `lemon_customer_id`, `lemon_subscription_id`

**`projects`**
- `id`, `user_id`, `project_ref`, `name`, `last_scan_score`, `last_scan_at`

**`scan_history`** (legacy cache — backward compat)
- `id`, `project_id`, `score`, `findings_count`, `raw_results` (JSONB), `created_at`

**`scans`** *(new — Task 34)*
- `id`, `project_id`, `user_id`, `score`, `grade`, `findings` (JSONB), `tables_analyzed`, `duration_ms`, `created_at`
- RLS: users can SELECT/INSERT their own rows. Index on `(project_id, created_at DESC)`.

**`scan_consent_log`** *(new — Task 34)*
- `id`, `user_id`, `project_ref`, `ip_address`, `user_agent`, `consented_at`
- No end-user SELECT or INSERT policy — service role only. Immutable legal audit trail.
- Also used as the rate-limit counter (queried via `supabaseAdmin`).

---

## Changes: Tasks 31–37

### Task 31 — 7 New Security Checks
Added 7 new catalog-only check functions to `engine.ts`, all running in parallel with the existing enterprise checks via `Promise.all`:

| ID | Check | Severity |
|----|-------|----------|
| `security_definer_no_force_rls` | `SECURITY DEFINER` functions in `public` schema that can bypass RLS | HIGH |
| `network_extension_exposed` | `pg_net`/`http` extension callable by `anon`/`authenticated` (SSRF risk) | HIGH |
| `pgcron_exposed` | `pg_cron` scheduler callable by public roles (arbitrary job injection) | HIGH |
| `vault_exposed` | Supabase Vault schema callable by public roles (secret exfiltration) | CRITICAL |
| `public_functions_anon_executable` | Public functions callable by `anon` with no auth (unintended RPC exposure) | MEDIUM |
| `public_storage_buckets` | Storage buckets marked `public = true` (no-auth download) | HIGH |
| `view_base_table_no_rls` | Views accessible by public roles whose base tables have no RLS | HIGH |

Also added `'STORAGE'` to the `FindingCategory` union type in `types.ts`.
Existing checks (RLS, permissions, schema) were not touched.

---

### Task 32 — Severity-Weighted Score Algorithm
Replaced the flat per-finding deduction (`CRITICAL -20, HIGH -10, MEDIUM -5, LOW -2`) with a severity-weighted model:
- `CRITICAL: -40`, `HIGH: -20`, `MEDIUM: -8`, `LOW: -2`
- A single CRITICAL finding now drops the score to 60 or below (grade D), accurately reflecting the severity.
- Added `SEVERITY_WEIGHTS` constant and `calculateScore()` helper.
- Updated `ScoreCard.tsx` `getTier()` from 3 grades (A/B/F) to all 5 (A/B/C/D/F) with new thresholds (90/75/60/40).
- Added score methodology footnote to the ScoreCard.

---

### Task 33 — Remediation SQL Behind Agency Paywall
- **`FindingsList.tsx`:** Added `isPro` prop. Pro users see the full SQL with copy button. Free users see a blurred preview with an amber lock overlay and `UpgradeButton`.
- **`new/page.tsx`:** Fetches `is_pro` server-side and passes it as a prop to `ScannerPage`.
- **`ScannerPage.tsx`:** Accepts `{ isPro: boolean }` and forwards it to `FindingsList`.
- **`project/[ref]/page.tsx`:** Scan history query now applies `.limit(isPro ? 100 : 1)`. Free users see an amber "Free: showing latest scan only" badge.

---

### Task 34 — Scans & Consent Log Tables
- **Migration** `supabase/migrations/20260302000000_add_scans_and_consent_log.sql`:
  - `public.scans` — full per-scan results (score, grade, JSONB findings, duration). RLS-protected, indexed on `(project_id, created_at DESC)`.
  - `public.scan_consent_log` — immutable legal audit trail. No end-user write policy; service role only.
- **`src/lib/supabase/admin.ts`** (new) — `supabaseAdmin` service role client using `SUPABASE_SERVICE_ROLE_KEY`. Never exposed to the browser.
- **`scan.ts`** updated to insert into `scans` after every successful scan via `supabaseAdmin`.

---

### Task 35 — Rate Limiting
- Added `checkRateLimit(userId, ip)` in `scan.ts`, called before any target DB connection opens.
- Queries `scan_consent_log` (already collected) as the rate-limit counter — no new table needed.
- Authenticated: 5 scans / hour. Unauthenticated: 2 scans / hour.
- Returns `{ success: false, rate_limited: true }` when exceeded.
- `ScannerPage.tsx` shows an amber Clock banner when `state.rate_limited` is true.

---

### Task 36 — Fixed Read-Only Role SQL Snippet
Updated the `READ_ONLY_SQL` constant in `ScannerPage.tsx` from a 3-line stub to a complete 6-step runnable snippet:
- `CREATE ROLE` with login
- `GRANT CONNECT ON DATABASE`
- `GRANT USAGE ON SCHEMA public`
- `GRANT SELECT ON ALL TABLES IN SCHEMA public`
- `GRANT USAGE ON SCHEMA pg_catalog, information_schema`
- `GRANT USAGE ON SCHEMA storage` + `GRANT SELECT ON storage.buckets`

Updated copy to: *"Run this in your Supabase SQL Editor. It creates a dedicated read-only role with the minimum permissions Supascan needs. Your application roles and data are completely unaffected."*

---

### Task 37 — Dashboard Empty State
Replaced the plain centered card with a full onboarding panel:
- Dashed-border container (`border-dashed border-slate-700 bg-slate-900/30`)
- Headline: "Run your first security audit"
- Two CTAs: "Start Your First Scan" (→ `/new`) and "How we keep your data safe →" (→ `/terms`)
- Trust signal row: 🔒 Zero-data promise · 🕐 Results in ~60s · 📄 SOC2-style report

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router, Server Actions) |
| Language | TypeScript (strict, 0 errors) |
| Styling | Tailwind CSS, Lucide React |
| DB Driver | `postgres` (postgres.js) |
| Auth & DB | Supabase (PostgreSQL + RLS) |
| PDF | `@react-pdf/renderer` |
| Billing | Lemon Squeezy |
| Hosting | Vercel |

---

## Environment Variables Required

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY        ← required for consent log + scans insert
LEMON_SQUEEZY_WEBHOOK_SECRET
LEMON_SQUEEZY_PRODUCT_ID
```
