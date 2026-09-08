-- Declarative schema. This file is the source of truth for the tasks table:
-- edit it, then run `supabase db diff -f <name>` to generate the migration.
-- Changes made in Studio or the SQL editor are not picked up by the diff.

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null constraint tasks_title_length check (
    char_length(title) between 1 and 200 and title ~ '[^[:space:]]'
  ),
  closed boolean not null default false,
  created_at timestamptz not null default now()
);

-- Support the ownership policies and the tools' newest-first ordering.
create index tasks_user_id_created_at_id_idx on public.tasks (user_id, created_at desc, id desc);

-- Agents call the MCP server with the user's access token, so every tool runs
-- under these policies. A tool cannot reach another user's rows.
alter table public.tasks enable row level security;

-- Expose task operations to signed-in users even when automatic API grants are disabled.
grant select, insert, update, delete on table public.tasks to authenticated;

create policy "Users can view their own tasks"
on public.tasks
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can create their own tasks"
on public.tasks
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update their own tasks"
on public.tasks
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete their own tasks"
on public.tasks
for delete
to authenticated
using ((select auth.uid()) = user_id);
