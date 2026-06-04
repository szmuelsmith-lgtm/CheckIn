-- Messages table for secure in-app counselor ↔ athlete messaging
create table if not exists messages (
  id               uuid primary key default gen_random_uuid(),
  thread_id        text not null,           -- counselor_profile_id_athlete_profile_id sorted (deterministic)
  sender_id        uuid not null references profiles(id) on delete cascade,
  recipient_id     uuid not null references profiles(id) on delete cascade,
  body             text not null check (char_length(body) <= 2000),
  sent_at          timestamptz not null default now(),
  read_at          timestamptz,
  deleted_by_sender boolean not null default false
);

create index if not exists messages_thread_sent on messages(thread_id, sent_at desc);
create index if not exists messages_recipient_unread on messages(recipient_id, read_at) where read_at is null;

alter table messages enable row level security;

-- Drop-then-create so this migration is safe to re-run (CREATE POLICY has no IF NOT EXISTS)
drop policy if exists "messages_insert_own"         on messages;
drop policy if exists "messages_select_participant" on messages;
drop policy if exists "messages_update_read"        on messages;

-- Sender can insert their own messages
create policy "messages_insert_own"
  on messages for insert
  with check (sender_id = (select id from profiles where auth_user_id = auth.uid() limit 1));

-- Participants can read messages in their threads
create policy "messages_select_participant"
  on messages for select
  using (
    sender_id    = (select id from profiles where auth_user_id = auth.uid() limit 1)
    or
    recipient_id = (select id from profiles where auth_user_id = auth.uid() limit 1)
  );

-- Recipient can mark read
create policy "messages_update_read"
  on messages for update
  using (recipient_id = (select id from profiles where auth_user_id = auth.uid() limit 1))
  with check (recipient_id = (select id from profiles where auth_user_id = auth.uid() limit 1));
