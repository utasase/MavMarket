-- ============================================================
-- Migration 20240008: UTA email enforcement at DB level
-- Only @mavs.uta.edu and @uta.edu emails are allowed
-- ============================================================

alter table public.users
  add constraint users_uta_email_only
  check (
    email like '%@mavs.uta.edu'
    or email like '%@uta.edu'
  );
