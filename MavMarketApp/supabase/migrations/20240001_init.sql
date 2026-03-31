-- ============================================================
-- Mav Market — Initial Schema
-- ============================================================

-- Users (extends auth.users)
create table public.users (
  id uuid references auth.users(id) on delete cascade primary key,
  name text not null,
  email text not null,
  avatar_url text,
  rating numeric(3,2) default 0,
  review_count int default 0,
  bio text,
  major text,
  year text,
  created_at timestamptz default now()
);

-- Listings
create table public.listings (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid references public.users(id) on delete cascade not null,
  title text not null,
  price numeric(10,2) not null,
  image_url text,
  category text not null,
  condition text not null check (condition in ('New', 'Like New', 'Good', 'Fair')),
  description text,
  pickup_location_name text,
  pickup_location_address text,
  is_on_campus boolean default true,
  is_sold boolean default false,
  created_at timestamptz default now()
);

-- Conversations (one per listing+buyer+seller combo)
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references public.listings(id) on delete set null,
  buyer_id uuid references public.users(id) on delete cascade not null,
  seller_id uuid references public.users(id) on delete cascade not null,
  last_message text,
  last_message_time timestamptz default now(),
  created_at timestamptz default now(),
  unique(listing_id, buyer_id, seller_id)
);

-- Messages
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.conversations(id) on delete cascade not null,
  sender_id uuid references public.users(id) on delete cascade not null,
  text text not null,
  created_at timestamptz default now()
);

-- Notifications
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  type text not null check (type in ('follower', 'review', 'item_alert', 'system')),
  title text not null,
  message text not null,
  read boolean default false,
  avatar_url text,
  item_image text,
  created_at timestamptz default now()
);

-- ============================================================
-- Indexes
-- ============================================================

create index on public.listings (seller_id);
create index on public.listings (category);
create index on public.listings (is_sold);
create index on public.conversations (buyer_id);
create index on public.conversations (seller_id);
create index on public.messages (conversation_id, created_at);
create index on public.notifications (user_id, read);

-- ============================================================
-- Enable Realtime on messages
-- ============================================================

alter publication supabase_realtime add table public.messages;

-- ============================================================
-- Row Level Security
-- ============================================================

alter table public.users enable row level security;
alter table public.listings enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.notifications enable row level security;

-- users: anyone authenticated can read; only own row can be updated
create policy "users_select" on public.users
  for select to authenticated using (true);

create policy "users_insert" on public.users
  for insert to authenticated with check (id = auth.uid());

create policy "users_update" on public.users
  for update to authenticated using (id = auth.uid());

-- listings: anyone authenticated can read; only seller can write
create policy "listings_select" on public.listings
  for select to authenticated using (true);

create policy "listings_insert" on public.listings
  for insert to authenticated with check (seller_id = auth.uid());

create policy "listings_update" on public.listings
  for update to authenticated using (seller_id = auth.uid());

create policy "listings_delete" on public.listings
  for delete to authenticated using (seller_id = auth.uid());

-- conversations: only participants can read/write
create policy "conversations_select" on public.conversations
  for select to authenticated
  using (buyer_id = auth.uid() or seller_id = auth.uid());

create policy "conversations_insert" on public.conversations
  for insert to authenticated
  with check (buyer_id = auth.uid());

create policy "conversations_update" on public.conversations
  for update to authenticated
  using (buyer_id = auth.uid() or seller_id = auth.uid());

-- messages: only conversation participants can read/write
create policy "messages_select" on public.messages
  for select to authenticated
  using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id
      and (c.buyer_id = auth.uid() or c.seller_id = auth.uid())
    )
  );

create policy "messages_insert" on public.messages
  for insert to authenticated
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.conversations c
      where c.id = conversation_id
      and (c.buyer_id = auth.uid() or c.seller_id = auth.uid())
    )
  );

-- notifications: only own
create policy "notifications_select" on public.notifications
  for select to authenticated using (user_id = auth.uid());

create policy "notifications_update" on public.notifications
  for update to authenticated using (user_id = auth.uid());

-- ============================================================
-- Trigger: auto-create public.users row on signup
-- ============================================================

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
