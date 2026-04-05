-- ============================================================
-- Migration 20240011: Follows / social graph
-- ============================================================

create table public.follows (
  follower_id  uuid references public.users(id) on delete cascade not null,
  following_id uuid references public.users(id) on delete cascade not null,
  created_at   timestamptz default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);

create index follows_follower_idx  on public.follows (follower_id);
create index follows_following_idx on public.follows (following_id);

alter table public.follows enable row level security;

create policy "follows_select" on public.follows
  for select to authenticated using (true);

create policy "follows_insert" on public.follows
  for insert to authenticated
  with check (follower_id = auth.uid());

create policy "follows_delete" on public.follows
  for delete to authenticated
  using (follower_id = auth.uid());
