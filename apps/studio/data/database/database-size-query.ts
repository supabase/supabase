import { UseQueryOptions } from '@tanstack/react-query'
import { ExecuteSqlData, ExecuteSqlError, useExecuteSqlQuery } from '../sql/execute-sql-query'

export const getDatabaseSizeQuery = () => {
  const sql = /* SQL */ `
select sum(pg_database_size(pg_database.datname))::bigint as db_size from pg_database;
`.trim()

  return sql
}

export type DatabaseSizeVariables = {
  projectRef?: string
  connectionString?: string
}

export type DatabaseSizeData = { result: { db_size: number }[] }
export type DatabaseSizeError = ExecuteSqlError

export const useDatabaseSizeQuery = <TData extends DatabaseSizeData = DatabaseSizeData>(
  { projectRef, connectionString }: DatabaseSizeVariables,
  options: UseQueryOptions<ExecuteSqlData, DatabaseSizeError, TData> = {}
) => {
  return useExecuteSqlQuery(
    {
      projectRef,
      connectionString,
      sql: getDatabaseSizeQuery(),
      queryKey: ['database-size'],
    },
    {
      ...options,
      staleTime: 1000 * 60, // default good for a minute
    }
  )
}
