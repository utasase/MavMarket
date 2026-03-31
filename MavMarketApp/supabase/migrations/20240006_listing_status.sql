-- ============================================================
-- Migration 20240006: Listing status enum
-- Replaces is_sold boolean with a full status enum per contracts.md
-- ============================================================

create type public.listing_status as enum ('draft', 'active', 'reserved', 'sold', 'removed');

alter table public.listings
  add column status public.listing_status default 'active';

-- Backfill from is_sold
update public.listings set status = 'sold'   where is_sold = true;
update public.listings set status = 'active' where is_sold = false or is_sold is null;

alter table public.listings drop column is_sold;
