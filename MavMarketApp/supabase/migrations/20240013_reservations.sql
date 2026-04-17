-- Migration: 15-Minute Cart Reservations
-- Adds concurrency locking to prevent double-purchasing items

alter table public.listings 
add column if not exists locked_by uuid references public.users(id),
add column if not exists locked_at timestamptz;

-- Function to atomically reserve a listing
create or replace function public.reserve_listing(p_listing_id uuid)
returns boolean
language plpgsql
security definer -- Needs to be able to run with elevated privileges to ensure atomic check
as $$
declare
  v_locked_by uuid;
  v_locked_at timestamptz;
  v_status public.listing_status;
  v_caller_id uuid;
begin
  v_caller_id := auth.uid();
  if v_caller_id is null then
    return false;
  end if;

  -- Select current state with FOR UPDATE to lock the row during the check
  select locked_by, locked_at, status
  into v_locked_by, v_locked_at, v_status
  from public.listings
  where id = p_listing_id
  for update;

  -- If it's sold, cannot be reserved
  if v_status = 'sold' then
    return false;
  end if;

  -- If it's already locked by someone else and the lock hasn't expired
  if v_locked_by is not null and v_locked_by != v_caller_id and v_locked_at > now() - interval '15 minutes' then
    return false;
  end if;

  -- Otherwise, we can lock it (or renew our own lock)
  update public.listings
  set locked_by = v_caller_id,
      locked_at = now()
  where id = p_listing_id;

  return true;
end;
$$;

-- Function to atomically release a listing
create or replace function public.release_listing(p_listing_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  -- Only release if the lock hasn't resulted in a sale yet
  update public.listings
  set locked_by = null,
      locked_at = null
  where id = p_listing_id
  and status != 'sold';
end;
$$;
