-- Cities table: allow public read (for from/to city picker)
-- Run in Supabase Dashboard > SQL Editor.
-- Assumes public.cities exists with columns: id, city, lat, lng, country, etc.

alter table public.cities enable row level security;

drop policy if exists "Anyone can read cities" on public.cities;
create policy "Anyone can read cities"
  on public.cities for select
  using (true);
