-- ============================================================
-- Saved Items
-- ============================================================

create table public.saved_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  listing_id uuid references public.listings(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(user_id, listing_id)
);

create index on public.saved_items (user_id);

alter table public.saved_items enable row level security;

create policy "saved_items_select" on public.saved_items
  for select to authenticated using (user_id = auth.uid());

create policy "saved_items_insert" on public.saved_items
  for insert to authenticated with check (user_id = auth.uid());

create policy "saved_items_delete" on public.saved_items
  for delete to authenticated using (user_id = auth.uid());
