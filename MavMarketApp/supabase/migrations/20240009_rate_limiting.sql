-- ============================================================
-- Migration 20240009: Rate limiting
-- Tracks actions per user and provides is_rate_limited() check
-- ============================================================

create table public.rate_limit_log (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references public.users(id) on delete cascade not null,
  action       text not null,
  created_at   timestamptz default now() not null
);

create index rate_limit_log_user_action_idx on public.rate_limit_log (user_id, action, created_at);

alter table public.rate_limit_log enable row level security;

create policy "rate_limit_log_insert" on public.rate_limit_log
  for insert to authenticated
  with check (user_id = auth.uid());

create policy "rate_limit_log_select" on public.rate_limit_log
  for select to authenticated
  using (user_id = auth.uid());

-- Returns true if the user has exceeded max_count actions within the last window_seconds
create or replace function public.is_rate_limited(
  p_user_id      uuid,
  p_action       text,
  p_max_count    int,
  p_window_secs  int
)
returns boolean
language plpgsql security definer as $$
declare
  v_count int;
begin
  select count(*) into v_count
  from public.rate_limit_log
  where user_id = p_user_id
    and action = p_action
    and created_at > now() - (p_window_secs || ' seconds')::interval;

  return v_count >= p_max_count;
end;
$$;

-- Clean up old log entries (older than 24h) to keep the table small
create or replace function public.purge_rate_limit_log()
returns void language plpgsql security definer as $$
begin
  delete from public.rate_limit_log where created_at < now() - interval '24 hours';
end;
$$;
