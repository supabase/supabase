-- Uptime Monitor: check websites on a schedule and track incidents.
--
-- How it runs: a Cron job every 30 seconds puts one message per active
-- monitor on the `uptime_checks` queue, then calls the `run-checks` Edge
-- Function. The function reads a batch from the queue, requests each URL, and
-- records the results with `record_check`, which also opens an incident after
-- two failures in a row and resolves it on the next success.
--
-- Access model: people see and manage only their own monitors, checks and
-- incidents. Only the worker (secret key) can record checks.

create schema if not exists private;

create extension if not exists pgmq;
create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;

create table public.monitors (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 60),
  -- No backslashes: URL parsers treat them as slashes, which would let a URL
  -- pass the host allowlist below but request a different host.
  url text not null check (
    url ~ '^https?://[^\s/$.?#].[^\s]*$'
    and position(chr(92) in url) = 0
    and char_length(url) <= 500
  ),
  is_paused boolean not null default false,
  created_by uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.checks (
  id bigint generated always as identity primary key,
  monitor_id uuid not null references public.monitors (id) on delete cascade,
  checked_at timestamptz not null default now(),
  is_up boolean not null,
  status_code integer,
  latency_ms integer,
  error text
);

create table public.incidents (
  id uuid primary key default gen_random_uuid(),
  monitor_id uuid not null references public.monitors (id) on delete cascade,
  started_at timestamptz not null default now(),
  resolved_at timestamptz,
  cause text not null
);

create index monitors_created_by_idx on public.monitors (created_by);
create index checks_monitor_id_checked_at_idx on public.checks (monitor_id, checked_at desc);
create index checks_checked_at_idx on public.checks (checked_at);
create index incidents_monitor_id_idx on public.incidents (monitor_id, started_at desc);
create unique index incidents_one_open_per_monitor_idx
  on public.incidents (monitor_id) where resolved_at is null;

-- Ownership check used by the checks and incidents policies.
create function private.owns_monitor(target_monitor_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.monitors
    where id = target_monitor_id
      and created_by = (select auth.uid())
  );
$$;

revoke all on function private.owns_monitor(uuid) from public;
grant usage on schema private to authenticated;
grant execute on function private.owns_monitor(uuid) to authenticated;

alter table public.monitors enable row level security;
alter table public.checks enable row level security;
alter table public.incidents enable row level security;

-- New tables aren't exposed to the Data API without explicit grants (the
-- default for new projects), so grant exactly what the policies below allow.
grant select, insert, update, delete on public.monitors to authenticated;

-- created_at decides when a guest's monitors are pruned, so the server sets
-- it and nobody can change it (or created_by) afterwards. A trigger rather
-- than column grants, because the client sends whole rows.
create function private.protect_monitor_fields()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.created_at := now();
  else
    new.created_at := old.created_at;
    new.created_by := old.created_by;
  end if;
  return new;
end;
$$;

revoke all on function private.protect_monitor_fields() from public;

create trigger protect_monitor_fields
before insert or update on public.monitors
for each row execute function private.protect_monitor_fields();
grant select on public.checks to authenticated;
grant select on public.incidents to authenticated;

create policy "Users can view their monitors"
on public.monitors for select
to authenticated
using (created_by = (select auth.uid()));

create policy "Users can add monitors"
on public.monitors for insert
to authenticated
with check (created_by = (select auth.uid()));

create policy "Users can edit their monitors"
on public.monitors for update
to authenticated
using (created_by = (select auth.uid()))
with check (created_by = (select auth.uid()));

create policy "Users can delete their monitors"
on public.monitors for delete
to authenticated
using (created_by = (select auth.uid()));

create policy "Users can view checks for their monitors"
on public.checks for select
to authenticated
using ((select private.owns_monitor(monitor_id)));

create policy "Users can view incidents for their monitors"
on public.incidents for select
to authenticated
using ((select private.owns_monitor(monitor_id)));

-- Limits: up to 5 monitors per person, and, if any rows exist in
-- private.allowed_hosts, only those hosts (and their subdomains). The table is
-- empty by default, so any URL is allowed; a public demo can fill it in.
create table private.allowed_hosts (
  host text primary key
);

create function private.check_monitor_limits()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  url_host text := lower(substring(new.url from '^https?://([^/:?#]+)'));
begin
  if tg_op = 'INSERT' and (
    select count(*) from public.monitors where created_by = new.created_by
  ) >= 5 then
    raise exception 'You can have up to 5 monitors.' using errcode = 'check_violation';
  end if;

  if exists (select 1 from private.allowed_hosts) and not exists (
    select 1
    from private.allowed_hosts
    where url_host = host or url_host like '%.' || host
  ) then
    raise exception 'This demo can only monitor: %.',
      (select string_agg(host, ', ' order by host) from private.allowed_hosts)
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

revoke all on function private.check_monitor_limits() from public;

create trigger check_monitor_limits
before insert or update of url on public.monitors
for each row execute function private.check_monitor_limits();

-- Queue of pending checks.
select pgmq.create('uptime_checks');

-- Worker API, called by the run-checks Edge Function with the secret key.
-- Not executable by anon or authenticated users.
create function public.claim_checks(batch_size integer default 50, visibility_seconds integer default 60)
returns table (msg_id bigint, monitor_id uuid, url text)
language sql
security definer
set search_path = ''
as $$
  -- A null url means the monitor was deleted after the check was queued.
  select message.msg_id, monitor.id, monitor.url
  from pgmq.read('uptime_checks', visibility_seconds, batch_size) as message
  left join public.monitors as monitor
    on monitor.id = (message.message ->> 'monitor_id')::uuid;
$$;

create function public.record_check(
  msg_id bigint,
  monitor_id uuid,
  is_up boolean,
  status_code integer default null,
  latency_ms integer default null,
  error text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
-- Parameters share names with columns; in queries, unqualified names mean columns.
#variable_conflict use_column
declare
  was_up boolean;
begin
  -- One writer per monitor at a time, so "was the previous check down?" is
  -- read and acted on consistently.
  if record_check.monitor_id is not null then
    perform pg_advisory_xact_lock(hashtext(record_check.monitor_id::text));
  end if;

  if record_check.monitor_id is not null and exists (select 1 from public.monitors where id = record_check.monitor_id) then
    select checks.is_up into was_up
    from public.checks
    where checks.monitor_id = record_check.monitor_id
    order by checked_at desc
    limit 1;

    insert into public.checks (monitor_id, is_up, status_code, latency_ms, error)
    values (record_check.monitor_id, record_check.is_up, record_check.status_code,
            record_check.latency_ms, record_check.error);

    if record_check.is_up then
      update public.incidents
      set resolved_at = now()
      where incidents.monitor_id = record_check.monitor_id
        and resolved_at is null;
    elsif was_up is false then
      -- Two failures in a row: open an incident (at most one open per monitor).
      insert into public.incidents (monitor_id, cause)
      values (
        record_check.monitor_id,
        coalesce(record_check.error, 'HTTP ' || record_check.status_code)
      )
      on conflict (monitor_id) where resolved_at is null do nothing;
    end if;
  end if;

  perform pgmq.delete('uptime_checks', record_check.msg_id);
end;
$$;

-- The worker re-checks every redirect target against the allowlist.
create function public.allowed_monitor_hosts()
returns text[]
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(array_agg(host order by host), '{}') from private.allowed_hosts;
$$;

revoke all on function public.allowed_monitor_hosts() from public, anon, authenticated;
grant execute on function public.allowed_monitor_hosts() to service_role;

revoke all on function public.claim_checks(integer, integer) from public, anon, authenticated;
revoke all on function public.record_check(bigint, uuid, boolean, integer, integer, text)
  from public, anon, authenticated;
grant execute on function public.claim_checks(integer, integer) to service_role;
grant execute on function public.record_check(bigint, uuid, boolean, integer, integer, text)
  to service_role;

-- Every 30 seconds: queue a check for each active monitor and wake the
-- worker. The worker's URL and secret key come from Vault; see the README for
-- the two `vault.create_secret` calls.
create function private.queue_checks()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  messages jsonb[];
begin
  select array_agg(jsonb_build_object('monitor_id', id))
  into messages
  from public.monitors
  where not is_paused;

  if messages is null then
    return;
  end if;

  perform pgmq.send_batch('uptime_checks', messages);

  perform net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url')
      || '/functions/v1/run-checks',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', (select decrypted_secret from vault.decrypted_secrets where name = 'secret_key')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 30000
  );
end;
$$;

revoke all on function private.queue_checks() from public;

select cron.schedule('uptime-queue-checks', '30 seconds', 'select private.queue_checks()');

-- Nightly retention: keep a week of checks and a month of resolved incidents.
-- Monitors created by anonymous (guest) users are removed after a day, so
-- drive-by visitors don't leave checks running forever.
create function private.prune_history()
returns void
language sql
security definer
set search_path = ''
as $$
  delete from public.checks where checked_at < now() - interval '7 days';
  delete from public.incidents where resolved_at < now() - interval '30 days';
  delete from public.monitors as monitor
  using auth.users as owner
  where owner.id = monitor.created_by
    and owner.is_anonymous
    and monitor.created_at < now() - interval '1 day';
$$;

revoke all on function private.prune_history() from public;

select cron.schedule('uptime-prune-history', '15 3 * * *', 'select private.prune_history()');

-- Stream changes to the owner over Realtime (the select policies apply).
alter publication supabase_realtime add table public.monitors, public.checks, public.incidents;
