-- ── 018: Psychiatrists can read consented athlete profiles ────────────────────
-- The "Coaches read team profiles" policy (rls-policies.sql) covers
-- coach / support / admin but not psychiatrist.  Without this, the
-- psychiatrist dashboard join on consent_logs → profiles returns null
-- athlete_name for every patient, breaking the patient queue entirely.
--
-- Scope: psychiatrists may only read profiles of athletes who have an
-- active consent grant targeting them.  No blanket org-wide access.

DROP POLICY IF EXISTS "Psychiatrists read consented athlete profiles" ON profiles;

CREATE POLICY "Psychiatrists read consented athlete profiles"
  ON profiles FOR SELECT
  USING (
    get_my_role() = 'psychiatrist'
    AND id IN (
      SELECT athlete_id
      FROM   consent_logs
      WHERE  target_profile_id = get_my_profile_id()
        AND  is_active         = true
        AND  (expires_at IS NULL OR expires_at > now())
    )
  );
