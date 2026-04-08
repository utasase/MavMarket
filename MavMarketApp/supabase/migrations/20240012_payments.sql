-- Migration: Payments infrastructure for Stripe integration
-- Adds payments table, payment status enum, and listing price constraint

-- 1. Payment status enum
create type payment_status as enum ('pending', 'completed', 'refunded', 'failed');

-- 2. Payments table
create table payments (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references listings(id),
  buyer_id uuid not null references users(id),
  seller_id uuid not null references users(id),
  amount numeric not null,          -- listing price in dollars
  service_fee numeric not null,     -- 5% platform fee
  total_charged numeric not null,   -- amount + service_fee (what buyer paid)
  stripe_checkout_session_id text unique,
  stripe_payment_intent_id text unique,
  status payment_status not null default 'pending',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3. Add stripe_customer_id to users (for returning Stripe customers)
alter table users add column if not exists stripe_customer_id text;

-- 4. Indexes for payment lookups
create index payments_buyer_id_idx on payments(buyer_id);
create index payments_seller_id_idx on payments(seller_id);
create index payments_listing_id_idx on payments(listing_id);
create index payments_stripe_session_idx on payments(stripe_checkout_session_id);
create index payments_status_idx on payments(status);

-- 5. Listing price constraint (prevent $0 or negative listings)
alter table listings add constraint listings_price_positive check (price > 0);

-- 6. RLS policies
alter table payments enable row level security;

-- Users can see payments they are part of (as buyer or seller)
create policy "payments_select_own"
  on payments for select to authenticated
  using (
    buyer_id = (select auth.uid())
    or seller_id = (select auth.uid())
  );

-- Only the system (via service role in edge functions) inserts payments
-- No direct insert policy for authenticated users — edge functions use service role
-- But we add a policy so the webhook edge function can work
create policy "payments_insert_service"
  on payments for insert to service_role
  with check (true);

-- Allow status updates from service role (for webhook/refunds)
create policy "payments_update_service"
  on payments for update to service_role
  using (true);

-- Admin can see all payments
create policy "payments_admin_select"
  on payments for select to authenticated
  using (
    exists (
      select 1 from users
      where users.id = (select auth.uid())
      and users.is_admin = true
    )
  );
