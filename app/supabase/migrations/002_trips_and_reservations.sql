-- Phase 1: Trips and reservations for ride-sharing.
-- Run in Supabase Dashboard > SQL Editor after 001_profiles.sql.

-- ─── Trips table ───────────────────────────────────────────────────────────
create table if not exists public.trips (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.profiles (id) on delete cascade,
  from_city text not null,
  to_city text not null,
  departure_time timestamptz not null,
  seats_total int not null check (seats_total > 0),
  seats_available int not null check (seats_available >= 0 and seats_available <= seats_total),
  price numeric not null check (price >= 0),
  status text not null default 'active' check (status in ('active', 'full', 'cancelled')),
  pickup_note text,
  dropoff_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_trips_status_departure
  on public.trips (status, departure_time);

alter table public.trips enable row level security;

create policy "Anyone can select active trips"
  on public.trips for select
  using (status = 'active');

create policy "Creator can select own trips"
  on public.trips for select
  using (auth.uid() = creator_id);

create policy "Creator can insert own trips"
  on public.trips for insert
  with check (auth.uid() = creator_id);

create policy "Creator can update own trips"
  on public.trips for update
  using (auth.uid() = creator_id);

create policy "Creator can delete own trips"
  on public.trips for delete
  using (auth.uid() = creator_id);

-- ─── Reservations table ─────────────────────────────────────────────────────
create table if not exists public.reservations (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  passenger_id uuid not null references public.profiles (id) on delete cascade,
  seats_requested int not null check (seats_requested > 0),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_reservations_trip_id on public.reservations (trip_id);
create index if not exists idx_reservations_passenger_id on public.reservations (passenger_id);

alter table public.reservations enable row level security;

create policy "Passenger can insert own reservation"
  on public.reservations for insert
  with check (auth.uid() = passenger_id);

create policy "Passenger can select own reservations"
  on public.reservations for select
  using (auth.uid() = passenger_id);

create policy "Creator can select reservations for their trips"
  on public.reservations for select
  using (
    exists (
      select 1 from public.trips t
      where t.id = trip_id and t.creator_id = auth.uid()
    )
  );

-- No direct update/delete from client for reservations; accept/decline via RPC.

-- ─── RPC: accept_reservation (seat locking in one transaction) ───────────────
create or replace function public.accept_reservation(reservation_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  rec record;
  trip_rec record;
  new_available int;
begin
  -- Lock reservation and trip in one go (trip via join)
  select r.id, r.trip_id, r.passenger_id, r.seats_requested, r.status,
         t.creator_id, t.seats_available, t.status as trip_status
  into rec
  from public.reservations r
  join public.trips t on t.id = r.trip_id
  where r.id = reservation_id
  for update of r, t;

  if not found then
    return jsonb_build_object('ok', false, 'message', 'Reservation not found');
  end if;

  if rec.creator_id is distinct from auth.uid() then
    return jsonb_build_object('ok', false, 'message', 'Only the trip creator can accept reservations');
  end if;

  if rec.status != 'pending' then
    return jsonb_build_object('ok', false, 'message', 'Reservation is not pending');
  end if;

  if rec.trip_status != 'active' then
    return jsonb_build_object('ok', false, 'message', 'Trip is not active');
  end if;

  if rec.seats_available < rec.seats_requested then
    return jsonb_build_object('ok', false, 'message', 'Not enough seats available');
  end if;

  new_available := rec.seats_available - rec.seats_requested;

  update public.trips
  set
    seats_available = new_available,
    status = case when new_available = 0 then 'full' else status end,
    updated_at = now()
  where id = rec.trip_id;

  update public.reservations
  set status = 'accepted', updated_at = now()
  where id = reservation_id;

  return jsonb_build_object('ok', true, 'message', 'Reservation accepted');
end;
$$;
