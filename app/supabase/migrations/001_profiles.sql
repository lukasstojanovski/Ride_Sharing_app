-- Profiles table linked to auth.users for ride-sharing app.
-- Run this in Supabase Dashboard > SQL Editor.
-- If you already ran an older version, run the whole file again (idempotent) or at least the handle_new_user function and trigger so the trigger creates the profile and the app never inserts (avoids RLS "new row violates row-level security").

-- Create profiles table (id = auth.users.id)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  first_name text,
  last_name text,
  email text,
  phone text,
  phone_verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RLS: users can read/update their own profile
alter table public.profiles enable row level security;

create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Trigger: create profile on signup (runs with definer rights, so not blocked by RLS)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, first_name, last_name, email, phone, phone_verified)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      trim(coalesce(new.raw_user_meta_data->>'first_name', '') || ' ' || coalesce(new.raw_user_meta_data->>'last_name', ''))
    ),
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name',
    new.email,
    new.raw_user_meta_data->>'phone',
    false
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();