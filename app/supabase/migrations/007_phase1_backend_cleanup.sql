-- Phase 1 Backend Cleanup: constraints, indexes, create_reservation, decline_reservation
-- Run in Supabase Dashboard > SQL Editor after 006_phase4_inbox.sql.

-- ─── Trips: from_city <> to_city ─────────────────────────────────────────────
alter table public.trips add constraint trips_from_to_different check (from_city <> to_city);

-- ─── Trips: indexes ──────────────────────────────────────────────────────────
create index if not exists idx_trips_route_departure
  on public.trips (from_city, to_city, departure_time);

create index if not exists idx_trips_creator_id
  on public.trips (creator_id);

-- ─── Reservations: unique one active per trip+passenger ───────────────────────
create unique index if not exists idx_reservations_one_active_per_trip_passenger
  on public.reservations (trip_id, passenger_id)
  where status in ('pending', 'accepted');

-- ─── RPC: create_reservation ─────────────────────────────────────────────────
create or replace function public.create_reservation(p_trip_id uuid, p_seats_requested int)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  t_rec record;
  user_id uuid := auth.uid();
begin
  if user_id is null then
    return jsonb_build_object('ok', false, 'message', 'You must be logged in');
  end if;

  if p_seats_requested is null or p_seats_requested < 1 then
    return jsonb_build_object('ok', false, 'message', 'Seats requested must be at least 1');
  end if;

  select id, creator_id, status, seats_available
  into t_rec
  from public.trips
  where id = p_trip_id
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'message', 'Trip not found');
  end if;

  if t_rec.creator_id = user_id then
    return jsonb_build_object('ok', false, 'message', 'You cannot book your own trip');
  end if;

  if t_rec.status != 'active' then
    return jsonb_build_object('ok', false, 'message', 'Trip is not available for booking');
  end if;

  if t_rec.seats_available < p_seats_requested then
    return jsonb_build_object('ok', false, 'message', 'Not enough seats available');
  end if;

  if exists (
    select 1 from public.reservations
    where trip_id = p_trip_id and passenger_id = user_id
      and status in ('pending', 'accepted')
  ) then
    return jsonb_build_object('ok', false, 'message', 'You already have a reservation on this trip');
  end if;

  insert into public.reservations (trip_id, passenger_id, seats_requested, status)
  values (p_trip_id, user_id, p_seats_requested, 'pending');

  return jsonb_build_object('ok', true, 'message', 'Reservation created');
end;
$$;

-- ─── RPC: decline_reservation ────────────────────────────────────────────────
create or replace function public.decline_reservation(p_reservation_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  rec record;
begin
  select r.id, r.trip_id, r.passenger_id, r.status,
         t.creator_id
  into rec
  from public.reservations r
  join public.trips t on t.id = r.trip_id
  where r.id = p_reservation_id
  for update of r;

  if not found then
    return jsonb_build_object('ok', false, 'message', 'Reservation not found');
  end if;

  if rec.creator_id is distinct from auth.uid() then
    return jsonb_build_object('ok', false, 'message', 'Only the trip creator can decline reservations');
  end if;

  if rec.status != 'pending' then
    return jsonb_build_object('ok', false, 'message', 'Reservation is not pending');
  end if;

  update public.reservations
  set status = 'declined', updated_at = now()
  where id = p_reservation_id;

  return jsonb_build_object('ok', true, 'message', 'Reservation declined');
end;
$$;
