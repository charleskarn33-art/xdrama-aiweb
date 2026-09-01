-- Asset storage bucket + RLS (architecture spec sections 57, 58).
--
-- Objects are stored as: <user_id>/<project_id>/<asset_type>/<filename>
-- so ownership can be checked purely from the path — no public files, no
-- direct storage URLs handed to the browser (the app always mints a
-- signed URL server-side).

insert into storage.buckets (id, name, public, file_size_limit)
values ('assets', 'assets', false, 524288000)
on conflict (id) do nothing;

create policy "assets_storage_owner_select" on storage.objects
  for select using (
    bucket_id = 'assets' and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "assets_storage_owner_insert" on storage.objects
  for insert with check (
    bucket_id = 'assets' and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "assets_storage_owner_update" on storage.objects
  for update using (
    bucket_id = 'assets' and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "assets_storage_owner_delete" on storage.objects
  for delete using (
    bucket_id = 'assets' and (storage.foldername(name))[1] = auth.uid()::text
  );
