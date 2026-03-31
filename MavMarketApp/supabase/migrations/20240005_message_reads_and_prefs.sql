-- Message read tracking: persisted unread counts per user per conversation
create table public.message_reads (
  user_id uuid references public.users(id) on delete cascade not null,
  conversation_id uuid references public.conversations(id) on delete cascade not null,
  last_read_at timestamptz default now() not null,
  primary key (user_id, conversation_id)
);

alter table public.message_reads enable row level security;

create policy "message_reads_all" on public.message_reads
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Notification preferences stored as JSONB on the user profile
alter table public.users
  add column if not exists notification_preferences jsonb default '{}'::jsonb;
