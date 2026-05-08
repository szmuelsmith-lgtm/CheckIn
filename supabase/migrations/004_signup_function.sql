-- Migration 004: SECURITY DEFINER function for profile creation during signup
-- This is needed because when Supabase email confirmation is enabled,
-- there is no active session after signUp(), so auth.uid() = NULL and
-- the normal RLS INSERT policy ("auth_user_id = auth.uid()") blocks the insert.
-- This function runs with elevated privileges and validates the caller by
-- cross-checking auth_user_id + email against auth.users before inserting.

CREATE OR REPLACE FUNCTION public.create_signup_profile(
  p_auth_user_id  UUID,
  p_full_name     TEXT,
  p_email         TEXT,
  p_role          TEXT    DEFAULT 'athlete',
  p_organization_id UUID  DEFAULT NULL,
  p_team_id         UUID  DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate that the supplied (id, email) pair actually exists in auth.users.
  -- This prevents a malicious anon caller from spoofing another user's profile.
  IF NOT EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = p_auth_user_id
      AND email = lower(trim(p_email))
  ) THEN
    RAISE EXCEPTION 'Signup validation failed: user not found.';
  END IF;

  INSERT INTO public.profiles (
    auth_user_id,
    full_name,
    email,
    role,
    organization_id,
    team_id
  ) VALUES (
    p_auth_user_id,
    p_full_name,
    p_email,
    p_role::user_role,
    p_organization_id,
    p_team_id
  )
  ON CONFLICT (auth_user_id) DO NOTHING;
END;
$$;

-- Grant anon (unauthenticated) callers execute access.
-- The SECURITY DEFINER body still enforces its own validation above.
GRANT EXECUTE ON FUNCTION public.create_signup_profile TO anon;
GRANT EXECUTE ON FUNCTION public.create_signup_profile TO authenticated;
