-- ============================================================
-- RadarJobs.co — PostgreSQL Schema for Supabase
-- ============================================================

-- ─────────────────────────────────────────────
-- TABLES
-- ─────────────────────────────────────────────

-- users: synced from Supabase Auth via trigger
CREATE TABLE IF NOT EXISTS public.users (
  id         UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email      TEXT        NOT NULL,
  name       TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- cvs: one CV per user (upsert on updated_at)
CREATE TABLE IF NOT EXISTS public.cvs (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  raw_text       TEXT        NOT NULL,
  parsed_skills  TEXT[]      DEFAULT '{}',
  parsed_title   TEXT,
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- jobs: scraped listings, inserted by service role
CREATE TABLE IF NOT EXISTS public.jobs (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT        NOT NULL,
  company     TEXT        NOT NULL,
  location    TEXT,
  description TEXT,
  url         TEXT        UNIQUE NOT NULL,
  source      TEXT        CHECK (source IN ('linkedin', 'indeed', 'glassdoor', 'google')),
  salary_min  INTEGER,
  salary_max  INTEGER,
  posted_at   TIMESTAMPTZ,
  scraped_at  TIMESTAMPTZ DEFAULT NOW()
);

-- matches: CV-to-job scoring results per user
CREATE TABLE IF NOT EXISTS public.matches (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  job_id            UUID        NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  score             INTEGER     NOT NULL CHECK (score >= 0 AND score <= 100),
  matched_keywords  TEXT[]      DEFAULT '{}',
  missing_keywords  TEXT[]      DEFAULT '{}',
  summary           TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, job_id)
);

-- alert_prefs: per-user notification configuration
CREATE TABLE IF NOT EXISTS public.alert_prefs (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
  min_score      INTEGER     DEFAULT 70 CHECK (min_score >= 0 AND min_score <= 100),
  job_titles     TEXT[]      DEFAULT '{}',
  locations      TEXT[]      DEFAULT '{}',
  email_enabled  BOOLEAN     DEFAULT TRUE
);

-- ─────────────────────────────────────────────
-- INDEXES
-- ─────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_cvs_user_id      ON public.cvs      (user_id);
CREATE INDEX IF NOT EXISTS idx_matches_user_id  ON public.matches  (user_id);
CREATE INDEX IF NOT EXISTS idx_matches_job_id   ON public.matches  (job_id);
CREATE INDEX IF NOT EXISTS idx_jobs_url         ON public.jobs     (url);
CREATE INDEX IF NOT EXISTS idx_jobs_scraped_at  ON public.jobs     (scraped_at DESC);

-- ─────────────────────────────────────────────
-- ROW LEVEL SECURITY — enable on all tables
-- ─────────────────────────────────────────────

ALTER TABLE public.users       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cvs         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_prefs ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────
-- RLS POLICIES — users
-- ─────────────────────────────────────────────

CREATE POLICY "users_select_own"
  ON public.users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "users_insert_own"
  ON public.users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "users_update_own"
  ON public.users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "users_delete_own"
  ON public.users FOR DELETE
  TO authenticated
  USING (auth.uid() = id);

-- ─────────────────────────────────────────────
-- RLS POLICIES — cvs
-- ─────────────────────────────────────────────

CREATE POLICY "cvs_select_own"
  ON public.cvs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "cvs_insert_own"
  ON public.cvs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "cvs_update_own"
  ON public.cvs FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "cvs_delete_own"
  ON public.cvs FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────
-- RLS POLICIES — jobs
-- All authenticated users can read; only service role can insert/update/delete
-- ─────────────────────────────────────────────

CREATE POLICY "jobs_select_authenticated"
  ON public.jobs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "jobs_insert_service_role"
  ON public.jobs FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "jobs_update_service_role"
  ON public.jobs FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "jobs_delete_service_role"
  ON public.jobs FOR DELETE
  TO service_role
  USING (true);

-- ─────────────────────────────────────────────
-- RLS POLICIES — matches
-- ─────────────────────────────────────────────

CREATE POLICY "matches_select_own"
  ON public.matches FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "matches_insert_own"
  ON public.matches FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "matches_update_own"
  ON public.matches FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "matches_delete_own"
  ON public.matches FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Service role can also insert matches (for background scoring jobs)
CREATE POLICY "matches_insert_service_role"
  ON public.matches FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "matches_update_service_role"
  ON public.matches FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ─────────────────────────────────────────────
-- RLS POLICIES — alert_prefs
-- ─────────────────────────────────────────────

CREATE POLICY "alert_prefs_select_own"
  ON public.alert_prefs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "alert_prefs_insert_own"
  ON public.alert_prefs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "alert_prefs_update_own"
  ON public.alert_prefs FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "alert_prefs_delete_own"
  ON public.alert_prefs FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────
-- AUTH TRIGGER — auto-insert into public.users
-- ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'full_name'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
