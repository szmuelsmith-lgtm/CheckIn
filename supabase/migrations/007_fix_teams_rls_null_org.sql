-- ============================================================
-- MIGRATION 007: Fix teams RLS — NULL org_id edge case
-- ============================================================
-- The original "Admins manage teams" policy used USING without
-- WITH CHECK, and the expression `organization_id = get_my_org_id()`
-- evaluates to FALSE (not TRUE) when both sides are NULL in SQL.
-- This silently blocked team creation for admins whose org_id was
-- not yet set. Fixed by also adding explicit WITH CHECK that matches.
-- ============================================================

-- Also extend alerts UPDATE policy so psychiatrists/trusted adults
-- can acknowledge alerts for their consented athletes (needed for
-- the ACT button on the counselor dashboard).

-- ── Teams: explicit WITH CHECK so NULL-org edge case doesn't silently fail ────

DROP POLICY IF EXISTS "Admins manage teams" ON teams;

CREATE POLICY "Admins manage teams"
  ON teams FOR ALL
  USING (
    get_my_role() = 'admin'
    AND (
      organization_id = get_my_org_id()
      OR (organization_id IS NULL AND get_my_org_id() IS NULL)
    )
  )
  WITH CHECK (
    get_my_role() = 'admin'
    AND (
      organization_id = get_my_org_id()
      OR (organization_id IS NULL AND get_my_org_id() IS NULL)
    )
  );

-- ── Invite codes: same fix so auto-generated codes can be inserted ────────────

DROP POLICY IF EXISTS "Admins manage invite codes" ON invite_codes;

CREATE POLICY "Admins manage invite codes"
  ON invite_codes FOR ALL
  USING (
    get_my_role() = 'admin'
    AND (
      organization_id = get_my_org_id()
      OR (organization_id IS NULL AND get_my_org_id() IS NULL)
    )
  )
  WITH CHECK (
    get_my_role() = 'admin'
    AND (
      organization_id = get_my_org_id()
      OR (organization_id IS NULL AND get_my_org_id() IS NULL)
    )
  );

-- ── Alerts: let psychiatrists/trusted adults update alerts for consented athletes ──
-- Inline the consent check rather than calling has_consent() in case it isn't
-- deployed yet on this database.

DROP POLICY IF EXISTS "Psychiatrist update consented alerts" ON alerts;

CREATE POLICY "Psychiatrist update consented alerts"
  ON alerts FOR UPDATE
  USING (
    get_my_role() IN ('psychiatrist', 'trusted_adult')
    AND EXISTS (
      SELECT 1 FROM consent_logs cl
      WHERE cl.athlete_id        = athlete_id
        AND cl.target_profile_id = get_my_profile_id()
        AND cl.is_active         = true
        AND (cl.expires_at IS NULL OR cl.expires_at > now())
    )
  )
  WITH CHECK (
    get_my_role() IN ('psychiatrist', 'trusted_adult')
    AND EXISTS (
      SELECT 1 FROM consent_logs cl
      WHERE cl.athlete_id        = athlete_id
        AND cl.target_profile_id = get_my_profile_id()
        AND cl.is_active         = true
        AND (cl.expires_at IS NULL OR cl.expires_at > now())
    )
  );

-- ── Followups: extend to trusted_adult (missed in migration 006) ──────────────

DROP POLICY IF EXISTS "Staff manage followups" ON followups;

CREATE POLICY "Staff manage followups"
  ON followups FOR ALL
  USING (
    get_my_role() IN ('support', 'admin', 'psychiatrist', 'trusted_adult')
    AND athlete_id IN (
      SELECT id FROM profiles WHERE organization_id = get_my_org_id()
    )
  )
  WITH CHECK (
    get_my_role() IN ('support', 'admin', 'psychiatrist', 'trusted_adult')
    AND athlete_id IN (
      SELECT id FROM profiles WHERE organization_id = get_my_org_id()
    )
  );

-- ── Followups: make alert_id nullable ────────────────────────────────────────
-- The original schema had alert_id NOT NULL, but counselors need to create
-- follow-ups directly from the patient queue without a linked alert.
-- Adding a reason column default prevents NULL constraint on existing rows.

ALTER TABLE followups
  ALTER COLUMN alert_id DROP NOT NULL;

-- ── Alerts: add team_id + organization_id for org-scoped filtering ────────────
-- The checkins API route inserts these columns for filtering; they must exist.

ALTER TABLE alerts
  ADD COLUMN IF NOT EXISTS team_id         UUID REFERENCES teams(id)         ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_alerts_org  ON alerts(organization_id);
CREATE INDEX IF NOT EXISTS idx_alerts_team ON alerts(team_id);

-- Backfill existing alerts from their athlete's profile
UPDATE alerts a
SET
  team_id         = p.team_id,
  organization_id = p.organization_id
FROM profiles p
WHERE a.athlete_id = p.id
  AND (a.team_id IS NULL OR a.organization_id IS NULL);

-- ── Alerts RLS: org-scoped read for support/admin now uses organization_id ─────
-- The previous policy was a subquery on profiles; this is faster with the new col.

DROP POLICY IF EXISTS "Support and admin read alerts" ON alerts;
DROP POLICY IF EXISTS "Support and admin update alerts" ON alerts;

CREATE POLICY "Support and admin read alerts"
  ON alerts FOR SELECT
  USING (
    get_my_role() IN ('support', 'admin')
    AND (
      organization_id = get_my_org_id()
      OR athlete_id IN (SELECT id FROM profiles WHERE organization_id = get_my_org_id())
    )
  );

CREATE POLICY "Support and admin update alerts"
  ON alerts FOR UPDATE
  USING (
    get_my_role() IN ('support', 'admin')
    AND (
      organization_id = get_my_org_id()
      OR athlete_id IN (SELECT id FROM profiles WHERE organization_id = get_my_org_id())
    )
  );
