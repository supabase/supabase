-- Durable workflow runner with pgmq, retry state, attempts, and an Edge Function worker.

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

create table if not exists public.workflow_runs (
  id uuid primary key default gen_random_uuid(),
  workflow_type text not null,
  input jsonb not null default '{}',
  status text not null default 'queued' check (
    status in ('queued', 'running', 'succeeded', 'failed', 'cancelled', 'dead_letter')
  ),
  attempt_count int not null default 0,
  max_attempts int not null default 3,
  run_after timestamptz not null default now(),
  locked_at timestamptz,
  locked_by text,
  result jsonb,
  error text,
  metadata jsonb not null default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.workflow_steps (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.workflow_runs(id) on delete cascade,
  step_key text not null,
  status text not null default 'queued' check (
    status in ('queued', 'running', 'succeeded', 'failed', 'skipped')
  ),
  input jsonb not null default '{}',
  result jsonb,
  error text,
  attempt_count int not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (run_id, step_key)
);

create table if not exists public.workflow_attempts (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.workflow_runs(id) on delete cascade,
  attempt_number int not null,
  status text not null default 'running' check (status in ('running', 'succeeded', 'failed')),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  error text,
  result jsonb
);

create index if not exists workflow_runs_status_run_after_idx
on public.workflow_runs (status, run_after);

create index if not exists workflow_steps_run_id_idx
on public.workflow_steps (run_id);

create index if not exists workflow_attempts_run_id_idx
on public.workflow_attempts (run_id);

alter table public.workflow_runs enable row level security;
alter table public.workflow_steps enable row level security;
alter table public.workflow_attempts enable row level security;

create policy "Authenticated users can read workflow runs"
on public.workflow_runs for select
to authenticated
using (true);

create policy "Authenticated users can read workflow steps"
on public.workflow_steps for select
to authenticated
using (true);

create policy "Authenticated users can read workflow attempts"
on public.workflow_attempts for select
to authenticated
using (true);

select pgmq.create('workflow_runs');

create or replace function public.enqueue_workflow(
  workflow_type text,
  input jsonb default '{}',
  run_after timestamptz default now(),
  max_attempts int default 3,
  metadata jsonb default '{}'
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  run_id uuid;
begin
  insert into public.workflow_runs (
    workflow_type,
    input,
    run_after,
    max_attempts,
    metadata
  )
  values (
    enqueue_workflow.workflow_type,
    enqueue_workflow.input,
    enqueue_workflow.run_after,
    greatest(enqueue_workflow.max_attempts, 1),
    enqueue_workflow.metadata
  )
  returning id into run_id;

  perform pgmq.send(
    queue_name => 'workflow_runs',
    msg => jsonb_build_object('runId', run_id)
  );

  return run_id;
end;
$$;

create or replace function util.dispatch_workflows(
  batch_size int default 10,
  timeout_milliseconds int default 300000
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  job record;
begin
  for job in
    select msg_id, message
    from pgmq.read(
      queue_name => 'workflow_runs',
      vt => timeout_milliseconds / 1000,
      qty => batch_size
    )
  loop
    perform util.invoke_edge_function(
      name => 'workflow-worker',
      body => job.message || jsonb_build_object('jobId', job.msg_id),
      timeout_milliseconds => timeout_milliseconds
    );
  end loop;
end;
$$;

select cron.schedule(
  'dispatch-workflows',
  '10 seconds',
  $$ select util.dispatch_workflows(); $$
);
