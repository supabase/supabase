import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { executeSql } from 'data/sql/execute-sql-query'
import { ResponseError } from 'types'
import { databaseQueuesKeys } from './keys'

export type DatabaseQueuesVariables = {
  projectRef?: string
  connectionString?: string
}

export type PostgresQueue = {
  queue_name: string
  is_partitioned: boolean
  is_unlogged: boolean
  created_at: string
}

const queueSqlQuery = `select * from pgmq.list_queues();`

export async function getDatabaseQueues({ projectRef, connectionString }: DatabaseQueuesVariables) {
  if (!projectRef) throw new Error('Project ref is required')

  const { result } = await executeSql({
    projectRef,
    connectionString,
    sql: queueSqlQuery,
  })
  return result
}

export type DatabaseQueueData = PostgresQueue[]
export type DatabaseQueueError = ResponseError

export const useQueuesQuery = <TData = DatabaseQueueData>(
  { projectRef, connectionString }: DatabaseQueuesVariables,
  { enabled = true, ...options }: UseQueryOptions<DatabaseQueueData, DatabaseQueueError, TData> = {}
) =>
  useQuery<DatabaseQueueData, DatabaseQueueError, TData>(
    databaseQueuesKeys.list(projectRef),
    () => getDatabaseQueues({ projectRef, connectionString }),
    {
      enabled: enabled && typeof projectRef !== 'undefined',
      ...options,
    }
  )
