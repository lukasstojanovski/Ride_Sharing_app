-- Create profiles table (safe to run even if it already exists)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  first_name text,
  last_name text,
  email text,
  avatar_url text,
  phone text,
  phone_verified boolean not null default false,
  bio text,
  rating numeric default 5.0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Recreate policies safely
drop policy if exists "Public profiles are viewable by everyone" on public.profiles;
create policy "Public profiles are viewable by everyone"
on public.profiles for select
using (true);

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
on public.profiles for insert
with check (auth.uid() = id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
on public.profiles for update
using (auth.uid() = id);

-- Trigger function
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
    coalesce(new.raw_user_meta_data->>'phone', new.phone),
    false
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

-- Trigger (drop & recreate)
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();