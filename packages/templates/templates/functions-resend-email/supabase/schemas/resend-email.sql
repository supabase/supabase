-- Queued transactional email delivery with Resend.

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

create table if not exists public.email_messages (
  id uuid primary key default gen_random_uuid(),
  to_email text[] not null check (array_length(to_email, 1) > 0),
  from_email text,
  subject text not null,
  html text,
  text text,
  tags jsonb not null default '{}',
  status text not null default 'queued' check (
    status in ('queued', 'sending', 'sent', 'failed', 'cancelled')
  ),
  provider_message_id text,
  error text,
  scheduled_at timestamptz not null default now(),
  sent_at timestamptz,
  attempts int not null default 0,
  max_attempts int not null default 3,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  check (html is not null or text is not null)
);

create index if not exists email_messages_status_scheduled_at_idx
on public.email_messages (status, scheduled_at);

create index if not exists email_messages_provider_message_id_idx
on public.email_messages (provider_message_id);

alter table public.email_messages enable row level security;

create policy "Users can read their own email messages"
on public.email_messages for select
to authenticated
using (created_by = auth.uid());

select pgmq.create('email_jobs');

create or replace function public.enqueue_email(
  to_email text[],
  subject text,
  html text default null,
  text text default null,
  from_email text default null,
  tags jsonb default '{}',
  scheduled_at timestamptz default now(),
  max_attempts int default 3
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  email_id uuid;
begin
  insert into public.email_messages (
    to_email,
    from_email,
    subject,
    html,
    text,
    tags,
    scheduled_at,
    max_attempts,
    created_by
  )
  values (
    enqueue_email.to_email,
    enqueue_email.from_email,
    enqueue_email.subject,
    enqueue_email.html,
    enqueue_email.text,
    enqueue_email.tags,
    enqueue_email.scheduled_at,
    greatest(enqueue_email.max_attempts, 1),
    auth.uid()
  )
  returning id into email_id;

  perform pgmq.send(
    queue_name => 'email_jobs',
    msg => jsonb_build_object('emailId', email_id)
  );

  return email_id;
end;
$$;

create or replace function util.process_email_queue(
  batch_size int default 10,
  timeout_milliseconds int default 300000
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  jobs jsonb;
begin
  with queued_jobs as (
    select message || jsonb_build_object('jobId', msg_id) as job
    from pgmq.read(
      queue_name => 'email_jobs',
      vt => timeout_milliseconds / 1000,
      qty => batch_size
    )
  )
  select jsonb_agg(job)
  into jobs
  from queued_jobs;

  if jobs is null then
    return;
  end if;

  perform util.invoke_edge_function(
    name => 'send-email',
    body => jobs,
    timeout_milliseconds => timeout_milliseconds
  );
end;
$$;

select cron.schedule(
  'process-email-queue',
  '10 seconds',
  $$ select util.process_email_queue(); $$
);
