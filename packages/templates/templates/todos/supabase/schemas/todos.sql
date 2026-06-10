create table public.todos (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  task text not null,
  is_complete boolean not null default false,
  inserted_at timestamptz not null default now()
);

alter table public.todos enable row level security;

create policy "Users can read their own todos"
on public.todos for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can create their own todos"
on public.todos for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update their own todos"
on public.todos for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete their own todos"
on public.todos for delete
to authenticated
using ((select auth.uid()) = user_id);
