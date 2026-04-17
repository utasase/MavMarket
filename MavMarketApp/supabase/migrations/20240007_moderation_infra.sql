-- ============================================================
-- Migration 20240007: Moderation infrastructure
-- Adds is_admin to users, moderation_actions, audit_events,
-- and extends reports with workflow columns.
-- ============================================================

-- Admin flag on users
alter table public.users add column if not exists is_admin boolean default false;

-- Extend reports for workflow tracking
alter table public.reports add column updated_at   timestamptz default now();
alter table public.reports add column moderator_id uuid references public.users(id) on delete set null;

-- Moderation actions: one row per moderator decision on a report
create table public.moderation_actions (
  id           uuid primary key default gen_random_uuid(),
  report_id    uuid references public.reports(id) on delete cascade not null,
  moderator_id uuid references public.users(id) on delete set null,
  action       text not null check (action in ('escalate', 'resolve', 'dismiss', 'warn_user', 'remove_listing')),
  reason       text,
  created_at   timestamptz default now()
);
alter table public.moderation_actions enable row level security;

create policy "moderation_actions_admin_select" on public.moderation_actions
  for select to authenticated
  using (exists (select 1 from public.users where id = auth.uid() and is_admin = true));

create policy "moderation_actions_admin_insert" on public.moderation_actions
  for insert to authenticated
  with check (exists (select 1 from public.users where id = auth.uid() and is_admin = true));

-- Audit events: immutable append-only log
create table public.audit_events (
  id           uuid primary key default gen_random_uuid(),
  actor_id     uuid references public.users(id) on delete set null,
  action       text not null,
  target_table text,
  target_id    uuid,
  metadata     jsonb default '{}'::jsonb,
  created_at   timestamptz default now()
);
alter table public.audit_events enable row level security;

-- Anyone authenticated can insert their own audit events
create policy "audit_events_insert" on public.audit_events
  for insert to authenticated
  with check (actor_id = auth.uid());

-- Only admins can read audit events
create policy "audit_events_admin_select" on public.audit_events
  for select to authenticated
  using (exists (select 1 from public.users where id = auth.uid() and is_admin = true));

-- Admins can read all reports (additive — existing own-report policies remain)
create policy "reports_admin_select" on public.reports
  for select to authenticated
  using (
    reporter_id = auth.uid()
    or exists (select 1 from public.users where id = auth.uid() and is_admin = true)
  );

-- Admins can update report status/moderator_id
create policy "reports_admin_update" on public.reports
  for update to authenticated
  using (exists (select 1 from public.users where id = auth.uid() and is_admin = true));
