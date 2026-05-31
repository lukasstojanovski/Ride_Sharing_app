-- Pickup location columns for map-based selection in offer flow.

alter table public.trips
  add column if not exists pickup_address text,
  add column if not exists pickup_lat double precision,
  add column if not exists pickup_lng double precision;

comment on column public.trips.pickup_address is 'Driver-selected pickup address from map';
comment on column public.trips.pickup_lat is 'Driver-selected pickup latitude from map';
comment on column public.trips.pickup_lng is 'Driver-selected pickup longitude from map';
