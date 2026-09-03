create table public.sandboxes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  project_repo_id uuid not null references public.project_repos (id) on delete cascade,
  provider text not null,
  provider_ref text,
  endpoint_url text,
  status text not null check (status in ('pending', 'running', 'suspended', 'terminated', 'error')),
  branch text not null,
  agent_session_id text,
  last_activity_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  terminated_at timestamptz
);

create index on public.sandboxes (conversation_id);
create index on public.sandboxes (user_id);
create index on public.sandboxes (status, last_activity_at);
create index on public.sandboxes (project_repo_id);

alter table public.sandboxes enable row level security;

create policy "own sandboxes"
  on public.sandboxes
  for select
  to authenticated
  using (user_id = (select auth.uid()));
