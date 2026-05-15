-- ============================================================
-- DIAGNOSTIC: Run this in the Supabase SQL editor (as postgres/service role)
-- Share the full output so we can see exactly what's broken.
-- ============================================================

-- 1. What helper functions exist?
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'get_my_role','get_my_org_id','get_my_profile_id',
    'get_my_team_id','has_consent','auto_set_audit_org'
  )
ORDER BY routine_name;

-- 2. What RLS policies actually exist right now?
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE tablename IN (
  'resources','teams','followups','organizations',
  'profiles','audit_logs','alerts','invite_codes'
)
ORDER BY tablename, policyname;

-- 3. Do the key tables exist?
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'organizations','teams','profiles','checkins','alerts',
    'followups','resources','audit_logs','invite_codes','consent_logs'
  )
ORDER BY table_name;

-- 4. How many profiles exist, and which ones have organization_id set?
SELECT role, COUNT(*) AS total,
  COUNT(organization_id) AS has_org_id,
  COUNT(*) - COUNT(organization_id) AS missing_org_id
FROM profiles
GROUP BY role
ORDER BY role;

-- 5. How many organizations exist?
SELECT id, name, screening_active FROM organizations;

-- 6. Does the resources table have any rows?
SELECT COUNT(*) AS resource_count FROM resources;

-- 7. What columns does the followups table have?
SELECT column_name, is_nullable, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'followups'
ORDER BY ordinal_position;

-- 8. What columns does the alerts table have?
SELECT column_name, is_nullable, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'alerts'
ORDER BY ordinal_position;
