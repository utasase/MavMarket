-- ============================================================
-- Migration 20240015: Atomic report creation RPC
-- Wraps rate limiting, report insert, and rate-limit logging
-- in one transactional boundary.
-- ============================================================

create or replace function public.create_report(
  p_target_type public.report_target_type,
  p_target_id uuid,
  p_reason text,
  p_note text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller_id uuid;
  v_now timestamptz := now();
begin
  v_caller_id := auth.uid();

  if v_caller_id is null then
    raise exception 'Not authenticated';
  end if;

  -- Serialize report creation per user so the rate-limit check and
  -- audit insert remain coherent under concurrent requests.
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtext(v_caller_id::text),
    pg_catalog.hashtext('create_report')
  );

  if public.is_rate_limited(v_caller_id, 'create_report', 5, 600) then
    raise exception 'You''ve submitted too many reports recently. Please wait and try again.';
  end if;

  insert into public.reports (
    reporter_id,
    target_type,
    target_id,
    reason,
    note,
    created_at,
    updated_at
  )
  values (
    v_caller_id,
    p_target_type,
    p_target_id,
    p_reason,
    p_note,
    v_now,
    v_now
  );

  insert into public.rate_limit_log (user_id, action, created_at)
  values (v_caller_id, 'create_report', v_now);
end;
$$;

revoke all on function public.create_report(public.report_target_type, uuid, text, text) from public;
grant execute on function public.create_report(public.report_target_type, uuid, text, text) to authenticated;
