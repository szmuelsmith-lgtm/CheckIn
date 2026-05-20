-- Migration 020: Fix infinite RLS recursion on profiles
--
-- Root cause:
--   get_my_profile_id(), get_my_role(), get_my_org_id(), get_my_team_id() are
--   SECURITY DEFINER but were created without SET search_path = public.
--   Without that clause Postgres cannot guarantee the function resolves to the
--   function owner's search path, so it does NOT fully bypass RLS when those
--   functions query profiles from inside a profiles policy → infinite recursion.
--
-- Fixes:
--   1. Recreate all four helper functions with SET search_path = public so they
--      always run as the definer (postgres, superuser, BYPASSRLS) with no
--      policy re-evaluation.
--   2. Rewrite the profiles UPDATE policy to use auth_user_id = auth.uid()
--      directly — no function call needed, zero chance of recursion.

-- ── Helper functions ──────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.get_my_profile_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT id FROM profiles WHERE auth_user_id = auth.uid() LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS user_role
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role FROM profiles WHERE auth_user_id = auth.uid() LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.get_my_org_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT organization_id FROM profiles WHERE auth_user_id = auth.uid() LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.get_my_team_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT team_id FROM profiles WHERE auth_user_id = auth.uid() LIMIT 1
$$;

-- ── Profiles UPDATE policy ────────────────────────────────────────────────────
-- Old policy called get_my_profile_id() which queries profiles — unnecessary.
-- auth_user_id = auth.uid() is a direct comparison; no function, no recursion.

DROP POLICY IF EXISTS "Athletes update own profile" ON profiles;
DROP POLICY IF EXISTS "Users update own profile"    ON profiles;

CREATE POLICY "Users update own profile"
  ON profiles FOR UPDATE
  USING   (auth_user_id = auth.uid())
  WITH CHECK (auth_user_id = auth.uid());
