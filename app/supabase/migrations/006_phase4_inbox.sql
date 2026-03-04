-- Phase 4: Inbox — conversations tied to trips, only participants can message
-- Run in Supabase Dashboard > SQL Editor after 005_push_tokens.sql.

-- ─── Helper: is_trip_participant ────────────────────────────────────────────
create or replace function public.is_trip_participant(p_trip_id uuid, p_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.trips t
    where t.id = p_trip_id and t.creator_id = p_user_id
  )
  or exists (
    select 1 from public.reservations r
    where r.trip_id = p_trip_id
      and r.passenger_id = p_user_id
      and r.status = 'accepted'
  );
$$;

-- ─── conversations table ────────────────────────────────────────────────────
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null unique references public.trips(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists idx_conversations_trip_id on public.conversations(trip_id);

alter table public.conversations enable row level security;

create policy "Participants can select conversation"
  on public.conversations for select
  using (public.is_trip_participant(trip_id, auth.uid()));

-- No insert/update/delete by users; trigger creates conversations.

-- ─── messages table ─────────────────────────────────────────────────────────
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  content text not null check (char_length(trim(content)) > 0),
  created_at timestamptz not null default now()
);

create index if not exists idx_messages_conversation_id on public.messages(conversation_id);
create index if not exists idx_messages_created_at on public.messages(created_at);

alter table public.messages enable row level security;

create policy "Participants can select messages"
  on public.messages for select
  using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and public.is_trip_participant(c.trip_id, auth.uid())
    )
  );

create policy "Participants can insert messages"
  on public.messages for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and public.is_trip_participant(c.trip_id, auth.uid())
    )
  );

-- ─── Trigger: create conversation when reservation accepted ──────────────────
create or replace function public.ensure_conversation_on_accept()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'accepted' then
    insert into public.conversations (trip_id)
    values (new.trip_id)
    on conflict (trip_id) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists on_reservation_accepted_conversation on public.reservations;
create trigger on_reservation_accepted_conversation
  after insert or update of status on public.reservations
  for each row when (new.status = 'accepted')
  execute function public.ensure_conversation_on_accept();

-- ─── RPC: get_my_conversations (list with last message) ──────────────────────
create or replace function public.get_my_conversations()
returns table (
  id uuid,
  trip_id uuid,
  from_city text,
  to_city text,
  departure_time timestamptz,
  last_message text,
  last_message_at timestamptz
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
     order by m.created_at desc limit 1) as last_message_at
  from public.conversations c
  join public.trips t on t.id = c.trip_id
  where public.is_trip_participant(c.trip_id, auth.uid())
  order by coalesce(
    (select m.created_at from public.messages m where m.conversation_id = c.id order by m.created_at desc limit 1),
    c.created_at
  ) desc;
$$;

-- ─── Realtime: enable for messages (Supabase default publication) ───────────
alter publication supabase_realtime add table public.messages;
