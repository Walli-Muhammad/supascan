-- ============================================================
-- Migration: add_scans_and_consent_log
-- Created: 2026-03-02
-- ============================================================

-- ============================================================
-- Table: scans
-- Stores the full result of every audit scan.
-- projects.last_scan_score remains as a denormalized cache.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.scans (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      uuid        NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id         uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  score           integer     NOT NULL CHECK (score >= 0 AND score <= 100),
  grade           text        NOT NULL,
  findings        jsonb       NOT NULL DEFAULT '[]'::jsonb,
  tables_analyzed integer,
  duration_ms     integer,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scans FORCE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own scans"
  ON public.scans FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own scans"
  ON public.scans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Index for fast project history queries
CREATE INDEX IF NOT EXISTS idx_scans_project_created
  ON public.scans (project_id, created_at DESC);

-- ============================================================
-- Table: scan_consent_log
-- Immutable audit trail proving user authorization for each scan.
-- Service role is the only writer (bypasses RLS).
-- No SELECT policy for end users — internal audit log only.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.scan_consent_log (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  project_ref  text        NOT NULL,
  ip_address   text,
  user_agent   text,
  consented_at timestamptz NOT NULL DEFAULT now()
);

-- RLS — no SELECT or INSERT policies for end users intentionally.
-- Service role bypasses RLS and is the only writer.
ALTER TABLE public.scan_consent_log ENABLE ROW LEVEL SECURITY;
