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
    qty integer,
    conditional jsonb
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
        qty := n,
        conditional := conditional
    );
end;
$$;

comment on function public.read(queue_name text, sleep_seconds integer, qty integer, conditional jsonb) is 'Reads up to "n" messages from the specified queue with an optional "sleep_seconds" (visibility timeout) and conditional filtering.';
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
    public.read(queue_name text, sleep integer, qty integer, conditional jsonb)
  ;
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
