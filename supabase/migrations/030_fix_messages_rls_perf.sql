-- ============================================================
-- MIGRATION 030: Fix messages RLS performance (statement timeout)
-- ============================================================
-- Migration 026's messages policies resolved the caller's profile with a
-- raw inline subquery:  (select id from profiles where auth_user_id = auth.uid())
-- Against a large profiles table that seq-scans on every message insert/select/
-- update and times out (error 57014). Every OTHER table's RLS uses the cached,
-- STABLE helper get_my_profile_id() and performs fine — messages just diverged.
--
-- Fix: rewrite the three messages policies to use get_my_profile_id(), and add
-- an index on profiles.auth_user_id as insurance for the helper's own lookup.
-- Behavior is identical; only the plan changes. Idempotent (drop-then-create).
-- ============================================================

-- Insurance: index the column the auth helper resolves on.
create index if not exists idx_profiles_auth_user_id on profiles(auth_user_id);

-- Rewrite messages policies to use the cached helper (matches all other tables).
drop policy if exists "messages_insert_own"         on messages;
drop policy if exists "messages_select_participant" on messages;
drop policy if exists "messages_update_read"        on messages;

create policy "messages_insert_own"
  on messages for insert
  with check (sender_id = get_my_profile_id());

create policy "messages_select_participant"
  on messages for select
  using (
    sender_id    = get_my_profile_id()
    or
    recipient_id = get_my_profile_id()
  );

create policy "messages_update_read"
  on messages for update
  using (recipient_id = get_my_profile_id())
  with check (recipient_id = get_my_profile_id());
