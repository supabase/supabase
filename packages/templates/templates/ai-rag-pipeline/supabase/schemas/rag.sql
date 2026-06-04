-- Self-contained RAG pipeline: documents, chunked passages, vector index,
-- embedding queue, and a SQL helper for similarity search.

create extension if not exists vector with schema extensions;
create extension if not exists pgmq;
create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron;

create schema if not exists util;

create or replace function util.project_url()
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  secret_value text;
begin
  select decrypted_secret into secret_value
  from vault.decrypted_secrets
  where name = 'project_url';

  return secret_value;
end;
$$;

create or replace function util.invoke_edge_function(
  name text,
  body jsonb,
  timeout_milliseconds int default 300000
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  headers_raw text;
  auth_header text;
begin
  headers_raw := current_setting('request.headers', true);

  auth_header := case
    when headers_raw is not null then (headers_raw::json ->> 'authorization')
    else null
  end;

  perform net.http_post(
    url => util.project_url() || '/functions/v1/' || name,
    headers => jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', auth_header
    ),
    body => body,
    timeout_milliseconds => timeout_milliseconds
  );
end;
$$;

create table if not exists public.rag_documents (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  metadata jsonb not null default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

comment on table public.rag_documents is 'One row per ingested document. Content lives in `rag_chunks`.';

create table if not exists public.rag_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.rag_documents(id) on delete cascade,
  chunk_index int not null,
  content text not null,
  embedding extensions.halfvec(1536),
  created_at timestamptz default now(),
  unique (document_id, chunk_index)
);

comment on table public.rag_chunks is 'Chunked text passages with embeddings. One document fans out into many chunks.';

create index if not exists rag_chunks_embedding_idx
on public.rag_chunks
using hnsw (embedding extensions.halfvec_cosine_ops);

alter table public.rag_documents enable row level security;
alter table public.rag_chunks enable row level security;

create policy "Authenticated users can read documents"
on public.rag_documents for select
to authenticated
using (true);

create policy "Authenticated users can read chunks"
on public.rag_chunks for select
to authenticated
using (true);

select pgmq.create('rag_embedding_jobs');

create or replace function public.queue_rag_chunk_embedding()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform pgmq.send(
    queue_name => 'rag_embedding_jobs',
    msg => jsonb_build_object('chunkId', new.id)
  );
  return new;
end;
$$;

create trigger queue_rag_chunk_embedding_on_insert
after insert on public.rag_chunks
for each row
execute function public.queue_rag_chunk_embedding();

create trigger reembed_rag_chunk_on_content_change
after update of content on public.rag_chunks
for each row
when (new.content is distinct from old.content)
execute function public.queue_rag_chunk_embedding();

create or replace function util.process_rag_embeddings(
  batch_size int default 10,
  max_requests int default 5,
  timeout_milliseconds int default 300000
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  job_batches jsonb[];
  batch jsonb;
begin
  with
    numbered_jobs as (
      select
        message || jsonb_build_object('jobId', msg_id) as job_info,
        (row_number() over (order by 1) - 1) / batch_size as batch_num
      from pgmq.read(
        queue_name => 'rag_embedding_jobs',
        vt => timeout_milliseconds / 1000,
        qty => max_requests * batch_size
      )
    ),
    batched_jobs as (
      select jsonb_agg(job_info) as batch_array, batch_num
      from numbered_jobs
      group by batch_num
    )
  select coalesce(array_agg(batch_array), array[]::jsonb[])
  into job_batches
  from batched_jobs;

  foreach batch in array job_batches loop
    perform util.invoke_edge_function(
      name => 'rag-embed',
      body => batch,
      timeout_milliseconds => timeout_milliseconds
    );
  end loop;
end;
$$;

select cron.schedule(
  'process-rag-embeddings',
  '10 seconds',
  $$ select util.process_rag_embeddings(); $$
);

create or replace function public.match_rag_chunks(
  query_embedding extensions.halfvec(1536),
  match_count int default 8,
  source_filter text default null
)
returns table (
  chunk_id uuid,
  document_id uuid,
  source text,
  chunk_index int,
  content text,
  metadata jsonb,
  similarity float
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    c.id as chunk_id,
    c.document_id,
    d.source,
    c.chunk_index,
    c.content,
    d.metadata,
    1 - (c.embedding <=> query_embedding) as similarity
  from public.rag_chunks c
  join public.rag_documents d on d.id = c.document_id
  where c.embedding is not null
    and (source_filter is null or d.source = source_filter)
  order by c.embedding <=> query_embedding
  limit least(match_count, 50);
$$;
