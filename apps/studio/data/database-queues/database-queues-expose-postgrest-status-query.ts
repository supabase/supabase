import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import minify from 'pg-minify'

import { executeSql } from 'data/sql/execute-sql-query'
import { ResponseError } from 'types'
import { QUEUES_SCHEMA } from './database-queues-toggle-postgrest-mutation'
import { databaseQueuesKeys } from './keys'

export type DatabaseQueuesVariables = {
  projectRef?: string
  connectionString?: string
}

// [Joshen] Check if all the relevant functions exist to indicate whether PGMQ has been exposed through PostgREST
const queueSqlQuery = minify(/**SQL */ `
  SELECT exists (select schema_name FROM information_schema.schemata WHERE schema_name = '${QUEUES_SCHEMA}');
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
  return result[0].exists as boolean
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
