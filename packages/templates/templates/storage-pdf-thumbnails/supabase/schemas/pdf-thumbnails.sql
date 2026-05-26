-- PDF thumbnail pipeline.
-- Uploads to the `pdfs` bucket trigger an Edge Function that renders the first
-- page and uploads it to the public `pdf-thumbnails` bucket.

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
values
  ('pdfs', 'pdfs', false),
  ('pdf-thumbnails', 'pdf-thumbnails', true)
on conflict (id) do nothing;

create table if not exists public.pdf_thumbnails (
  id uuid primary key default gen_random_uuid(),
  object_id uuid not null unique references storage.objects(id) on delete cascade,
  bucket_id text not null,
  object_path text not null,
  thumbnail_path text,
  status text not null default 'pending' check (status in ('pending', 'ready', 'failed')),
  error text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

comment on table public.pdf_thumbnails is 'Status and output path for PDF thumbnail generation jobs.';

alter table public.pdf_thumbnails enable row level security;

create policy "Thumbnail status is readable by anyone"
on public.pdf_thumbnails for select
using (true);

create or replace function public.handle_pdf_upload()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.bucket_id <> 'pdfs' then
    return new;
  end if;

  insert into public.pdf_thumbnails (object_id, bucket_id, object_path)
  values (new.id, new.bucket_id, new.name)
  on conflict (object_id) do update
    set status = 'pending',
        error = null,
        updated_at = now();

  perform util.invoke_edge_function(
    name => 'pdf-thumbnail',
    body => jsonb_build_object(
      'objectId', new.id,
      'bucketId', new.bucket_id,
      'objectPath', new.name
    )
  );

  return new;
end;
$$;

drop trigger if exists on_pdf_upload on storage.objects;

create trigger on_pdf_upload
after insert on storage.objects
for each row
execute function public.handle_pdf_upload();
