-- Optional profile columns (idempotent: safe if 20260222233456_create_profiles already applied)
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists bio text;
alter table public.profiles add column if not exists car_info text;

-- Avatars bucket (public so avatar_url can be used in app/chat without signed URLs)
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = true;

-- RLS: authenticated users can upload/update/delete their own avatar (path: {user_id}/avatar)
create policy "Users can upload own avatar"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid()::text)
);

create policy "Users can update own avatar"
on storage.objects for update to authenticated
using (
  bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid()::text)
);

create policy "Users can delete own avatar"
on storage.objects for delete to authenticated
using (
  bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid()::text)
);

-- Public read for avatars (bucket is public; explicit policy for SELECT)
create policy "Avatar images are publicly readable"
on storage.objects for select to public
using (bucket_id = 'avatars');
