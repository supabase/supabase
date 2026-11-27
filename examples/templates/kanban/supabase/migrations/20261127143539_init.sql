-- Kanban board: boards, members and cards, with row level security.
--
-- Access model: a board is visible to its creator and its members. Anyone who
-- has a board's id (the invite link) can join it, and members can read and
-- write every card on the board.

-- Helpers live in a schema the Data API does not expose.
create schema if not exists private;

create table public.boards (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 80),
  created_by uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.board_members (
  board_id uuid not null references public.boards (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (board_id, user_id)
);

create type public.card_status as enum ('todo', 'doing', 'done');

create table public.cards (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references public.boards (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 200),
  status public.card_status not null default 'todo',
  -- Fractional position: a move sets this to the midpoint of its new
  -- neighbours, so reordering only ever updates one row.
  position double precision not null,
  created_by uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index boards_created_by_idx on public.boards (created_by);
create index board_members_user_id_idx on public.board_members (user_id);
create index cards_board_id_status_position_idx on public.cards (board_id, status, position);
create index cards_created_by_idx on public.cards (created_by);

-- Membership check used by the policies below. Security definer so the
-- board_members policy can call it without recursing into itself.
create function private.is_board_member(target_board_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.board_members
    where board_id = target_board_id
      and user_id = (select auth.uid())
  );
$$;

revoke all on function private.is_board_member(uuid) from public;
grant usage on schema private to authenticated;
grant execute on function private.is_board_member(uuid) to authenticated;

-- The creator becomes the first member.
create function private.add_board_creator()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.board_members (board_id, user_id)
  values (new.id, new.created_by)
  on conflict do nothing;
  return new;
end;
$$;

revoke all on function private.add_board_creator() from public;

create trigger on_board_created
after insert on public.boards
for each row execute function private.add_board_creator();

alter table public.boards enable row level security;
alter table public.board_members enable row level security;
alter table public.cards enable row level security;

-- Boards
create policy "Members can view boards"
on public.boards for select
to authenticated
using (created_by = (select auth.uid()) or (select private.is_board_member(id)));

create policy "Users can create boards they own"
on public.boards for insert
to authenticated
with check (created_by = (select auth.uid()));

create policy "Members can rename boards"
on public.boards for update
to authenticated
using ((select private.is_board_member(id)))
with check ((select private.is_board_member(id)));

create policy "Owners can delete boards"
on public.boards for delete
to authenticated
using (created_by = (select auth.uid()));

-- Board members
create policy "Members can view the member list"
on public.board_members for select
to authenticated
using ((select private.is_board_member(board_id)));

create policy "Users can join a board with its link"
on public.board_members for insert
to authenticated
with check (user_id = (select auth.uid()));

create policy "Users can leave a board"
on public.board_members for delete
to authenticated
using (user_id = (select auth.uid()));

-- Cards
create policy "Members can view cards"
on public.cards for select
to authenticated
using ((select private.is_board_member(board_id)));

create policy "Members can add cards"
on public.cards for insert
to authenticated
with check ((select private.is_board_member(board_id)) and created_by = (select auth.uid()));

create policy "Members can move and edit cards"
on public.cards for update
to authenticated
using ((select private.is_board_member(board_id)))
with check ((select private.is_board_member(board_id)));

create policy "Members can delete cards"
on public.cards for delete
to authenticated
using ((select private.is_board_member(board_id)));

-- Stream card changes to members over Realtime (Realtime applies the
-- select policy above, so users only receive cards they can read).
alter publication supabase_realtime add table public.cards;
