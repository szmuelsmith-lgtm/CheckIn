-- Row Level Security Policies for Check-In
-- Sprint 1: Athlete and Admin roles

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE athlete_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE journals ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE followups ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE invite_codes ENABLE ROW LEVEL SECURITY;

-- Helper function: get current user's profile
CREATE OR REPLACE FUNCTION get_my_profile_id()
RETURNS UUID AS $$
  SELECT id FROM profiles WHERE auth_user_id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION get_my_role()
RETURNS user_role AS $$
  SELECT role FROM profiles WHERE auth_user_id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION get_my_org_id()
RETURNS UUID AS $$
  SELECT organization_id FROM profiles WHERE auth_user_id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION get_my_team_id()
RETURNS UUID AS $$
  SELECT team_id FROM profiles WHERE auth_user_id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- PROFILES
-- Users can read their own profile
CREATE POLICY "Users read own profile"
  ON profiles FOR SELECT
  USING (auth_user_id = auth.uid());

-- Coaches can see athletes on their team (limited fields enforced at app layer)
CREATE POLICY "Coaches read team profiles"
  ON profiles FOR SELECT
  USING (
    get_my_role() IN ('coach', 'support', 'admin')
    AND organization_id = get_my_org_id()
  );

-- Users can update their own profile
CREATE POLICY "Users update own profile"
  ON profiles FOR UPDATE
  USING (auth_user_id = auth.uid());

-- Allow insert during signup
CREATE POLICY "Users insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth_user_id = auth.uid());

-- ORGANIZATIONS
CREATE POLICY "Members read own org"
  ON organizations FOR SELECT
  USING (id = get_my_org_id());

CREATE POLICY "Admins manage orgs"
  ON organizations FOR ALL
  USING (get_my_role() = 'admin' AND id = get_my_org_id());

-- Allow insert for new org creation (no profile yet)
CREATE POLICY "Anyone can create org during signup"
  ON organizations FOR INSERT
  WITH CHECK (true);

-- TEAMS
CREATE POLICY "Members read teams in org"
  ON teams FOR SELECT
  USING (organization_id = get_my_org_id());

CREATE POLICY "Admins manage teams"
  ON teams FOR ALL
  USING (get_my_role() = 'admin' AND organization_id = get_my_org_id());

-- ATHLETE PREFERENCES (athlete-only, private)
CREATE POLICY "Athletes manage own preferences"
  ON athlete_preferences FOR ALL
  USING (athlete_id = get_my_profile_id());

-- CHECKINS
-- Athletes read/write own check-ins
CREATE POLICY "Athletes manage own checkins"
  ON checkins FOR ALL
  USING (athlete_id = get_my_profile_id());

-- Coaches can read check-ins for their team (risk_level + completed_at only, enforced at app layer)
CREATE POLICY "Coaches read team checkins"
  ON checkins FOR SELECT
  USING (
    get_my_role() = 'coach'
    AND team_id = get_my_team_id()
  );

-- Support/Admin can read check-ins in their org
CREATE POLICY "Support and admin read org checkins"
  ON checkins FOR SELECT
  USING (
    get_my_role() IN ('support', 'admin')
    AND team_id IN (SELECT id FROM teams WHERE organization_id = get_my_org_id())
  );

-- JOURNALS (athlete-only, fully private)
CREATE POLICY "Athletes manage own journals"
  ON journals FOR ALL
  USING (athlete_id = get_my_profile_id());

-- ALERTS
-- Support/Admin read alerts in their org
CREATE POLICY "Support and admin read alerts"
  ON alerts FOR SELECT
  USING (
    get_my_role() IN ('support', 'admin')
    AND athlete_id IN (
      SELECT id FROM profiles WHERE organization_id = get_my_org_id()
    )
  );

-- Support/Admin can update alert status
CREATE POLICY "Support and admin update alerts"
  ON alerts FOR UPDATE
  USING (
    get_my_role() IN ('support', 'admin')
    AND athlete_id IN (
      SELECT id FROM profiles WHERE organization_id = get_my_org_id()
    )
  );

-- System inserts alerts (via service role or trigger)
CREATE POLICY "Authenticated users insert alerts"
  ON alerts FOR INSERT
  WITH CHECK (true);

-- FOLLOWUPS
CREATE POLICY "Athletes read own followups"
  ON followups FOR SELECT
  USING (athlete_id = get_my_profile_id());

CREATE POLICY "Staff manage followups"
  ON followups FOR ALL
  USING (
    get_my_role() IN ('coach', 'support', 'admin')
    AND athlete_id IN (
      SELECT id FROM profiles WHERE organization_id = get_my_org_id()
    )
  );

-- RESOURCES
CREATE POLICY "Members read org resources"
  ON resources FOR SELECT
  USING (
    organization_id = get_my_org_id()
    OR organization_id IS NULL
  );

CREATE POLICY "Admins manage resources"
  ON resources FOR ALL
  USING (
    get_my_role() = 'admin'
    AND (organization_id = get_my_org_id() OR organization_id IS NULL)
  );

-- AUDIT LOGS
CREATE POLICY "Admins read audit logs"
  ON audit_logs FOR SELECT
  USING (get_my_role() = 'admin');

CREATE POLICY "Authenticated users insert audit logs"
  ON audit_logs FOR INSERT
  WITH CHECK (true);

-- INVITE CODES
CREATE POLICY "Admins manage invite codes"
  ON invite_codes FOR ALL
  USING (
    get_my_role() = 'admin'
    AND organization_id = get_my_org_id()
  );

-- Anyone can read invite codes (for signup flow)
CREATE POLICY "Anyone can validate invite codes"
  ON invite_codes FOR SELECT
  USING (true);
