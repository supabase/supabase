-- Storage-backed ingestion for the RAG pipeline.
-- Text and Markdown files uploaded to `rag-files` are copied into rag_documents/rag_chunks.

create extension if not exists pg_net with schema extensions;

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

insert into storage.buckets (id, name, public)
values ('rag-files', 'rag-files', false)
on conflict (id) do nothing;

create policy "Users can upload their own RAG files"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'rag-files'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "Users can read their own RAG files"
on storage.objects for select
to authenticated
using (
  bucket_id = 'rag-files'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create table if not exists public.rag_file_ingestions (
  id uuid primary key default gen_random_uuid(),
  object_id uuid not null unique references storage.objects(id) on delete cascade,
  bucket_id text not null,
  object_path text not null,
  document_id uuid references public.rag_documents(id) on delete set null,
  mime_type text,
  metadata jsonb not null default '{}',
  status text not null default 'pending' check (status in ('pending', 'processing', 'ready', 'failed')),
  error text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

comment on table public.rag_file_ingestions is 'Tracks Storage objects being ingested into the RAG pipeline.';

alter table public.rag_file_ingestions enable row level security;

create policy "Users can read their own RAG file ingestions"
on public.rag_file_ingestions for select
to authenticated
using (auth.uid()::text = split_part(object_path, '/', 1));

create or replace function public.handle_rag_file_upload()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.bucket_id <> 'rag-files' then
    return new;
  end if;

  insert into public.rag_file_ingestions (
    object_id,
    bucket_id,
    object_path,
    mime_type,
    status
  )
  values (
    new.id,
    new.bucket_id,
    new.name,
    new.metadata ->> 'mimetype',
    'pending'
  )
  on conflict (object_id) do update
    set status = 'pending',
        error = null,
        updated_at = now();

  perform util.invoke_edge_function(
    name => 'rag-file-ingest',
    body => jsonb_build_object(
      'objectId', new.id,
      'bucketId', new.bucket_id,
      'objectPath', new.name,
      'mimeType', new.metadata ->> 'mimetype'
    )
  );

  return new;
end;
$$;

drop trigger if exists on_rag_file_upload on storage.objects;

create trigger on_rag_file_upload
after insert on storage.objects
for each row
execute function public.handle_rag_file_upload();
