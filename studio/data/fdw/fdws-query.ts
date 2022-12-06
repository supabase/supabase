import { UseQueryOptions } from '@tanstack/react-query'
import { ExecuteSqlData, useExecuteSqlPrefetch, useExecuteSqlQuery } from '../sql/execute-sql-query'

export const getFDWsSql = () => {
  const sql = /* SQL */ `
    select
      oid as id,
      srvname as name
    from pg_catalog.pg_foreign_server;
  `

  return sql
}

export type FDW = {
  id: string
  name: string
}

export type FDWsResponse = {
  result: FDW[]
}

export type FDWsVariables = {
  projectRef?: string
  connectionString?: string
}

export type FDWsData = FDWsResponse
export type FDWsError = unknown

export const useFDWsQuery = <TData extends FDWsData = FDWsData>(
  { projectRef, connectionString }: FDWsVariables,
  options: UseQueryOptions<ExecuteSqlData, FDWsError, TData> = {}
) =>
  useExecuteSqlQuery(
    {
      projectRef,
      connectionString,
      sql: getFDWsSql(),
      queryKey: ['fdws'],
    },
    options
  )

export const useFDWsPrefetch = ({ projectRef, connectionString }: FDWsVariables) => {
  return useExecuteSqlPrefetch({
    projectRef,
    connectionString,
    sql: getFDWsSql(),
    queryKey: ['fdws'],
  })
}
