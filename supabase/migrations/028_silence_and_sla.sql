-- ============================================================
-- MIGRATION 028: Silence detection + Alert SLA escalation
-- ============================================================
-- Two purpose-aligned safety improvements, both built on the
-- existing `alerts` table so they INHERIT its RLS privacy wall:
--   • Coaches have NO select policy on alerts → cannot see these.
--   • Psychiatrists need active consent.
--   • Support/admin are org-scoped.
-- No new RLS is required; additive nullable columns are covered
-- by every existing alerts policy.
--
-- FERPA note: these columns hold only timestamps, never wellness
-- content. trigger_type is free text (no enum change needed); the
-- new value 'no_checkin' is set server-side via service role.
-- ============================================================

-- escalated_at: set by the SLA sweep when a red alert has gone
-- unacknowledged past the escalation window. NULL = not escalated.
ALTER TABLE alerts
  ADD COLUMN IF NOT EXISTS escalated_at TIMESTAMPTZ;

-- last_checkin_at: context for silence ('no_checkin') alerts — the
-- timestamp of the athlete's most recent check-in at the time the
-- silence was detected. A bare timestamp, RLS-gated like the row.
ALTER TABLE alerts
  ADD COLUMN IF NOT EXISTS last_checkin_at TIMESTAMPTZ;

-- Index: SLA sweep scans open red alerts not yet escalated, oldest first.
CREATE INDEX IF NOT EXISTS idx_alerts_sla_open_red
  ON alerts (created_at)
  WHERE severity = 'red' AND status = 'open' AND escalated_at IS NULL;

-- Index: silence sweep dedupe — find existing open no_checkin alerts per athlete.
CREATE INDEX IF NOT EXISTS idx_alerts_open_no_checkin
  ON alerts (athlete_id)
  WHERE trigger_type = 'no_checkin' AND status = 'open';

-- Index: fast "latest check-in per athlete" lookup for the silence sweep.
CREATE INDEX IF NOT EXISTS idx_checkins_athlete_completed
  ON checkins (athlete_id, completed_at DESC);
