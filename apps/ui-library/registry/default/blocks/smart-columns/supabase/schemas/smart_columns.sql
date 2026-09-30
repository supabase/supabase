-- Smart Columns sends changed rows through Supabase Queues to the smart-columns Edge
-- Function, which fills their output columns with Jev. Instructions live in the
-- function's config.ts. Add this trigger to each table listed there:
--
--   create trigger smart_columns after insert or update or delete on public.feedback
--   for each row execute function smart_columns.enqueue();

create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron;
create extension if not exists pgmq;

-- One message per row waiting for the worker. Failed rows are archived.
select pgmq.create('smart_columns');

-- Private to the database owner, which the worker connects as.
create schema smart_columns;
revoke all on schema smart_columns from public, anon, authenticated;

-- Each row's status and what its outputs were last answered with.
create table smart_columns.row_state (
  target regclass not null,
  row_id text not null,
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'ready', 'needs_review', 'failed')),
  -- Set when the worker claims the row. A newer write clears it, so the worker
  -- discards answers for older inputs.
  lease uuid unique,
  message_id bigint,
  updated_at timestamptz not null default now(),
  -- The worker's fingerprint of each output's inputs and instructions.
  fingerprints jsonb not null default '{}',
  result jsonb,
  error text,
  primary key (target, row_id)
);
alter table smart_columns.row_state enable row level security;

create or replace function smart_columns.primary_key(source_table regclass)
returns text language sql stable set search_path = '' as $$
  select attribute.attname
  from pg_catalog.pg_index as key_index
  join pg_catalog.pg_attribute as attribute
    on attribute.attrelid = key_index.indrelid and attribute.attnum = key_index.indkey[0]
  where key_index.indrelid = source_table and key_index.indisprimary and key_index.indnatts = 1;
$$;

-- pg_net starts the worker after commit, and the worker drains the queue in a loop.
-- Cron passes recover => true: it restarts a stalled queue but never adds a worker
-- while messages are being processed.
create or replace function smart_columns.wake(recover boolean default false)
returns void language plpgsql set search_path = '' as $$
declare
  worker_url text;
  worker_secret text;
begin
  if not exists (select 1 from pgmq.q_smart_columns where vt <= now())
    or recover and exists (select 1 from pgmq.q_smart_columns where vt > now() and read_ct > 0)
  then return; end if;

  select decrypted_secret into worker_url from vault.decrypted_secrets
    where name = 'smart_columns_url';
  select decrypted_secret into worker_secret from vault.decrypted_secrets
    where name = 'smart_columns_secret';
  if worker_url is null or worker_secret is null then return; end if;

  perform net.http_post(
    url := worker_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || worker_secret
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 60000
  );
exception when others then
  -- A dispatch failure must not reject a user's write. Cron retries the wakeup.
  raise warning 'Smart Columns could not wake the worker; queued rows will be retried.';
end;
$$;

-- Marks a row pending and sends a message, unless one is already waiting for it.
-- A claim in progress is replaced, so the worker discards that claim's answers.
-- Returns whether it sent a message.
create or replace function smart_columns.queue(source_table regclass, source_id text)
returns boolean language plpgsql set search_path = '' as $$
declare
  previous text;
begin
  select status into previous from smart_columns.row_state
  where target = source_table and row_id = source_id for update;
  insert into smart_columns.row_state (target, row_id) values (source_table, source_id)
  on conflict (target, row_id) do update set
    status = 'pending', lease = null, updated_at = now(), error = null;
  if previous is not distinct from 'pending' then return false; end if;
  perform pgmq.send(
    'smart_columns', jsonb_build_object('target', source_table, 'row_id', source_id)
  );
  return true;
end;
$$;

-- Runs as the database owner so application roles can write to the table.
create or replace function smart_columns.enqueue()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  key_column text;
begin
  -- The worker's own writes, and updates that change nothing, need no evaluation.
  if current_setting('smart_columns.writing', true) = 'on'
    or TG_OP = 'UPDATE' and to_jsonb(OLD) = to_jsonb(NEW) then
    return null;
  end if;
  key_column := smart_columns.primary_key(TG_RELID::regclass);
  if key_column is null then
    raise exception 'Smart Columns needs % to have a single-column primary key.', TG_RELID::regclass;
  end if;

  if TG_OP = 'DELETE' or TG_OP = 'UPDATE'
    and to_jsonb(OLD) -> key_column is distinct from to_jsonb(NEW) -> key_column then
    delete from smart_columns.row_state
      where target = TG_RELID::regclass and row_id = to_jsonb(OLD) ->> key_column;
  end if;
  if TG_OP = 'DELETE' then return null; end if;

  perform smart_columns.queue(TG_RELID::regclass, to_jsonb(NEW) ->> key_column);

  -- Bulk writes need only one HTTP wakeup per transaction.
  if current_setting('smart_columns.woken', true) is distinct from 'true' then
    perform set_config('smart_columns.woken', 'true', true);
    perform smart_columns.wake();
  end if;
  return null;
end;
$$;

-- Queues every row of a table. The worker skips outputs whose inputs and instructions
-- have not changed, so run this after adding the trigger or deploying a config change.
create or replace function smart_columns.backfill(source_table regclass)
returns bigint language plpgsql set search_path = '' as $$
declare
  queued bigint;
begin
  if not exists (
    select 1 from pg_catalog.pg_trigger
    where tgrelid = source_table and tgfoid = 'smart_columns.enqueue'::regproc
  ) then
    raise exception 'Add the smart_columns trigger to % first.', source_table;
  end if;
  execute format(
    'select count(smart_columns.queue($1, to_jsonb(source_row) ->> $2)) from %s as source_row',
    source_table
  ) into queued using source_table, smart_columns.primary_key(source_table);
  perform smart_columns.wake();
  return queued;
end;
$$;

-- Reads up to batch_size messages for 30 seconds, claims their rows, and returns each
-- row's inputs. tables maps each configured table to its input columns, for example
-- {"public.feedback": ["title", "body"]}. Messages for deleted or already answered
-- rows are deleted; those for unconfigured tables or on a sixth read are archived.
create or replace function smart_columns.claim(batch_size integer, tables jsonb)
returns table (lease uuid, message_id bigint, target text, input jsonb, fingerprints jsonb, result jsonb)
language plpgsql set search_path = '' set lock_timeout = '5s' as $$
#variable_conflict use_column
declare
  queued record;
  source_table regclass;
  table_name text;
  state smart_columns.row_state;
  key_column text;
  source jsonb;
begin
  for queued in select * from pgmq.read('smart_columns', 30, batch_size) loop
    source_table := to_regclass(queued.message ->> 'target');
    select * into state from smart_columns.row_state as row_state
    where row_state.target = source_table and row_state.row_id = queued.message ->> 'row_id'
    for update;
    -- A second message for a row another worker is evaluating is a duplicate.
    if not found or state.status not in ('pending', 'processing')
      or state.status = 'processing' and state.message_id <> queued.msg_id then
      perform pgmq.delete('smart_columns', queued.msg_id);
      continue;
    end if;

    select configured into table_name from jsonb_object_keys(tables) as configured
    where to_regclass(configured) = source_table;
    if table_name is null or queued.read_ct > 5 then
      update smart_columns.row_state as row_state set
        status = 'failed', lease = null, updated_at = now(),
        error = case when table_name is null
          then format('No configuration for %s in the smart-columns function.', source_table)
          else coalesce(row_state.error, 'The worker stopped before finishing.') end
      where row_state.target = state.target and row_state.row_id = state.row_id;
      perform pgmq.archive('smart_columns', queued.msg_id);
      continue;
    end if;

    -- Casting the key through the row type keeps its index and preserves large integers.
    key_column := smart_columns.primary_key(source_table);
    execute format(
      'select to_jsonb(source_row) from %1$s as source_row
       where %2$I = (jsonb_populate_record(null::%1$s, $1)).%2$I',
      source_table, key_column
    ) into source using jsonb_build_object(key_column, state.row_id);
    if source is null then
      perform pgmq.delete('smart_columns', queued.msg_id);
      continue;
    end if;

    update smart_columns.row_state as row_state set
      status = 'processing', lease = gen_random_uuid(), message_id = queued.msg_id,
      updated_at = now()
    where row_state.target = state.target and row_state.row_id = state.row_id
    returning row_state.lease into lease;
    message_id := queued.msg_id;
    target := table_name;
    input := (
      select jsonb_object_agg(key, value) from jsonb_each(source)
      where key in (select jsonb_array_elements_text(tables -> table_name))
    );
    fingerprints := state.fingerprints;
    result := state.result;
    return next;
  end loop;
end;
$$;

-- Deletes the claim's message and saves its answers, unless a newer write or claim
-- replaced it. Returns whether it saved them. Outputs that are not columns of the
-- table are skipped with their fingerprints, so they are asked again once they exist.
create or replace function smart_columns.complete(
  claimed uuid, message_id bigint, outputs jsonb, result jsonb, fingerprints jsonb, status text
) returns boolean language plpgsql set search_path = '' set lock_timeout = '5s' as $$
#variable_conflict use_column
declare
  state smart_columns.row_state;
  key_column text;
  identity jsonb;
  source_found boolean;
  existing text[];
  assignments text;
begin
  perform pgmq.delete('smart_columns', complete.message_id);
  select * into state from smart_columns.row_state where lease = claimed;
  if not found then return false; end if;
  key_column := smart_columns.primary_key(state.target);
  identity := jsonb_build_object(key_column, state.row_id);

  -- Lock the source row, then the state row: the same order as a write that queues it.
  execute format(
    'select true from %1$s where %2$I = (jsonb_populate_record(null::%1$s, $1)).%2$I for update',
    state.target, key_column
  ) into source_found using identity;
  perform from smart_columns.row_state where lease = claimed for update;
  if not found or source_found is null then return false; end if;

  select array_agg(attname) into existing from pg_catalog.pg_attribute
  where attrelid = state.target and attnum > 0 and not attisdropped and attname <> key_column;
  select string_agg(format('%1$I = answer.%1$I', name), ', ') into assignments
  from jsonb_object_keys(outputs) as name where name = any(existing);

  if assignments is not null then
    -- The trigger ignores this write, so it does not queue the row again.
    perform set_config('smart_columns.writing', 'on', true);
    execute format(
      'update %1$s as source_row set %3$s from jsonb_populate_record(null::%1$s, $2) as answer
       where source_row.%2$I = (jsonb_populate_record(null::%1$s, $1)).%2$I',
      state.target, key_column, assignments
    ) using identity, outputs;
    perform set_config('smart_columns.writing', '', true);
  end if;

  update smart_columns.row_state set
    status = complete.status, lease = null, error = null, updated_at = now(),
    fingerprints = (
      select coalesce(jsonb_object_agg(key, value), '{}')
      from jsonb_each(complete.fingerprints) where key = any(existing)
    ),
    result = complete.result
  where lease = claimed;
  return true;
end;
$$;

-- Records a failed attempt. The message is retried after 2, 4, 8, then 16 seconds and
-- archived after its fifth read, when the row is marked failed.
create or replace function smart_columns.fail(claimed uuid, message_id bigint, message text)
returns void language plpgsql set search_path = '' as $$
declare
  attempts integer;
begin
  select read_ct into attempts from pgmq.q_smart_columns where msg_id = fail.message_id;
  update smart_columns.row_state set
    status = case when attempts >= 5 then 'failed' else 'pending' end,
    lease = null, error = message, updated_at = now()
  where lease = claimed;
  if not found then
    perform pgmq.delete('smart_columns', fail.message_id);
  elsif attempts >= 5 then
    perform pgmq.archive('smart_columns', fail.message_id);
  else
    perform pgmq.set_vt('smart_columns', fail.message_id, (2 ^ attempts)::integer);
  end if;
end;
$$;

revoke all on all functions in schema smart_columns from public, anon, authenticated;

select cron.schedule('smart-columns-retry', '* * * * *', 'select smart_columns.wake(recover => true)');
