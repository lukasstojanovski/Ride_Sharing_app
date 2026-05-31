-- Dropoff location columns for map-based destination pinpointing.

alter table public.trips
  add column if not exists dropoff_address text,
  add column if not exists dropoff_lat double precision,
  add column if not exists dropoff_lng double precision;

comment on column public.trips.dropoff_address is 'Driver-selected dropoff address from map';
comment on column public.trips.dropoff_lat is 'Driver-selected dropoff latitude from map';
comment on column public.trips.dropoff_lng is 'Driver-selected dropoff longitude from map';
