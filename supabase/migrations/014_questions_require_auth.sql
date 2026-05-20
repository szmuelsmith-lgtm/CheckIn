-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 014 — Require authentication to read questions
--
-- Migration 011 §2 created "All authenticated read active questions" with:
--   USING (active = true)
-- This does NOT restrict to authenticated users — anon can read active
-- questions directly via REST since no auth.uid() check is present.
--
-- Questions are not FERPA-sensitive, but allowing unauthenticated reads
-- violates the principle of least privilege and leaks the assessment structure.
-- The /api/questions API route already enforces athlete-only access; this
-- closes the direct REST gap.
--
-- IDEMPOTENT — safe to run multiple times.
-- ─────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "All authenticated read active questions" ON questions;

CREATE POLICY "All authenticated read active questions"
  ON questions FOR SELECT
  USING (active = true AND auth.uid() IS NOT NULL);
