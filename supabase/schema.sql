-- Check-In by Athlete Anchor — Database Schema
-- Sprint 1: Core tables for organizations, teams, profiles, checkins, alerts, audit_logs
-- Additional tables (journals, followups, resources, athlete_preferences) included for completeness

-- Enums
CREATE TYPE user_role AS ENUM ('athlete', 'coach', 'support', 'admin');
CREATE TYPE risk_level AS ENUM ('green', 'yellow', 'red');
CREATE TYPE alert_severity AS ENUM ('yellow', 'red');
CREATE TYPE alert_status AS ENUM ('open', 'acknowledged', 'resolved');
CREATE TYPE followup_status AS ENUM ('open', 'in_progress', 'completed');
CREATE TYPE resource_category AS ENUM ('crisis', 'counseling', 'academic', 'wellness', 'other');

-- Organizations
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'university',
  reminder_day INTEGER NOT NULL DEFAULT 1, -- 0=Sunday, 1=Monday, etc.
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Teams
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sport TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_teams_org ON teams(organization_id);

-- Profiles
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'athlete',
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  onboarded BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_profiles_auth ON profiles(auth_user_id);
CREATE INDEX idx_profiles_org ON profiles(organization_id);
CREATE INDEX idx_profiles_team ON profiles(team_id);
CREATE INDEX idx_profiles_role ON profiles(role);

-- Athlete Preferences
CREATE TABLE athlete_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  wants_faith_support BOOLEAN NOT NULL DEFAULT false,
  wants_family_checkins BOOLEAN NOT NULL DEFAULT false,
  wants_peer_support BOOLEAN NOT NULL DEFAULT false,
  opt_out_reminders BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Check-ins
CREATE TABLE checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  mood_score INTEGER NOT NULL CHECK (mood_score BETWEEN 1 AND 10),
  stress_score INTEGER NOT NULL CHECK (stress_score BETWEEN 1 AND 10),
  sleep_score INTEGER NOT NULL CHECK (sleep_score BETWEEN 1 AND 10),
  support_score INTEGER NOT NULL CHECK (support_score BETWEEN 1 AND 10),
  family_score INTEGER CHECK (family_score BETWEEN 1 AND 10),
  social_score INTEGER CHECK (social_score BETWEEN 1 AND 10),
  spiritual_score INTEGER CHECK (spiritual_score BETWEEN 1 AND 10),
  academic_score INTEGER CHECK (academic_score BETWEEN 1 AND 10),
  athletic_confidence_score INTEGER CHECK (athletic_confidence_score BETWEEN 1 AND 10),
  wants_followup BOOLEAN NOT NULL DEFAULT false,
  notes_private TEXT,
  risk_level risk_level NOT NULL DEFAULT 'green',
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_checkins_athlete ON checkins(athlete_id);
CREATE INDEX idx_checkins_team ON checkins(team_id);
CREATE INDEX idx_checkins_completed ON checkins(completed_at DESC);
CREATE INDEX idx_checkins_risk ON checkins(risk_level);

-- Journals (athlete-only, private)
CREATE TABLE journals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_journals_athlete ON journals(athlete_id);

-- Alerts (system-generated from risk scoring)
CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  checkin_id UUID NOT NULL REFERENCES checkins(id) ON DELETE CASCADE,
  severity alert_severity NOT NULL,
  trigger_type TEXT NOT NULL, -- e.g., 'risk_score', 'wants_followup'
  status alert_status NOT NULL DEFAULT 'open',
  assigned_to_profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);
CREATE INDEX idx_alerts_athlete ON alerts(athlete_id);
CREATE INDEX idx_alerts_status ON alerts(status);
CREATE INDEX idx_alerts_severity ON alerts(severity);

-- Follow-ups (staff-created from alerts)
CREATE TABLE followups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  alert_id UUID NOT NULL REFERENCES alerts(id) ON DELETE RESTRICT,
  assigned_to_profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  assigned_by_profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reason TEXT NOT NULL DEFAULT '',
  status followup_status NOT NULL DEFAULT 'open',
  due_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);
CREATE INDEX idx_followups_athlete ON followups(athlete_id);
CREATE INDEX idx_followups_assigned ON followups(assigned_to_profile_id);
CREATE INDEX idx_followups_status ON followups(status);

-- Resources
CREATE TABLE resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category resource_category NOT NULL DEFAULT 'other',
  url TEXT NOT NULL DEFAULT '',
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_resources_org ON resources(organization_id);

-- Audit Logs
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL, -- 'view', 'create', 'update', 'delete'
  target_type TEXT NOT NULL, -- e.g., 'checkin', 'alert', 'profile'
  target_id UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_actor ON audit_logs(actor_profile_id);
CREATE INDEX idx_audit_created ON audit_logs(created_at DESC);

-- Invite codes for team onboarding
CREATE TABLE invite_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  role user_role NOT NULL DEFAULT 'athlete',
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  uses_remaining INTEGER, -- NULL = unlimited
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_invite_code ON invite_codes(code);
