-- Seed data for Check-In by Athlete Anchor
-- Creates: 1 org, 2 teams, 1 admin, 1 support, 2 coaches, 8 athletes, sample check-ins, alerts, resources

-- Note: Run this AFTER creating auth users in Supabase Auth dashboard.
-- The auth_user_id values below are placeholders — replace with real auth UIDs after creating users.
-- Password for all demo accounts: CheckIn2024!

-- ============================================
-- Organization
-- ============================================
INSERT INTO organizations (id, name, type, reminder_day) VALUES
  ('00000000-0000-0000-0000-000000000001', 'State University Athletics', 'university', 1);

-- ============================================
-- Teams
-- ============================================
INSERT INTO teams (id, organization_id, name, sport) VALUES
  ('00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0000-000000000001', 'Men''s Basketball', 'Basketball'),
  ('00000000-0000-0000-0001-000000000002', '00000000-0000-0000-0000-000000000001', 'Women''s Soccer', 'Soccer');

-- ============================================
-- Profiles (replace auth_user_id with real Supabase Auth UIDs)
-- ============================================

-- Admin
INSERT INTO profiles (id, auth_user_id, full_name, email, role, organization_id, team_id, onboarded) VALUES
  ('00000000-0000-0000-0002-000000000001', '00000000-aaaa-0000-0000-000000000001', 'Alex Director', 'admin@stateuniv.edu', 'admin', '00000000-0000-0000-0000-000000000001', NULL, true);

-- Support staff
INSERT INTO profiles (id, auth_user_id, full_name, email, role, organization_id, team_id, onboarded) VALUES
  ('00000000-0000-0000-0002-000000000002', '00000000-aaaa-0000-0000-000000000002', 'Dr. Sarah Wellness', 'counselor@stateuniv.edu', 'support', '00000000-0000-0000-0000-000000000001', NULL, true);

-- Coaches
INSERT INTO profiles (id, auth_user_id, full_name, email, role, organization_id, team_id, onboarded) VALUES
  ('00000000-0000-0000-0002-000000000003', '00000000-aaaa-0000-0000-000000000003', 'Coach Mike Johnson', 'coach.mike@stateuniv.edu', 'coach', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000001', true),
  ('00000000-0000-0000-0002-000000000004', '00000000-aaaa-0000-0000-000000000004', 'Coach Lisa Chen', 'coach.lisa@stateuniv.edu', 'coach', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000002', true);

-- Athletes - Basketball
INSERT INTO profiles (id, auth_user_id, full_name, email, role, organization_id, team_id, onboarded) VALUES
  ('00000000-0000-0000-0002-000000000010', '00000000-aaaa-0000-0000-000000000010', 'Jordan Williams', 'jordan@stateuniv.edu', 'athlete', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000001', true),
  ('00000000-0000-0000-0002-000000000011', '00000000-aaaa-0000-0000-000000000011', 'Marcus Davis', 'marcus@stateuniv.edu', 'athlete', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000001', true),
  ('00000000-0000-0000-0002-000000000012', '00000000-aaaa-0000-0000-000000000012', 'Tyler Brown', 'tyler@stateuniv.edu', 'athlete', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000001', true),
  ('00000000-0000-0000-0002-000000000013', '00000000-aaaa-0000-0000-000000000013', 'Chris Thompson', 'chris@stateuniv.edu', 'athlete', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000001', true);

-- Athletes - Soccer
INSERT INTO profiles (id, auth_user_id, full_name, email, role, organization_id, team_id, onboarded) VALUES
  ('00000000-0000-0000-0002-000000000020', '00000000-aaaa-0000-0000-000000000020', 'Emma Rodriguez', 'emma@stateuniv.edu', 'athlete', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000002', true),
  ('00000000-0000-0000-0002-000000000021', '00000000-aaaa-0000-0000-000000000021', 'Sofia Patel', 'sofia@stateuniv.edu', 'athlete', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000002', true),
  ('00000000-0000-0000-0002-000000000022', '00000000-aaaa-0000-0000-000000000022', 'Maya Johnson', 'maya@stateuniv.edu', 'athlete', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000002', true),
  ('00000000-0000-0000-0002-000000000023', '00000000-aaaa-0000-0000-000000000023', 'Ava Kim', 'ava@stateuniv.edu', 'athlete', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000002', true);

-- ============================================
-- Invite Codes
-- ============================================
INSERT INTO invite_codes (organization_id, team_id, code, role, created_by) VALUES
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000001', 'BBALL1', 'athlete', '00000000-0000-0000-0002-000000000001'),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000002', 'SOCCER1', 'athlete', '00000000-0000-0000-0002-000000000001'),
  ('00000000-0000-0000-0000-000000000001', NULL, 'STAFF01', 'coach', '00000000-0000-0000-0002-000000000001'),
  ('00000000-0000-0000-0000-000000000001', NULL, 'SUPPORT1', 'support', '00000000-0000-0000-0002-000000000001');

-- ============================================
-- Sample Check-ins (past 4 weeks)
-- ============================================

-- Jordan Williams - Healthy athlete, green
INSERT INTO checkins (athlete_id, team_id, mood_score, stress_score, sleep_score, support_score, risk_level, wants_followup, completed_at) VALUES
  ('00000000-0000-0000-0002-000000000010', '00000000-0000-0000-0001-000000000001', 8, 3, 7, 8, 'green', false, NOW() - INTERVAL '21 days'),
  ('00000000-0000-0000-0002-000000000010', '00000000-0000-0000-0001-000000000001', 7, 4, 8, 9, 'green', false, NOW() - INTERVAL '14 days'),
  ('00000000-0000-0000-0002-000000000010', '00000000-0000-0000-0001-000000000001', 8, 3, 7, 8, 'green', false, NOW() - INTERVAL '7 days'),
  ('00000000-0000-0000-0002-000000000010', '00000000-0000-0000-0001-000000000001', 9, 2, 8, 9, 'green', false, NOW() - INTERVAL '1 day');

-- Marcus Davis - Declining, now yellow
INSERT INTO checkins (athlete_id, team_id, mood_score, stress_score, sleep_score, support_score, risk_level, wants_followup, completed_at) VALUES
  ('00000000-0000-0000-0002-000000000011', '00000000-0000-0000-0001-000000000001', 7, 4, 7, 7, 'green', false, NOW() - INTERVAL '21 days'),
  ('00000000-0000-0000-0002-000000000011', '00000000-0000-0000-0001-000000000001', 5, 6, 5, 6, 'green', false, NOW() - INTERVAL '14 days'),
  ('00000000-0000-0000-0002-000000000011', '00000000-0000-0000-0001-000000000001', 4, 7, 4, 5, 'green', false, NOW() - INTERVAL '7 days'),
  ('00000000-0000-0000-0002-000000000011', '00000000-0000-0000-0001-000000000001', 3, 8, 4, 4, 'yellow', false, NOW() - INTERVAL '1 day');

-- Tyler Brown - Struggling, red (wants followup)
INSERT INTO checkins (athlete_id, team_id, mood_score, stress_score, sleep_score, support_score, risk_level, wants_followup, completed_at) VALUES
  ('00000000-0000-0000-0002-000000000012', '00000000-0000-0000-0001-000000000001', 6, 5, 6, 7, 'green', false, NOW() - INTERVAL '21 days'),
  ('00000000-0000-0000-0002-000000000012', '00000000-0000-0000-0001-000000000001', 4, 7, 4, 5, 'green', false, NOW() - INTERVAL '14 days'),
  ('00000000-0000-0000-0002-000000000012', '00000000-0000-0000-0001-000000000001', 3, 8, 3, 3, 'red', false, NOW() - INTERVAL '7 days'),
  ('00000000-0000-0000-0002-000000000012', '00000000-0000-0000-0001-000000000001', 2, 9, 2, 3, 'red', true, NOW() - INTERVAL '1 day');

-- Chris Thompson - Hasn't checked in this week
INSERT INTO checkins (athlete_id, team_id, mood_score, stress_score, sleep_score, support_score, risk_level, wants_followup, completed_at) VALUES
  ('00000000-0000-0000-0002-000000000013', '00000000-0000-0000-0001-000000000001', 7, 4, 7, 8, 'green', false, NOW() - INTERVAL '14 days');

-- Emma Rodriguez - Consistently good
INSERT INTO checkins (athlete_id, team_id, mood_score, stress_score, sleep_score, support_score, risk_level, wants_followup, completed_at) VALUES
  ('00000000-0000-0000-0002-000000000020', '00000000-0000-0000-0001-000000000002', 8, 3, 8, 9, 'green', false, NOW() - INTERVAL '21 days'),
  ('00000000-0000-0000-0002-000000000020', '00000000-0000-0000-0001-000000000002', 9, 2, 9, 9, 'green', false, NOW() - INTERVAL '14 days'),
  ('00000000-0000-0000-0002-000000000020', '00000000-0000-0000-0001-000000000002', 8, 3, 8, 8, 'green', false, NOW() - INTERVAL '7 days'),
  ('00000000-0000-0000-0002-000000000020', '00000000-0000-0000-0001-000000000002', 8, 2, 9, 9, 'green', false, NOW() - INTERVAL '1 day');

-- Sofia Patel - Some stress, yellow
INSERT INTO checkins (athlete_id, team_id, mood_score, stress_score, sleep_score, support_score, risk_level, wants_followup, completed_at) VALUES
  ('00000000-0000-0000-0002-000000000021', '00000000-0000-0000-0001-000000000002', 6, 5, 6, 7, 'green', false, NOW() - INTERVAL '14 days'),
  ('00000000-0000-0000-0002-000000000021', '00000000-0000-0000-0001-000000000002', 4, 8, 5, 3, 'yellow', false, NOW() - INTERVAL '2 days');

-- Maya Johnson - Checked in recently
INSERT INTO checkins (athlete_id, team_id, mood_score, stress_score, sleep_score, support_score, risk_level, wants_followup, completed_at) VALUES
  ('00000000-0000-0000-0002-000000000022', '00000000-0000-0000-0001-000000000002', 7, 4, 7, 8, 'green', false, NOW() - INTERVAL '3 days');

-- ============================================
-- Alerts (from yellow/red check-ins)
-- ============================================
INSERT INTO alerts (id, athlete_id, checkin_id, severity, trigger_type, status, created_at) VALUES
  ('00000000-0000-0000-0003-000000000001',
   '00000000-0000-0000-0002-000000000011',
   (SELECT id FROM checkins WHERE athlete_id = '00000000-0000-0000-0002-000000000011' AND risk_level = 'yellow' ORDER BY completed_at DESC LIMIT 1),
   'yellow', 'risk_score', 'open', NOW() - INTERVAL '1 day'),
  ('00000000-0000-0000-0003-000000000002',
   '00000000-0000-0000-0002-000000000012',
   (SELECT id FROM checkins WHERE athlete_id = '00000000-0000-0000-0002-000000000012' AND wants_followup = true ORDER BY completed_at DESC LIMIT 1),
   'red', 'wants_followup', 'open', NOW() - INTERVAL '1 day'),
  ('00000000-0000-0000-0003-000000000003',
   '00000000-0000-0000-0002-000000000012',
   (SELECT id FROM checkins WHERE athlete_id = '00000000-0000-0000-0002-000000000012' AND risk_level = 'red' AND wants_followup = false ORDER BY completed_at DESC LIMIT 1),
   'red', 'risk_score', 'acknowledged', NOW() - INTERVAL '7 days'),
  ('00000000-0000-0000-0003-000000000004',
   '00000000-0000-0000-0002-000000000021',
   (SELECT id FROM checkins WHERE athlete_id = '00000000-0000-0000-0002-000000000021' AND risk_level = 'yellow' ORDER BY completed_at DESC LIMIT 1),
   'yellow', 'risk_score', 'open', NOW() - INTERVAL '2 days');

-- ============================================
-- Sample Follow-up
-- ============================================
INSERT INTO followups (athlete_id, alert_id, assigned_to_profile_id, assigned_by_profile_id, reason, status, due_date, created_at) VALUES
  ('00000000-0000-0000-0002-000000000012',
   '00000000-0000-0000-0003-000000000003',
   '00000000-0000-0000-0002-000000000003',
   '00000000-0000-0000-0002-000000000002',
   'Athlete has shown declining scores over 3 weeks. Please check in during practice.',
   'in_progress',
   (NOW() + INTERVAL '3 days')::date,
   NOW() - INTERVAL '5 days');

-- ============================================
-- Resources
-- ============================================
INSERT INTO resources (organization_id, title, description, category, url, created_by) VALUES
  ('00000000-0000-0000-0000-000000000001', '988 Suicide & Crisis Lifeline', 'Free, confidential support 24/7. Call or text 988.', 'crisis', 'https://988lifeline.org/', '00000000-0000-0000-0002-000000000001'),
  ('00000000-0000-0000-0000-000000000001', 'Crisis Text Line', 'Text HOME to 741741 to connect with a crisis counselor.', 'crisis', 'https://www.crisistextline.org/', '00000000-0000-0000-0002-000000000001'),
  ('00000000-0000-0000-0000-000000000001', 'University Counseling Center', 'Free confidential counseling for all students. Walk-ins welcome.', 'counseling', 'https://stateuniv.edu/counseling', '00000000-0000-0000-0002-000000000001'),
  ('00000000-0000-0000-0000-000000000001', 'Athlete Mental Health Guide', 'NCAA guide to mental health resources and best practices for student-athletes.', 'wellness', 'https://www.ncaa.org/sports/2022/3/10/mental-health-best-practices.aspx', '00000000-0000-0000-0002-000000000001'),
  ('00000000-0000-0000-0000-000000000001', 'Academic Advising Portal', 'Schedule appointments with your academic advisor.', 'academic', 'https://stateuniv.edu/advising', '00000000-0000-0000-0002-000000000001'),
  ('00000000-0000-0000-0000-000000000001', 'Headspace for Students', 'Free meditation and mindfulness app for university students.', 'wellness', 'https://www.headspace.com/studentplan', '00000000-0000-0000-0002-000000000001');

-- ============================================
-- Athlete Preferences (some athletes have set preferences)
-- ============================================
INSERT INTO athlete_preferences (athlete_id, wants_faith_support, wants_family_checkins, wants_peer_support, opt_out_reminders) VALUES
  ('00000000-0000-0000-0002-000000000010', false, true, false, false),
  ('00000000-0000-0000-0002-000000000012', true, true, true, false),
  ('00000000-0000-0000-0002-000000000020', false, false, true, false);
