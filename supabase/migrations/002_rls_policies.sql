-- ============================================================
-- MIGRATION 002: RLS Policies for new tables
-- ============================================================

ALTER TABLE questions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_logs   ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_logs    ENABLE ROW LEVEL SECURITY;

-- Helper: check active consent
CREATE OR REPLACE FUNCTION has_consent(p_athlete_id UUID, p_scope consent_scope)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM consent_logs
    WHERE athlete_id = p_athlete_id
      AND target_profile_id = get_my_profile_id()
      AND is_active = true
      AND (expires_at IS NULL OR expires_at > now())
      AND (scope = p_scope OR scope = 'full')
  )
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- QUESTIONS
CREATE POLICY IF NOT EXISTS "All authenticated read active questions"
  ON questions FOR SELECT USING (active = true);

CREATE POLICY IF NOT EXISTS "Admins manage questions"
  ON questions FOR ALL USING (get_my_role() = 'admin');

-- QUESTION USAGE
CREATE POLICY IF NOT EXISTS "Athletes read own usage"
  ON question_usage FOR SELECT USING (athlete_id = get_my_profile_id());

CREATE POLICY IF NOT EXISTS "Athletes insert own usage"
  ON question_usage FOR INSERT WITH CHECK (athlete_id = get_my_profile_id());

-- CONSENT LOGS
CREATE POLICY IF NOT EXISTS "Athletes read own consents"
  ON consent_logs FOR SELECT USING (athlete_id = get_my_profile_id());

CREATE POLICY IF NOT EXISTS "Athletes create consents"
  ON consent_logs FOR INSERT WITH CHECK (athlete_id = get_my_profile_id());

CREATE POLICY IF NOT EXISTS "Athletes revoke own consents"
  ON consent_logs FOR UPDATE USING (athlete_id = get_my_profile_id());

CREATE POLICY IF NOT EXISTS "Targets read their consents"
  ON consent_logs FOR SELECT USING (target_profile_id = get_my_profile_id());

-- ACCESS LOGS
CREATE POLICY IF NOT EXISTS "Athletes read own access logs"
  ON access_logs FOR SELECT USING (athlete_id = get_my_profile_id());

CREATE POLICY IF NOT EXISTS "Authenticated insert access log"
  ON access_logs FOR INSERT WITH CHECK (true);

-- PSYCHIATRIST checkin access
CREATE POLICY IF NOT EXISTS "Psychiatrist read consented checkins"
  ON checkins FOR SELECT
  USING (
    get_my_role() = 'psychiatrist'
    AND has_consent(athlete_id, 'summary')
  );

CREATE POLICY IF NOT EXISTS "Trusted adult read consented checkins"
  ON checkins FOR SELECT
  USING (
    get_my_role() = 'trusted_adult'
    AND has_consent(athlete_id, 'summary')
  );
