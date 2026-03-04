-- Phase 3: Trust & reliability
-- Run in Supabase Dashboard > SQL Editor after 003_phase2_rls.sql.
--
-- 12) Cancellations: RPCs for passenger cancel (restore seats) and creator cancel trip (notify passengers)
-- 13) Notifications: table + triggers for reservation/trip events (Expo push later)
-- 14) Basic safety: phone_verified ready (Twilio later), reports, user_blocks

-- ─── RPC: cancel_reservation (passenger cancels; restores seats if accepted) ─
create or replace function public.cancel_reservation(reservation_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  rec record;
begin
  select r.id, r.trip_id, r.passenger_id, r.seats_requested, r.status,
         t.creator_id, t.seats_available, t.status as trip_status,
         t.from_city, t.to_city,
         coalesce(passenger_prof.full_name, 'A passenger') as passenger_full_name
  into rec
  from public.reservations r
  join public.trips t on t.id = r.trip_id
  left join public.profiles passenger_prof on passenger_prof.id = r.passenger_id
  where r.id = reservation_id
  for update of r, t;

  if not found then
    return jsonb_build_object('ok', false, 'message', 'Reservation not found');
  end if;

  if rec.passenger_id is distinct from auth.uid() then
    return jsonb_build_object('ok', false, 'message', 'Only the passenger can cancel this reservation');
  end if;

  if rec.status not in ('pending', 'accepted') then
    return jsonb_build_object('ok', false, 'message', 'Reservation cannot be cancelled');
  end if;

  if rec.trip_status = 'cancelled' then
    return jsonb_build_object('ok', false, 'message', 'Trip is already cancelled');
  end if;

  -- Restore seats if reservation was accepted
  if rec.status = 'accepted' then
    update public.trips
    set
      seats_available = seats_available + rec.seats_requested,
      status = 'active',
      updated_at = now()
    where id = rec.trip_id;
  end if;

  -- Mark reservation as cancelled
  update public.reservations
  set status = 'cancelled', updated_at = now()
  where id = reservation_id;

  -- Notify trip creator that passenger cancelled
  insert into public.notifications (user_id, type, title, body, related_trip_id, related_reservation_id)
  values (
    rec.creator_id,
    'reservation_cancelled',
    'Reservation cancelled',
    rec.passenger_full_name || ' cancelled their reservation on ' || rec.from_city || ' → ' || rec.to_city,
    rec.trip_id,
    reservation_id
  );

  return jsonb_build_object('ok', true, 'message', 'Reservation cancelled');
end;
$$;

-- ─── RPC: cancel_trip (creator cancels; notifies all passengers, restores seats) ─
drop function if exists public.cancel_trip(uuid);
create or replace function public.cancel_trip(p_trip_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  t_rec record;
  r_rec record;
begin
  select id, creator_id, from_city, to_city, status, seats_available
  into t_rec
  from public.trips
  where id = p_trip_id
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'message', 'Trip not found');
  end if;

  if t_rec.creator_id is distinct from auth.uid() then
    return jsonb_build_object('ok', false, 'message', 'Only the trip creator can cancel this trip');
  end if;

  if t_rec.status = 'cancelled' then
    return jsonb_build_object('ok', false, 'message', 'Trip is already cancelled');
  end if;

  -- Cancel trip
  update public.trips
  set status = 'cancelled', updated_at = now()
  where id = p_trip_id;

  -- Cancel all reservations (seats are implicitly "restored" by cancelling - trip is gone)
  update public.reservations
  set status = 'cancelled', updated_at = now()
  where reservations.trip_id = p_trip_id and status in ('pending', 'accepted');

  -- Notify each passenger
  for r_rec in
    select r.passenger_id
    from public.reservations r
    where r.trip_id = p_trip_id
  loop
    insert into public.notifications (user_id, type, title, body, related_trip_id)
    values (
      r_rec.passenger_id,
      'trip_cancelled',
      'Trip cancelled',
      'The trip ' || t_rec.from_city || ' → ' || t_rec.to_city || ' has been cancelled by the driver.',
      p_trip_id
    );
  end loop;

  return jsonb_build_object('ok', true, 'message', 'Trip cancelled');
end;
$$;

-- ─── Notifications table ─────────────────────────────────────────────────────
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (type in (
    'reservation_requested',
    'reservation_accepted',
    'reservation_declined',
    'reservation_cancelled',
    'trip_cancelled'
  )),
  title text not null,
  body text,
  related_trip_id uuid references public.trips(id) on delete set null,
  related_reservation_id uuid references public.reservations(id) on delete set null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_user_id on public.notifications(user_id);
create index if not exists idx_notifications_created_at on public.notifications(created_at desc);

alter table public.notifications enable row level security;

drop policy if exists "Users can read own notifications" on public.notifications;
create policy "Users can read own notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

drop policy if exists "Users can update own notifications (mark read)" on public.notifications;
create policy "Users can update own notifications (mark read)"
  on public.notifications for update
  using (auth.uid() = user_id);

-- Service role / triggers insert; no insert policy for users (only RPCs and triggers insert)

-- ─── Trigger: notify creator when reservation requested ───────────────────────
create or replace function public.notify_reservation_requested()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  trip_rec record;
  passenger_name text;
begin
  if new.status != 'pending' then
    return new;
  end if;

  select t.creator_id, t.from_city, t.to_city
  into trip_rec
  from public.trips t
  where t.id = new.trip_id;

  select coalesce(full_name, 'Someone')
  into passenger_name
  from public.profiles
  where id = new.passenger_id;

  insert into public.notifications (user_id, type, title, body, related_trip_id, related_reservation_id)
  values (
    trip_rec.creator_id,
    'reservation_requested',
    'New seat request',
    passenger_name || ' requested ' || new.seats_requested || ' seat(s) on ' || trip_rec.from_city || ' → ' || trip_rec.to_city,
    new.trip_id,
    new.id
  );

  return new;
end;
$$;

drop trigger if exists on_reservation_requested on public.reservations;
create trigger on_reservation_requested
  after insert on public.reservations
  for each row when (new.status = 'pending')
  execute function public.notify_reservation_requested();

-- ─── Trigger: notify passenger when reservation accepted/declined ─────────────
create or replace function public.notify_reservation_status_changed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  trip_rec record;
begin
  if old.status = new.status then
    return new;
  end if;

  if new.status not in ('accepted', 'declined') then
    return new;
  end if;

  select t.from_city, t.to_city
  into trip_rec
  from public.trips t
  where t.id = new.trip_id;

  insert into public.notifications (user_id, type, title, body, related_trip_id, related_reservation_id)
  values (
    new.passenger_id,
    case when new.status = 'accepted' then 'reservation_accepted' else 'reservation_declined' end,
    case when new.status = 'accepted' then 'Request accepted' else 'Request declined' end,
    case when new.status = 'accepted'
      then 'Your request for ' || trip_rec.from_city || ' → ' || trip_rec.to_city || ' was accepted.'
      else 'Your request for ' || trip_rec.from_city || ' → ' || trip_rec.to_city || ' was declined.'
    end,
    new.trip_id,
    new.id
  );

  return new;
end;
$$;

drop trigger if exists on_reservation_status_changed on public.reservations;
create trigger on_reservation_status_changed
  after update of status on public.reservations
  for each row
  execute function public.notify_reservation_status_changed();

-- Ensure accept_reservation also triggers the status change notification (it does an UPDATE)
-- The trigger above will fire when accept_reservation updates status to 'accepted'.

-- ─── Reports table ───────────────────────────────────────────────────────────
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  reported_user_id uuid not null references public.profiles(id) on delete cascade,
  reason text,
  context_trip_id uuid references public.trips(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint reports_not_self check (reporter_id != reported_user_id)
);

create index if not exists idx_reports_reported_user on public.reports(reported_user_id);

alter table public.reports enable row level security;

drop policy if exists "Users can insert own reports" on public.reports;
create policy "Users can insert own reports"
  on public.reports for insert
  with check (auth.uid() = reporter_id);

-- No select/update/delete for users (admin review only via service role)

-- ─── User blocks table ───────────────────────────────────────────────────────
create table if not exists public.user_blocks (
  id uuid primary key default gen_random_uuid(),
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(blocker_id, blocked_user_id),
  constraint blocks_not_self check (blocker_id != blocked_user_id)
);

create index if not exists idx_user_blocks_blocker on public.user_blocks(blocker_id);
create index if not exists idx_user_blocks_blocked on public.user_blocks(blocked_user_id);

alter table public.user_blocks enable row level security;

drop policy if exists "Users can manage own blocks" on public.user_blocks;
create policy "Users can manage own blocks"
  on public.user_blocks for all
  using (auth.uid() = blocker_id)
  with check (auth.uid() = blocker_id);

-- ─── phone_verified: already in profiles (001_profiles.sql). When Twilio is added:
--     update profiles set phone_verified = true where id = :user_id after successful OTP verify.
