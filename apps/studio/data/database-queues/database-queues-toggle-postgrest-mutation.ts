import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import minify from 'pg-minify'

import { executeSql } from 'data/sql/execute-sql-query'
import type { ResponseError } from 'types'
import { databaseQueuesKeys } from './keys'

export type DatabaseQueueExposePostgrestVariables = {
  projectRef: string
  connectionString?: string
  enable: boolean
}

const EXPOSE_QUEUES_TO_POSTGREST_SQL = minify(/* SQL */ `
create or replace function public.pop(queue_name text)
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

comment on function public.pop(queue_name text) is 'Retrieves and locks the next message from the specified queue.';

create or replace function public.send(
  queue_name text,
  msg jsonb,
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
      msg := msg,
      delay := sleep_seconds
    );
end;
$$;

comment on function public.send(queue_name text, msg jsonb, sleep_seconds integer) is 'Sends a message to the specified queue, optionally delaying its availability by a number of seconds.';

create or replace function public.send(
    queue_name text,
    msg jsonb,
    available_at timestamp with time zone  -- renamed from 'delay'
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
        msg := msg,
        delay := available_at
    );
end;
$$;

comment on function public.send(queue_name text, msg jsonb, available_at timestamp with time zone) is 'Sends a message to the specified queue, making it available at the specified timestamp.';

create or replace function public.send_batch(
    queue_name text,
    msgs jsonb[],
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
        msgs := msgs,
        delay := sleep_seconds
    );
end;
$$;

comment on function public.send_batch(queue_name text, msgs jsonb[], sleep_seconds integer) is 'Sends a batch of messages to the specified queue, optionally delaying their availability by a number of seconds.';

create or replace function public.send_batch(
    queue_name text,
    msgs jsonb[],
    available_at timestamp with time zone  -- renamed from 'delay'
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
        msgs := msgs,
        delay := available_at
    );
end;
$$;

comment on function public.send_batch(queue_name text, msgs jsonb[], available_at timestamp with time zone) is 'Sends a batch of messages to the specified queue, making them available at the specified timestamp.';

create or replace function public.archive(
    queue_name text,
    msg_id bigint
)
  returns boolean
  language plpgsql
  set search_path = ''
as $$
begin
    return
    pgmq.archive(
        queue_name := queue_name,
        msg_id := msg_id
    );
end;
$$;

comment on function public.archive(queue_name text, msg_id bigint) is 'Archives a message by moving it from the queue to a permanent archive.';

create or replace function public.archive(
    queue_name text,
    msg_id bigint
)
  returns boolean
  language plpgsql
  set search_path = ''
as $$
begin
    return
    pgmq.archive(
        queue_name := queue_name,
        msg_id := msg_id
    );
end;
$$;

comment on function public.archive(queue_name text, msg_id bigint) is 'Archives a message by moving it from the queue to a permanent archive.';

create or replace function public.delete(
    queue_name text,
    msg_id bigint
)
  returns boolean
  language plpgsql
  set search_path = ''
as $$
begin
    return
    pgmq.delete(
        queue_name := queue_name,
        msg_id := msg_id
    );
end;
$$;

comment on function public.delete(queue_name text, msg_id bigint) is 'Permanently deletes a message from the specified queue.';

create or replace function public.read(
    queue_name text,
    sleep_seconds integer,
    qty integer
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

comment on function public.read(queue_name text, sleep_seconds integer, qty integer) is 'Reads up to "n" messages from the specified queue with an optional "sleep_seconds" (visibility timeout) and conditional filtering.';

-- Grant usage on schemas to roles
grant usage on schema public to service_role, anon, authenticated;
grant usage on schema pgmq to service_role, anon, authenticated;

-- Grant execute permissions on wrapper functions to roles
grant execute on function public.pop(text) to service_role, anon, authenticated;
grant execute on function public.send(text, jsonb, integer) to service_role, anon, authenticated;
grant execute on function public.send(text, jsonb, timestamp with time zone) to service_role, anon, authenticated;
grant execute on function public.send_batch(text, jsonb[], integer) to service_role, anon, authenticated;
grant execute on function public.send_batch(text, jsonb[], timestamp with time zone) to service_role, anon, authenticated;
grant execute on function public.archive(text, bigint) to service_role, anon, authenticated;
grant execute on function public.delete(text, bigint) to service_role, anon, authenticated;
grant execute on function public.read(text, integer, integer) to service_role, anon, authenticated;

-- Grant execute permissions on inner pgmq functions to roles
grant execute on function pgmq.pop(text) to service_role, anon, authenticated;
grant execute on function pgmq.send(text, jsonb, integer) to service_role, anon, authenticated;
-- grant execute on function pgmq.send(payload jsonb, text, text, boolean) to service_role, anon, authenticated;
grant execute on function pgmq.send_batch(text, jsonb[], integer) to service_role, anon, authenticated;
-- grant execute on function pgmq.send_batch(text, jsonb[], timestamp with time zone) to service_role, anon, authenticated;
grant execute on function pgmq.archive(text, bigint) to service_role, anon, authenticated;
grant execute on function pgmq.delete(text, bigint) to service_role, anon, authenticated;
grant execute on function pgmq.read(text, integer, integer) to service_role, anon, authenticated;

-- For the service role, we want full access
-- Grant permissions on existing tables
grant all privileges on all tables in schema pgmq to service_role;

-- Ensure service_role has permissions on future tables
alter default privileges in schema pgmq grant all privileges on tables to service_role;
`)

const HIDE_QUEUES_FROM_POSTGREST_SQL = minify(/* SQL */ `
  drop function if exists 
    public.pop(queue_name text),
    public.send(queue_name text, msg jsonb, sleep_seconds integer),
    public.send(queue_name text, msg jsonb, available_at timestamp with time zone),
    public.send_batch(queue_name text, msgs jsonb[], sleep_seconds integer),
    public.send_batch(queue_name text, msgs jsonb[], available_at timestamp with time zone),
    public.archive(queue_name text, msg_id bigint),
    public.delete(queue_name text, msg_id bigint),
    public.read(queue_name text, sleep integer, qty integer)
  ;

  -- Revoke execute permissions on inner pgmq functions to roles
  revoke execute on function pgmq.pop(text) from service_role, anon, authenticated;
  revoke execute on function pgmq.send(text, jsonb, integer) from service_role, anon, authenticated;
  -- revoke execute on function pgmq.send(payload jsonb, text, text, boolean) from service_role, anon, authenticated;
  revoke execute on function pgmq.send_batch(text, jsonb[], integer) from service_role, anon, authenticated;
  -- revoke execute on function pgmq.send_batch(text, jsonb[], timestamp with time zone) from service_role, anon, authenticated;
  revoke execute on function pgmq.archive(text, bigint) from service_role, anon, authenticated;
  revoke execute on function pgmq.delete(text, bigint) from service_role, anon, authenticated;
  revoke execute on function pgmq.read(text, integer, integer) from service_role, anon, authenticated;

  -- For service role, revoke permissions on existing tables
  revoke all privileges on all tables in schema pgmq from service_role;

  -- Ensure service_role has no permissions on future tables
  alter default privileges in schema pgmq revoke all privileges on tables from service_role;
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
