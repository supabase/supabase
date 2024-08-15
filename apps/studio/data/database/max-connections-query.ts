import { UseQueryOptions } from '@tanstack/react-query'
import { ExecuteSqlData, ExecuteSqlError, useExecuteSqlQuery } from '../sql/execute-sql-query'

export const getMaxConnectionsQuery = () => {
  const sql = /* SQL */ `show max_connections`

  return sql
}

export type MaxConnectionsVariables = {
  projectRef?: string
  connectionString?: string
  table?: string
  schema?: string
}

export type MaxConnectionsData = { maxConnections: number }
export type MaxConnectionsError = ExecuteSqlError

export const useMaxConnectionsQuery = <TData extends MaxConnectionsData = MaxConnectionsData>(
  { projectRef, connectionString }: MaxConnectionsVariables,
  options: UseQueryOptions<ExecuteSqlData, MaxConnectionsError, TData> = {}
) => {
  return useExecuteSqlQuery<TData>(
    {
      projectRef,
      connectionString,
      sql: getMaxConnectionsQuery(),
      queryKey: ['max-connections'],
    },
    {
      select: (data: { result: { max_connections: string }[] }) => {
        const connections = parseInt(data.result[0].max_connections)
        return { maxConnections: connections } as any
      },
      ...options,
    }
  )
}
