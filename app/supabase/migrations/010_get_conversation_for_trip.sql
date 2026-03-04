-- RPC: get conversation id for a trip (driver or accepted passenger only)
-- Run in Supabase Dashboard > SQL Editor.

create or replace function public.get_conversation_for_trip(p_trip_id uuid)
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select c.id
  from public.conversations c
  where c.trip_id = p_trip_id
    and public.is_trip_participant(p_trip_id, auth.uid())
  limit 1;
$$;
