-- ============================================================
-- MIGRATION 009: Apply missing changes from migration 004
-- Migration 004 was never applied to the live database.
-- This migration is fully idempotent — safe to run multiple times.
-- ============================================================

-- ── Teams: season + active columns (the main reason Create Team fails) ─────────

ALTER TABLE teams
  ADD COLUMN IF NOT EXISTS season TEXT,
  ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_teams_active ON teams(active);

-- ── Organizations: division + conference (needed by admin teams page) ──────────

ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS division   TEXT,
  ADD COLUMN IF NOT EXISTS conference TEXT;

-- ── Audit logs: organization_id + auto-fill trigger ───────────────────────────

ALTER TABLE audit_logs
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_audit_logs_org ON audit_logs(organization_id);

CREATE OR REPLACE FUNCTION auto_set_audit_org()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.actor_profile_id IS NOT NULL AND NEW.organization_id IS NULL THEN
    SELECT organization_id INTO NEW.organization_id
    FROM profiles WHERE id = NEW.actor_profile_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS set_audit_org_before_insert ON audit_logs;
CREATE TRIGGER set_audit_org_before_insert
  BEFORE INSERT ON audit_logs
  FOR EACH ROW EXECUTE FUNCTION auto_set_audit_org();

-- ── Audit log RLS: org-scoped ─────────────────────────────────────────────────

DROP POLICY IF EXISTS "Admins read audit logs"     ON audit_logs;
DROP POLICY IF EXISTS "Admins read org audit logs" ON audit_logs;

CREATE POLICY "Admins read org audit logs"
  ON audit_logs FOR SELECT
  USING (
    get_my_role() = 'admin'
    AND organization_id = get_my_org_id()
  );

DROP POLICY IF EXISTS "Psychiatrists read own org audit logs" ON audit_logs;
CREATE POLICY "Psychiatrists read own org audit logs"
  ON audit_logs FOR SELECT
  USING (
    get_my_role() IN ('psychiatrist', 'trusted_adult')
    AND actor_profile_id = get_my_profile_id()
  );

-- ── athlete_teams junction table ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS athlete_teams (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id  UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  team_id     UUID        NOT NULL REFERENCES teams(id)    ON DELETE CASCADE,
  is_primary  BOOLEAN     NOT NULL DEFAULT false,
  joined_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (athlete_id, team_id)
);

CREATE INDEX IF NOT EXISTS idx_athlete_teams_athlete ON athlete_teams(athlete_id);
CREATE INDEX IF NOT EXISTS idx_athlete_teams_team    ON athlete_teams(team_id);
ALTER TABLE athlete_teams ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Athletes read own team memberships" ON athlete_teams;
CREATE POLICY "Athletes read own team memberships"
  ON athlete_teams FOR SELECT
  USING (athlete_id = get_my_profile_id());

DROP POLICY IF EXISTS "Staff read org team memberships" ON athlete_teams;
CREATE POLICY "Staff read org team memberships"
  ON athlete_teams FOR SELECT
  USING (
    get_my_role() IN ('coach', 'support', 'admin')
    AND team_id IN (SELECT id FROM teams WHERE organization_id = get_my_org_id())
  );

DROP POLICY IF EXISTS "Admins manage team memberships" ON athlete_teams;
CREATE POLICY "Admins manage team memberships"
  ON athlete_teams FOR ALL
  USING (
    get_my_role() = 'admin'
    AND team_id IN (SELECT id FROM teams WHERE organization_id = get_my_org_id())
  );

-- Backfill athlete_teams from existing profiles.team_id
INSERT INTO athlete_teams (athlete_id, team_id, is_primary, joined_at)
SELECT id, team_id, true, created_at
FROM profiles
WHERE team_id IS NOT NULL AND role = 'athlete'
ON CONFLICT (athlete_id, team_id) DO NOTHING;

-- ── Alerts RLS: psychiatrists can read alerts for consented athletes ───────────

DROP POLICY IF EXISTS "Psychiatrist read consented alerts" ON alerts;
CREATE POLICY "Psychiatrist read consented alerts"
  ON alerts FOR SELECT
  USING (
    get_my_role() IN ('psychiatrist', 'trusted_adult')
    AND EXISTS (
      SELECT 1 FROM consent_logs cl
      WHERE cl.athlete_id        = athlete_id
        AND cl.target_profile_id = get_my_profile_id()
        AND cl.is_active         = true
        AND (cl.expires_at IS NULL OR cl.expires_at > now())
    )
  );

-- ── Helper function ───────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION get_org_team_count(p_org_id UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER FROM teams WHERE organization_id = p_org_id AND active = true
$$ LANGUAGE sql SECURITY DEFINER STABLE;
