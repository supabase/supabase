-- Automatic embedding generation pipeline.
-- See: https://supabase.com/docs/guides/ai/automatic-embeddings

create extension if not exists vector with schema extensions;
create extension if not exists pgmq;
create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron;
create extension if not exists hstore with schema extensions;

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

create or replace function util.clear_column()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  clear_column text := tg_argv[0];
begin
  new := new #= hstore(clear_column, null);
  return new;
end;
$$;

select pgmq.create('embedding_jobs');

create or replace function util.queue_embeddings()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  content_function text := tg_argv[0];
  embedding_column text := tg_argv[1];
begin
  perform pgmq.send(
    queue_name => 'embedding_jobs',
    msg => jsonb_build_object(
      'id', new.id,
      'schema', tg_table_schema,
      'table', tg_table_name,
      'contentFunction', content_function,
      'embeddingColumn', embedding_column
    )
  );

  return new;
end;
$$;

create or replace function util.process_embeddings(
  batch_size int default 10,
  max_requests int default 10,
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
        queue_name => 'embedding_jobs',
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
      name => 'embed',
      body => batch,
      timeout_milliseconds => timeout_milliseconds
    );
  end loop;
end;
$$;

select cron.schedule(
  'process-embeddings',
  '10 seconds',
  $$ select util.process_embeddings(); $$
);

-- Example: wire up the documents table from ai-vector-search
create or replace function public.embedding_input(doc public.documents)
returns text
language plpgsql
immutable
as $$
begin
  return doc.title || E'\n\n' || doc.content;
end;
$$;

create trigger embed_documents_on_insert
after insert on public.documents
for each row
execute function util.queue_embeddings('embedding_input', 'embedding');

create trigger clear_document_embedding_on_update
before update of title, content on public.documents
for each row
execute function util.clear_column('embedding');

create trigger embed_documents_on_update
after update of title, content on public.documents
for each row
execute function util.queue_embeddings('embedding_input', 'embedding');
