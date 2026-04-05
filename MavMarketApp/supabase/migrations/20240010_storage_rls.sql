-- ============================================================
-- Migration 20240010: Storage bucket RLS for listings bucket
-- Run this in the Supabase SQL editor after creating the
-- "listings" bucket in the Storage dashboard.
-- ============================================================

-- Allow any authenticated user to read public listing images
insert into storage.buckets (id, name, public)
values ('listings', 'listings', true)
on conflict (id) do update set public = true;

-- Drop existing permissive policies if any
drop policy if exists "listings_storage_select" on storage.objects;
drop policy if exists "listings_storage_insert" on storage.objects;
drop policy if exists "listings_storage_update" on storage.objects;
drop policy if exists "listings_storage_delete" on storage.objects;

-- Anyone can read (bucket is public, but explicit policy for clarity)
create policy "listings_storage_select"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'listings');

-- Authenticated users can upload to their own folder (user_id/filename)
create policy "listings_storage_insert"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'listings'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can only update their own files
create policy "listings_storage_update"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'listings'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can only delete their own files
create policy "listings_storage_delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'listings'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
