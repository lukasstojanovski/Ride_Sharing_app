-- Add has_unread to get_my_conversations for inbox list
-- Run in Supabase Dashboard > SQL Editor.

drop function if exists public.get_my_conversations();

create or replace function public.get_my_conversations()
returns table (
  id uuid,
  trip_id uuid,
  from_city text,
  to_city text,
  departure_time timestamptz,
  last_message text,
  last_message_at timestamptz,
  has_unread boolean
)
language sql
security definer
set search_path = public
stable
as $$
  select
    c.id,
    c.trip_id,
    t.from_city,
    t.to_city,
    t.departure_time,
    (select m.content from public.messages m
     where m.conversation_id = c.id
     order by m.created_at desc limit 1) as last_message,
    (select m.created_at from public.messages m
     where m.conversation_id = c.id
     order by m.created_at desc limit 1) as last_message_at,
    exists (
      select 1 from public.messages m
      left join public.conversation_last_read r
        on r.conversation_id = c.id and r.user_id = auth.uid()
      where m.conversation_id = c.id
        and m.user_id != auth.uid()
        and m.created_at > coalesce(r.last_read_at, '1970-01-01'::timestamptz)
    ) as has_unread
  from public.conversations c
  join public.trips t on t.id = c.trip_id
  where public.is_trip_participant(c.trip_id, auth.uid())
  order by coalesce(
    (select m.created_at from public.messages m where m.conversation_id = c.id order by m.created_at desc limit 1),
    c.created_at
  ) desc;
$$;
