-- Reports: users can flag listings or other users for moderation review
create type public.report_target_type as enum ('listing', 'user');
create type public.report_status as enum ('open', 'under_review', 'resolved', 'dismissed');

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references public.users(id) on delete set null,
  target_type public.report_target_type not null,
  target_id uuid not null,
  reason text not null,
  note text,
  status public.report_status default 'open' not null,
  created_at timestamptz default now()
);

alter table public.reports enable row level security;

-- Reporters can insert their own reports
create policy "reports_insert" on public.reports
  for insert to authenticated
  with check (reporter_id = auth.uid());

-- Reporters can view their own submitted reports
create policy "reports_select_own" on public.reports
  for select to authenticated
  using (reporter_id = auth.uid());

create index reports_reporter_id_idx on public.reports(reporter_id);
create index reports_target_id_idx on public.reports(target_id);
create index reports_status_idx on public.reports(status);
