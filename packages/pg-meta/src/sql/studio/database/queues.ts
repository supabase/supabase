export const QUEUES_SCHEMA = 'pgmq_public'

export const HIDE_QUEUES_FROM_POSTGREST_SQL = /* SQL */ `
  drop function if exists 
    ${QUEUES_SCHEMA}.pop(queue_name text),
    ${QUEUES_SCHEMA}.send(queue_name text, message jsonb, sleep_seconds integer),
    ${QUEUES_SCHEMA}.send_batch(queue_name text, message jsonb[], sleep_seconds integer),
    ${QUEUES_SCHEMA}.archive(queue_name text, message_id bigint),
    ${QUEUES_SCHEMA}.delete(queue_name text, message_id bigint),
    ${QUEUES_SCHEMA}.read(queue_name text, sleep integer, n integer)
  ;

  -- Revoke execute permissions on inner pgmq functions to roles (inverse of enabling)
  do $$
  begin
      if exists (select 1 from pg_namespace where nspname = 'pgmq') then
          -- Revoke privileges on the schema itself
          revoke all on schema pgmq from anon, authenticated, service_role;
          
          -- Revoke default privileges for future objects
          alter default privileges in schema pgmq revoke all on tables from anon, authenticated, service_role;
          alter default privileges in schema pgmq revoke all on sequences from anon, authenticated, service_role;
          alter default privileges in schema pgmq revoke all on functions from anon, authenticated, service_role;
      end if;
  end $$;

  drop schema if exists ${QUEUES_SCHEMA};
`

export const getExposeQueuesSQL = ({ isNewerPgmqversion }: { isNewerPgmqversion: boolean }) => {
  const conditionalJsonb = isNewerPgmqversion ? `, conditional := '{}'::jsonb` : ''
  const jsonBArg = isNewerPgmqversion ? `, jsonb` : ''

  return /* SQL */ `
  create schema if not exists ${QUEUES_SCHEMA};
  grant usage on schema ${QUEUES_SCHEMA} to postgres, anon, authenticated, service_role;

  create or replace function ${QUEUES_SCHEMA}.pop(
      queue_name text
  )
    returns setof pgmq.message_record
    language plpgsql
    set search_path = ''
  as $$
  begin
      return query
      select *
      from pgmq.pop(
          queue_name := queue_name
      );
  end;
  $$;

  comment on function ${QUEUES_SCHEMA}.pop(queue_name text) is 'Retrieves and locks the next message from the specified queue.';


  create or replace function ${QUEUES_SCHEMA}.send(
      queue_name text,
      message jsonb,
      sleep_seconds integer default 0  -- renamed from 'delay'
  )
    returns setof bigint
    language plpgsql
    set search_path = ''
  as $$
  begin
      return query
      select *
      from pgmq.send(
          queue_name := queue_name,
          msg := message,
          delay := sleep_seconds
      );
  end;
  $$;

  comment on function ${QUEUES_SCHEMA}.send(queue_name text, message jsonb, sleep_seconds integer) is 'Sends a message to the specified queue, optionally delaying its availability by a number of seconds.';


  create or replace function ${QUEUES_SCHEMA}.send_batch(
      queue_name text,
      messages jsonb[],
      sleep_seconds integer default 0  -- renamed from 'delay'
  )
    returns setof bigint
    language plpgsql
    set search_path = ''
  as $$
  begin
      return query
      select *
      from pgmq.send_batch(
          queue_name := queue_name,
          msgs := messages,
          delay := sleep_seconds
      );
  end;
  $$;

  comment on function ${QUEUES_SCHEMA}.send_batch(queue_name text, messages jsonb[], sleep_seconds integer) is 'Sends a batch of messages to the specified queue, optionally delaying their availability by a number of seconds.';


  create or replace function ${QUEUES_SCHEMA}.archive(
      queue_name text,
      message_id bigint
  )
    returns boolean
    language plpgsql
    set search_path = ''
  as $$
  begin
      return
      pgmq.archive(
          queue_name := queue_name,
          msg_id := message_id
      );
  end;
  $$;

  comment on function ${QUEUES_SCHEMA}.archive(queue_name text, message_id bigint) is 'Archives a message by moving it from the queue to a permanent archive.';


  create or replace function ${QUEUES_SCHEMA}.delete(
      queue_name text,
      message_id bigint
  )
    returns boolean
    language plpgsql
    set search_path = ''
  as $$
  begin
      return
      pgmq.delete(
          queue_name := queue_name,
          msg_id := message_id
      );
  end;
  $$;

  comment on function ${QUEUES_SCHEMA}.delete(queue_name text, message_id bigint) is 'Permanently deletes a message from the specified queue.';

  create or replace function ${QUEUES_SCHEMA}.read(
      queue_name text,
      sleep_seconds integer,
      n integer
  )
    returns setof pgmq.message_record
    language plpgsql
    set search_path = ''
  as $$
  begin
      return query
      select *
      from pgmq.read(
          queue_name := queue_name,
          vt := sleep_seconds,
          qty := n ${conditionalJsonb}
      );
  end;
  $$;

  comment on function ${QUEUES_SCHEMA}.read(queue_name text, sleep_seconds integer, n integer) is 'Reads up to "n" messages from the specified queue with an optional "sleep_seconds" (visibility timeout).';

  -- Grant execute permissions on wrapper functions to roles
  grant execute on function ${QUEUES_SCHEMA}.pop(text) to postgres, service_role, anon, authenticated;
  grant execute on function pgmq.pop(text) to postgres, service_role, anon, authenticated;

  grant execute on function ${QUEUES_SCHEMA}.send(text, jsonb, integer) to postgres, service_role, anon, authenticated;
  grant execute on function pgmq.send(text, jsonb, integer) to postgres, service_role, anon, authenticated;

  grant execute on function ${QUEUES_SCHEMA}.send_batch(text, jsonb[], integer) to postgres, service_role, anon, authenticated;
  grant execute on function pgmq.send_batch(text, jsonb[], integer) to postgres, service_role, anon, authenticated;

  grant execute on function ${QUEUES_SCHEMA}.archive(text, bigint) to postgres, service_role, anon, authenticated;
  grant execute on function pgmq.archive(text, bigint) to postgres, service_role, anon, authenticated;

  grant execute on function ${QUEUES_SCHEMA}.delete(text, bigint) to postgres, service_role, anon, authenticated;
  grant execute on function pgmq.delete(text, bigint) to postgres, service_role, anon, authenticated;

  grant execute on function ${QUEUES_SCHEMA}.read(text, integer, integer) to postgres, service_role, anon, authenticated;
  grant execute on function pgmq.read(text, integer, integer ${jsonBArg}) to postgres, service_role, anon, authenticated;

  -- For the service role, we want full access
  -- Grant permissions on existing tables
  grant all privileges on all tables in schema pgmq to postgres, service_role;

  -- Ensure service_role has permissions on future tables
  alter default privileges in schema pgmq grant all privileges on tables to postgres, service_role;

  grant usage on schema pgmq to postgres, anon, authenticated, service_role;


  /*
    Grant access to sequences to API roles by default. Existing table permissions
    continue to enforce insert restrictions. This is necessary to accommodate the
    on-backup hook that rebuild queue table primary keys to avoid a pg_dump segfault.
    This can be removed once logical backups are completely retired.
  */
  grant usage, select, update
  on all sequences in schema pgmq
  to anon, authenticated, service_role;

  alter default privileges in schema pgmq
  grant usage, select, update
  on sequences
  to anon, authenticated, service_role;
`.trim()
}

// [Joshen] Check if all the relevant functions exist to indicate whether PGMQ has been exposed through PostgREST
export const getQueuesExposePostgrestStatusSQL = () => {
  return /**SQL */ `
    SELECT exists (select schema_name FROM information_schema.schemata WHERE schema_name = '${QUEUES_SCHEMA}');
  `.trim()
}
