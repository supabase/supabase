import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import minify from 'pg-minify'

import { executeSql } from 'data/sql/execute-sql-query'
import type { ResponseError } from 'types'
import { databaseQueuesKeys } from './keys'
import { databaseKeys } from 'data/database/keys'

export type DatabaseQueueExposePostgrestVariables = {
  projectRef: string
  connectionString?: string
  enable: boolean
}

export const QUEUES_SCHEMA = 'pgmq_public'

const EXPOSE_QUEUES_TO_POSTGREST_SQL = minify(/* SQL */ `
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
        qty := n
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
grant execute on function pgmq.read(text, integer, integer) to postgres, service_role, anon, authenticated;

-- For the service role, we want full access
-- Grant permissions on existing tables
grant all privileges on all tables in schema pgmq to postgres, service_role;

-- Ensure service_role has permissions on future tables
alter default privileges in schema pgmq grant all privileges on tables to postgres, service_role;

grant usage on schema pgmq to postgres, anon, authenticated, service_role;
`)

const HIDE_QUEUES_FROM_POSTGREST_SQL = minify(/* SQL */ `
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
`)

export async function toggleQueuesExposurePostgrest({
  projectRef,
  connectionString,
  enable,
}: DatabaseQueueExposePostgrestVariables) {
  const sql = enable ? EXPOSE_QUEUES_TO_POSTGREST_SQL : HIDE_QUEUES_FROM_POSTGREST_SQL

  const { result } = await executeSql({
    projectRef,
    connectionString,
    sql,
    queryKey: ['toggle-queues-exposure'],
  })

  return result
}

type DatabaseQueueExposePostgrestData = Awaited<ReturnType<typeof toggleQueuesExposurePostgrest>>

export const useDatabaseQueueToggleExposeMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<
    DatabaseQueueExposePostgrestData,
    ResponseError,
    DatabaseQueueExposePostgrestVariables
  >,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<
    DatabaseQueueExposePostgrestData,
    ResponseError,
    DatabaseQueueExposePostgrestVariables
  >((vars) => toggleQueuesExposurePostgrest(vars), {
    async onSuccess(data, variables, context) {
      const { projectRef } = variables
      await queryClient.invalidateQueries(databaseQueuesKeys.exposePostgrestStatus(projectRef))
      // [Joshen] Schemas can be invalidated without waiting
      queryClient.invalidateQueries(databaseKeys.schemas(projectRef))
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to toggle queue exposure via PostgREST: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
