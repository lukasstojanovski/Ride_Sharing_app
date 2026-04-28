-- Optional vehicle and ride preferences on trips (offer wizard step 5).

alter table public.trips
  add column if not exists vehicle_info text,
  add column if not exists smoking_allowed boolean not null default false,
  add column if not exists pets_allowed boolean not null default false;

comment on column public.trips.vehicle_info is 'Free-text car make/model from driver';
comment on column public.trips.smoking_allowed is 'Whether smoking is allowed in the vehicle';
comment on column public.trips.pets_allowed is 'Whether pets are allowed in the vehicle';
