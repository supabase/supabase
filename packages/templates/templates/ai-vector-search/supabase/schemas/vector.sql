-- Semantic search with pgvector.
-- See: https://supabase.com/docs/guides/ai/semantic-search

create extension if not exists vector with schema extensions;

create table public.documents (
  id bigint generated always as identity primary key,
  title text not null,
  content text not null,
  embedding extensions.halfvec(1536),
  metadata jsonb not null default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

comment on table public.documents is 'Content with vector embeddings for semantic search.';

create index documents_embedding_idx
on public.documents
using hnsw (embedding extensions.halfvec_cosine_ops);

alter table public.documents enable row level security;

create policy "Allow authenticated read access"
on public.documents
for select
to authenticated
using (true);

create policy "Allow authenticated insert access"
on public.documents
for insert
to authenticated
with check (true);

create policy "Allow authenticated update access"
on public.documents
for update
to authenticated
using (true);

create or replace function public.match_documents(
  query_embedding extensions.halfvec(1536),
  match_count int default 10
)
returns table (
  id bigint,
  title text,
  content text,
  similarity float
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    documents.id,
    documents.title,
    documents.content,
    1 - (documents.embedding <=> query_embedding) as similarity
  from public.documents
  where documents.embedding is not null
  order by documents.embedding <=> query_embedding
  limit least(match_count, 100);
$$;
