-- ============================================================
-- Migration 20240019: Reservation functions use listing status
-- Aligns reservation helpers with the listing_status enum that
-- replaced the legacy is_sold boolean in 20240006.
-- ============================================================

create or replace function public.reserve_listing(p_listing_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
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

  select locked_by, locked_at, status
  into v_locked_by, v_locked_at, v_status
  from public.listings
  where id = p_listing_id
  for update;

  if not found then
    return false;
  end if;

  -- Only active listings can enter checkout reservation.
  if v_status <> 'active' then
    return false;
  end if;

  if v_locked_by is not null
     and v_locked_by <> v_caller_id
     and v_locked_at is not null
     and v_locked_at > now() - interval '15 minutes' then
    return false;
  end if;

  update public.listings
  set locked_by = v_caller_id,
      locked_at = now()
  where id = p_listing_id;

  return true;
end;
$$;

create or replace function public.release_listing(p_listing_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.listings
  set locked_by = null,
      locked_at = null
  where id = p_listing_id
    and status <> 'sold';
end;
$$;
