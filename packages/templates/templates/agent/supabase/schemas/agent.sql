-- Persistent sessions, memory, and MCP server configuration for streaming AI agents.
-- Pair with ai-vector-search or ai-automatic-embeddings for embedding generation.

create extension if not exists vector with schema extensions;

create table if not exists public.agent_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade,
  title text,
  metadata jsonb not null default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

comment on table public.agent_sessions is 'Conversation sessions for an agent or user.';

create table if not exists public.agent_memories (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references public.agent_sessions on delete cascade not null,
  role text not null check (role in ('user', 'assistant', 'system', 'tool')),
  content text,
  state jsonb not null default '{}',
  embedding extensions.halfvec(1536),
  created_at timestamptz default now()
);

comment on table public.agent_memories is 'Individual messages and tool results within a session.';

create table if not exists public.agent_mcp_servers (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  url text not null,
  headers jsonb not null default '{}',
  enabled boolean not null default true,
  metadata jsonb not null default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

comment on table public.agent_mcp_servers is 'MCP servers whose tools can be exposed to the streaming agent endpoint. Avoid storing long-lived secrets in headers.';

create index if not exists agent_memories_session_id_idx on public.agent_memories (session_id);

create index if not exists agent_memories_embedding_idx
on public.agent_memories
using hnsw (embedding extensions.halfvec_cosine_ops);

alter table public.agent_sessions enable row level security;
alter table public.agent_memories enable row level security;
alter table public.agent_mcp_servers enable row level security;

create policy "Users can read their own sessions"
on public.agent_sessions
for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can insert their own sessions"
on public.agent_sessions
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update their own sessions"
on public.agent_sessions
for update
to authenticated
using (auth.uid() = user_id);

create policy "Users can delete their own sessions"
on public.agent_sessions
for delete
to authenticated
using (auth.uid() = user_id);

create policy "Users can read memories in their sessions"
on public.agent_memories
for select
to authenticated
using (
  exists (
    select 1
    from public.agent_sessions
    where agent_sessions.id = agent_memories.session_id
      and agent_sessions.user_id = auth.uid()
  )
);

create policy "Users can insert memories in their sessions"
on public.agent_memories
for insert
to authenticated
with check (
  exists (
    select 1
    from public.agent_sessions
    where agent_sessions.id = agent_memories.session_id
      and agent_sessions.user_id = auth.uid()
  )
);

create policy "Authenticated users can read enabled MCP servers"
on public.agent_mcp_servers
for select
to authenticated
using (enabled = true);

create or replace function public.match_agent_memories(
  session_id uuid,
  query_embedding extensions.halfvec(1536),
  match_count int default 8
)
returns table (
  id uuid,
  role text,
  content text,
  state jsonb,
  similarity float
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    agent_memories.id,
    agent_memories.role,
    agent_memories.content,
    agent_memories.state,
    1 - (agent_memories.embedding <=> query_embedding) as similarity
  from public.agent_memories
  where agent_memories.session_id = match_agent_memories.session_id
    and agent_memories.embedding is not null
    and exists (
      select 1
      from public.agent_sessions
      where agent_sessions.id = agent_memories.session_id
        and agent_sessions.user_id = auth.uid()
    )
  order by agent_memories.embedding <=> query_embedding
  limit least(match_count, 50);
$$;
