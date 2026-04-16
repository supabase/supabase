import { getMaxConnectionsSql } from '@supabase/pg-meta'
import { useQuery } from '@tanstack/react-query'

import { databaseKeys } from './keys'
import { executeSql, ExecuteSqlError } from '@/data/sql/execute-sql-query'
import { UseCustomQueryOptions } from '@/types'

export type MaxConnectionsVariables = {
  projectRef?: string
  connectionString?: string | null
  table?: string
  schema?: string
}

export async function getMaxConnections(
  { projectRef, connectionString }: MaxConnectionsVariables,
  signal?: AbortSignal
) {
  const sql = getMaxConnectionsSql()

  const { result } = await executeSql(
    { projectRef, connectionString, sql, queryKey: ['max-connections'] },
    signal
  )

  const connections = parseInt(result[0].max_connections)

  return { maxConnections: connections }
}

export type MaxConnectionsData = Awaited<ReturnType<typeof getMaxConnections>>
export type MaxConnectionsError = ExecuteSqlError

export const useMaxConnectionsQuery = <TData = MaxConnectionsData>(
  { projectRef, connectionString }: MaxConnectionsVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<MaxConnectionsData, MaxConnectionsError, TData> = {}
) =>
  useQuery<MaxConnectionsData, MaxConnectionsError, TData>({
    queryKey: databaseKeys.maxConnections(projectRef),
    queryFn: ({ signal }) => getMaxConnections({ projectRef, connectionString }, signal),
    enabled: enabled && typeof projectRef !== 'undefined',
    ...options,
  })
