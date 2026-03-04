-- Track when user last read each conversation (for unread badge)
-- Run in Supabase Dashboard > SQL Editor.

create table if not exists public.conversation_last_read (
  user_id uuid not null references public.profiles(id) on delete cascade,
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  last_read_at timestamptz not null default now(),
  primary key (user_id, conversation_id)
);

create index if not exists idx_conversation_last_read_user_id on public.conversation_last_read(user_id);

alter table public.conversation_last_read enable row level security;

create policy "Users can manage own last_read"
  on public.conversation_last_read for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- RPC: get total unread message count (messages from others after last_read)
create or replace function public.get_unread_inbox_count()
returns int
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(sum(cnt), 0)::int from (
    select count(m.id) as cnt
    from public.conversations c
    join public.trips t on t.id = c.trip_id
    join public.messages m on m.conversation_id = c.id and m.user_id != auth.uid()
    left join public.conversation_last_read r on r.conversation_id = c.id and r.user_id = auth.uid()
    where public.is_trip_participant(c.trip_id, auth.uid())
      and m.created_at > coalesce(r.last_read_at, '1970-01-01'::timestamptz)
    group by c.id
  ) x;
$$;

-- RPC: mark conversation as read
create or replace function public.mark_conversation_read(p_conversation_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_trip_participant(
    (select trip_id from public.conversations where id = p_conversation_id),
    auth.uid()
  ) then
    return;
  end if;
  insert into public.conversation_last_read (user_id, conversation_id, last_read_at)
  values (auth.uid(), p_conversation_id, now())
  on conflict (user_id, conversation_id) do update set last_read_at = now();
end;
$$;

-- Enable Realtime for conversation_last_read (so badge updates when marking read)
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'conversation_last_read'
  ) then
    alter publication supabase_realtime add table public.conversation_last_read;
  end if;
end
$$;
