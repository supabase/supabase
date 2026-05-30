import { getQueuesExposePostgrestStatusSQL } from '@supabase/pg-meta'
import { useQuery } from '@tanstack/react-query'

import { databaseQueuesKeys } from './keys'
import { executeSql } from '@/data/sql/execute-sql-query'
import type { ResponseError, UseCustomQueryOptions } from '@/types'

export type DatabaseQueuesVariables = {
  projectRef?: string
  connectionString?: string | null
}

export async function getDatabaseQueuesExposePostgrestStatus({
  projectRef,
  connectionString,
}: DatabaseQueuesVariables) {
  if (!projectRef) throw new Error('Project ref is required')

  const sql = getQueuesExposePostgrestStatusSQL()
  const { result } = await executeSql({
    projectRef,
    connectionString,
    sql,
  })
  return result[0].exists as boolean
}

export type DatabaseQueueData = boolean
export type DatabaseQueueError = ResponseError

export const useQueuesExposePostgrestStatusQuery = <TData = DatabaseQueueData>(
  { projectRef, connectionString }: DatabaseQueuesVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<DatabaseQueueData, DatabaseQueueError, TData> = {}
) =>
  useQuery<DatabaseQueueData, DatabaseQueueError, TData>({
    queryKey: databaseQueuesKeys.exposePostgrestStatus(projectRef),
    queryFn: () => getDatabaseQueuesExposePostgrestStatus({ projectRef, connectionString }),
    enabled: enabled && typeof projectRef !== 'undefined',
    ...options,
  })
