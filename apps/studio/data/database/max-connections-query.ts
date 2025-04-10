import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { executeSql, ExecuteSqlError } from '../sql/execute-sql-query'
import { databaseKeys } from './keys'

export const getMaxConnectionsSql = () => {
  const sql = /* SQL */ `show max_connections`

  return sql
}

export type MaxConnectionsVariables = {
  projectRef?: string
  connectionString?: string
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
  }: UseQueryOptions<MaxConnectionsData, MaxConnectionsError, TData> = {}
) =>
  useQuery<MaxConnectionsData, MaxConnectionsError, TData>(
    databaseKeys.maxConnections(projectRef),
    ({ signal }) => getMaxConnections({ projectRef, connectionString }, signal),
    {
      enabled: enabled && typeof projectRef !== 'undefined',
      ...options,
    }
  )
