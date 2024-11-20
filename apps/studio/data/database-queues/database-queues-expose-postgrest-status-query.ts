import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import minify from 'pg-minify'

import { executeSql } from 'data/sql/execute-sql-query'
import { ResponseError } from 'types'
import { databaseQueuesKeys } from './keys'

export type DatabaseQueuesVariables = {
  projectRef?: string
  connectionString?: string
}

// [Joshen] Check if all the relevant functions exist to indicate whether PGMQ has been exposed through PostgREST
const queueSqlQuery = minify(/**SQL */ `
  SELECT (count(*) = 8) as exists
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
  AND (
      (p.proname = 'pop' AND pg_get_function_identity_arguments(p.oid) = 'queue_name text') OR
      (p.proname = 'send' AND pg_get_function_identity_arguments(p.oid) = 'queue_name text, msg jsonb, sleep_seconds integer') OR
      (p.proname = 'send' AND pg_get_function_identity_arguments(p.oid) = 'queue_name text, msg jsonb, available_at timestamp with time zone') OR
      (p.proname = 'send_batch' AND pg_get_function_identity_arguments(p.oid) = 'queue_name text, msgs jsonb[], sleep_seconds integer') OR
      (p.proname = 'send_batch' AND pg_get_function_identity_arguments(p.oid) = 'queue_name text, msgs jsonb[], available_at timestamp with time zone') OR
      (p.proname = 'archive' AND pg_get_function_identity_arguments(p.oid) = 'queue_name text, msg_id bigint') OR
      (p.proname = 'delete' AND pg_get_function_identity_arguments(p.oid) = 'queue_name text, msg_id bigint') OR
      (p.proname = 'read' AND pg_get_function_identity_arguments(p.oid) = 'queue_name text, sleep_seconds integer, qty integer')
  );
`)

export async function getDatabaseQueuesExposePostgrestStatus({
  projectRef,
  connectionString,
}: DatabaseQueuesVariables) {
  if (!projectRef) throw new Error('Project ref is required')

  const { result } = await executeSql({
    projectRef,
    connectionString,
    sql: queueSqlQuery,
  })
  return result[0].exists
}

export type DatabaseQueueData = boolean
export type DatabaseQueueError = ResponseError

export const useQueuesExposePostgrestStatusQuery = <TData = DatabaseQueueData>(
  { projectRef, connectionString }: DatabaseQueuesVariables,
  { enabled = true, ...options }: UseQueryOptions<DatabaseQueueData, DatabaseQueueError, TData> = {}
) =>
  useQuery<DatabaseQueueData, DatabaseQueueError, TData>(
    databaseQueuesKeys.exposePostgrestStatus(projectRef),
    () => getDatabaseQueuesExposePostgrestStatus({ projectRef, connectionString }),
    {
      enabled: enabled && typeof projectRef !== 'undefined',
      ...options,
    }
  )
