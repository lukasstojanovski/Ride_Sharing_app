-- Phase 2: RLS so app can show driver names and let creators decline reservations.
-- Run in Supabase Dashboard > SQL Editor after 002_trips_and_reservations.sql.

-- Anyone can read a profile if that profile is the creator of at least one trip (for listing driver names)
create policy "Anyone can select trip creator profiles"
  on public.profiles for select
  using (
    exists (select 1 from public.trips where trips.creator_id = profiles.id)
  );

-- Trip creator can update reservations for their trips (e.g. set status to declined)
create policy "Creator can update reservations for their trips"
  on public.reservations for update
  using (
    exists (
      select 1 from public.trips t
      where t.id = trip_id and t.creator_id = auth.uid()
    )
  );

-- Trip creator can read passenger profiles for reservations on their trips (to show passenger name in My Trips)
create policy "Creator can select passenger profiles for their trip reservations"
  on public.profiles for select
  using (
    exists (
      select 1 from public.reservations r
      join public.trips t on t.id = r.trip_id
      where r.passenger_id = profiles.id and t.creator_id = auth.uid()
    )
  );
