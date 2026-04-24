-- ============================================================
-- MIGRATION 004: Scale & Compliance — Multi-school, Multi-sport
-- ============================================================
-- 1. Org-scope audit_logs via organization_id + auto-fill trigger
-- 2. Fix RLS on audit_logs to isolate orgs
-- 3. athlete_teams junction table for multi-sport athletes
-- 4. season + active columns on teams
-- 5. division + conference columns on organizations
-- ============================================================

-- ── 1. AUDIT LOGS: add organization_id ───────────────────────────────────────

ALTER TABLE audit_logs
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_audit_logs_org ON audit_logs(organization_id);

-- Auto-populate organization_id from the actor's profile on every insert.
-- This means callers never need to pass organization_id explicitly.
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

-- ── 2. FIX RLS: audit_logs must be org-scoped ────────────────────────────────

-- Drop the old unscoped policy
DROP POLICY IF EXISTS "Admins read audit logs" ON audit_logs;

-- Admins can only read logs from their own organization
CREATE POLICY "Admins read org audit logs"
  ON audit_logs FOR SELECT
  USING (
    get_my_role() = 'admin'
    AND organization_id = get_my_org_id()
  );

-- Psychiatrists / trusted adults can read access logs scoped to their org
-- (they already only see consented athletes, but belt-and-suspenders)
CREATE POLICY IF NOT EXISTS "Psychiatrists read own org audit logs"
  ON audit_logs FOR SELECT
  USING (
    get_my_role() IN ('psychiatrist', 'trusted_adult')
    AND actor_profile_id = get_my_profile_id()
  );

-- ── 3. ATHLETE_TEAMS: multi-sport junction table ──────────────────────────────

CREATE TABLE IF NOT EXISTS athlete_teams (
  id          UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id  UUID      NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  team_id     UUID      NOT NULL REFERENCES teams(id)    ON DELETE CASCADE,
  is_primary  BOOLEAN   NOT NULL DEFAULT false,
  joined_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (athlete_id, team_id)
);

CREATE INDEX IF NOT EXISTS idx_athlete_teams_athlete ON athlete_teams(athlete_id);
CREATE INDEX IF NOT EXISTS idx_athlete_teams_team    ON athlete_teams(team_id);

ALTER TABLE athlete_teams ENABLE ROW LEVEL SECURITY;

-- Athletes can see their own team memberships
CREATE POLICY IF NOT EXISTS "Athletes read own team memberships"
  ON athlete_teams FOR SELECT
  USING (athlete_id = get_my_profile_id());

-- Coaches, support, admins can see memberships within their org
CREATE POLICY IF NOT EXISTS "Staff read org team memberships"
  ON athlete_teams FOR SELECT
  USING (
    get_my_role() IN ('coach', 'support', 'admin')
    AND team_id IN (SELECT id FROM teams WHERE organization_id = get_my_org_id())
  );

-- Admins can manage memberships for their org
CREATE POLICY IF NOT EXISTS "Admins manage team memberships"
  ON athlete_teams FOR ALL
  USING (
    get_my_role() = 'admin'
    AND team_id IN (SELECT id FROM teams WHERE organization_id = get_my_org_id())
  );

-- Backfill: populate athlete_teams from existing profiles.team_id
INSERT INTO athlete_teams (athlete_id, team_id, is_primary, joined_at)
SELECT id, team_id, true, created_at
FROM profiles
WHERE team_id IS NOT NULL
  AND role = 'athlete'
ON CONFLICT (athlete_id, team_id) DO NOTHING;

-- ── 4. TEAMS: season + active ─────────────────────────────────────────────────

ALTER TABLE teams
  ADD COLUMN IF NOT EXISTS season TEXT,      -- e.g. 'Fall 2026', 'Spring 2026'
  ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_teams_active ON teams(active);

-- ── 5. ORGANIZATIONS: division + conference ───────────────────────────────────

ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS division   TEXT,  -- 'D1', 'D2', 'D3', 'NAIA', 'NJCAA', etc.
  ADD COLUMN IF NOT EXISTS conference TEXT;  -- e.g. 'ACC', 'Big Ten', 'Pac-12'

-- ── 6. HELPER: get count of active teams in org ───────────────────────────────

CREATE OR REPLACE FUNCTION get_org_team_count(p_org_id UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER FROM teams WHERE organization_id = p_org_id AND active = true
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ── 7. ENSURE psychiatrist + trusted_adult are in the alerts RLS ──────────────
-- Psychiatrists with consent should be able to see alerts for their athletes

DROP POLICY IF EXISTS "Psychiatrist read consented alerts" ON alerts;
CREATE POLICY "Psychiatrist read consented alerts"
  ON alerts FOR SELECT
  USING (
    get_my_role() IN ('psychiatrist', 'trusted_adult')
    AND has_consent(athlete_id, 'summary')
  );
