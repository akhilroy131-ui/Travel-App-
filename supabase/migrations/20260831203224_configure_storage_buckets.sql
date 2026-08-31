-- Storage configuration is separate from the relational schema because bucket rows
-- are platform configuration data. All buckets are public-read; writes stay owner/host scoped.

begin;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars', 'avatars', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('experience-photos', 'experience-photos', true, 10485760, array['image/jpeg', 'image/png', 'image/webp']),
  ('post-photos', 'post-photos', true, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy avatars_select_own on storage.objects
  for select to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy avatars_insert_own on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy avatars_update_own on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy avatars_delete_own on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy post_photos_select_own on storage.objects
  for select to authenticated
  using (bucket_id = 'post-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy post_photos_insert_own on storage.objects
  for insert to authenticated
  with check (bucket_id = 'post-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy post_photos_update_own on storage.objects
  for update to authenticated
  using (bucket_id = 'post-photos' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'post-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy post_photos_delete_own on storage.objects
  for delete to authenticated
  using (bucket_id = 'post-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy experience_photos_select_host on storage.objects
  for select to authenticated
  using (bucket_id = 'experience-photos' and exists (
    select 1 from public.experiences e
    where e.id::text = (storage.foldername(name))[1]
      and e.host_id = (select auth.uid())
  ));
create policy experience_photos_insert_host on storage.objects
  for insert to authenticated
  with check (bucket_id = 'experience-photos' and exists (
    select 1 from public.experiences e
    where e.id::text = (storage.foldername(name))[1]
      and e.host_id = (select auth.uid())
  ));
create policy experience_photos_update_host on storage.objects
  for update to authenticated
  using (bucket_id = 'experience-photos' and exists (
    select 1 from public.experiences e
    where e.id::text = (storage.foldername(name))[1]
      and e.host_id = (select auth.uid())
  ))
  with check (bucket_id = 'experience-photos' and exists (
    select 1 from public.experiences e
    where e.id::text = (storage.foldername(name))[1]
      and e.host_id = (select auth.uid())
  ));
create policy experience_photos_delete_host on storage.objects
  for delete to authenticated
  using (bucket_id = 'experience-photos' and exists (
    select 1 from public.experiences e
    where e.id::text = (storage.foldername(name))[1]
      and e.host_id = (select auth.uid())
  ));

commit;
