-- Migration 022: Add composite indexes for 30-team / 1500-athlete scale
--
-- Without these, the admin dashboard and reminders cron do full seq-scans on
-- the checkins table (potentially 100K+ rows) for every page load.

-- ── checkins ──────────────────────────────────────────────────────────────────

-- Admin dashboard: checkins filtered by team_id + date window (replaces athlete_id IN)
CREATE INDEX IF NOT EXISTS idx_checkins_team_completed
  ON public.checkins (team_id, completed_at DESC);

-- Coach aggregate: checkins by athlete_id + mode + date (the per-team 28-day query)
CREATE INDEX IF NOT EXISTS idx_checkins_athlete_mode_completed
  ON public.checkins (athlete_id, mode, completed_at DESC);

-- Reminders cron: recent check-in lookup per athlete
CREATE INDEX IF NOT EXISTS idx_checkins_athlete_completed
  ON public.checkins (athlete_id, completed_at DESC);

-- ── alerts ────────────────────────────────────────────────────────────────────

-- Admin dashboard: open alerts by team
CREATE INDEX IF NOT EXISTS idx_alerts_team_status
  ON public.alerts (team_id, status, created_at DESC);

-- ── consent_logs ─────────────────────────────────────────────────────────────

-- Psychiatrist dashboard: active consents targeting a specific provider
CREATE INDEX IF NOT EXISTS idx_consent_logs_target_active
  ON public.consent_logs (target_profile_id, is_active, granted_at DESC);

-- ── profiles ─────────────────────────────────────────────────────────────────

-- Admin/reminders: athletes by org + role (already indexed on org and role separately;
-- composite helps the combined filter)
CREATE INDEX IF NOT EXISTS idx_profiles_org_role
  ON public.profiles (organization_id, role);

-- ── question_usage ────────────────────────────────────────────────────────────

-- Questions route: recent usage per athlete
CREATE INDEX IF NOT EXISTS idx_question_usage_athlete_used
  ON public.question_usage (athlete_id, used_at DESC);

-- ── audit_logs ────────────────────────────────────────────────────────────────

-- Admin dashboard: recent audit log per org
CREATE INDEX IF NOT EXISTS idx_audit_logs_org_created
  ON public.audit_logs (organization_id, created_at DESC);
