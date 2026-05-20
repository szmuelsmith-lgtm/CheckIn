-- Migration 019: Users must be able to read their own profile row.
--
-- Root cause: the only SELECT policy on profiles was "Staff read org profiles",
-- which gates on organization_id = get_my_org_id().  For demo/beta accounts that
-- have no organization (org_id = NULL) this evaluates as NULL = NULL = false, so
-- the query returns zero rows.  Athletes had no matching policy at all.
--
-- This caused login to silently fail (profile lookup returns null → code falls
-- into the "brand-new user" branch → duplicate INSERT attempt → redirect to a
-- dashboard that also can't load the profile).

DROP POLICY IF EXISTS "Users read own profile" ON profiles;

CREATE POLICY "Users read own profile"
  ON profiles FOR SELECT
  USING (auth_user_id = auth.uid());

-- Also fix the login page "brand-new user" fallback path: if someone signs up
-- via OAuth or magic-link without going through the invite flow, the login page
-- tries a direct INSERT.  Give authenticated users INSERT on their own row.
DROP POLICY IF EXISTS "Users insert own profile" ON profiles;

CREATE POLICY "Users insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth_user_id = auth.uid());
