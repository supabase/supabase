-- Declarative schema. This file is the source of truth for the tasks table:
-- edit it, then run `supabase db diff -f <name>` to generate the migration.
-- Changes made in Studio or the SQL editor are not picked up by the diff.

create table tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null,
  closed boolean not null default false,
  created_at timestamptz not null default now()
);

-- Index the column the policies filter on.
create index tasks_user_id_idx on tasks (user_id);

-- Agents call the MCP server with the user's access token, so every tool runs
-- under these policies. A tool cannot reach another user's rows.
alter table tasks enable row level security;

create policy "Users can view their own tasks"
on tasks
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can create their own tasks"
on tasks
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update their own tasks"
on tasks
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete their own tasks"
on tasks
for delete
to authenticated
using ((select auth.uid()) = user_id);
