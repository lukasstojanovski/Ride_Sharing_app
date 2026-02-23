-- Create trips table
create table public.trips (
  id uuid primary key default gen_random_uuid(),

  driver_id uuid not null
    references public.profiles(id)
    on delete cascade,

  from_city text not null,
  to_city text not null,

  departure_time timestamptz not null,

  seats_total integer not null check (seats_total > 0),
  seats_available integer not null check (seats_available >= 0),

  price numeric not null check (price >= 0),

  notes text,

  status text not null default 'active'
    check (status in ('active', 'full', 'cancelled')),

  created_at timestamptz not null default now()
);

-- Indexes for performance
create index trips_driver_id_idx on public.trips(driver_id);
create index trips_departure_time_idx on public.trips(departure_time);
create index trips_route_idx on public.trips(from_city, to_city);

-- Enable Row Level Security
alter table public.trips enable row level security;

-- Anyone can view trips
create policy "Trips are viewable by everyone"
on public.trips
for select
using (true);

-- Drivers can insert their own trips
create policy "Drivers can insert their own trips"
on public.trips
for insert
with check (auth.uid() = driver_id);

-- Drivers can update their own trips
create policy "Drivers can update their own trips"
on public.trips
for update
using (auth.uid() = driver_id);

-- Drivers can delete their own trips
create policy "Drivers can delete their own trips"
on public.trips
for delete
using (auth.uid() = driver_id);