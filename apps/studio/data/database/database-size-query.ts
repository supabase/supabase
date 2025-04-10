import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { executeSql, ExecuteSqlError } from '../sql/execute-sql-query'
import { databaseKeys } from './keys'

export const getDatabaseSizeSql = () => {
  const sql = /* SQL */ `
select sum(pg_database_size(pg_database.datname))::bigint as db_size from pg_database;
`.trim()

  return sql
}

export type DatabaseSizeVariables = {
  projectRef?: string
  connectionString?: string
}

export async function getDatabaseSize(
  { projectRef, connectionString }: DatabaseSizeVariables,
  signal?: AbortSignal
) {
  const sql = getDatabaseSizeSql()

  const { result } = await executeSql(
    {
      projectRef,
      connectionString,
      sql,
      queryKey: ['database-size'],
    },
    signal
  )

  const dbSize = result?.[0]?.db_size
  if (typeof dbSize !== 'number') {
    throw new Error('Error fetching dbSize')
  }

  return dbSize
}

export type DatabaseSizeData = Awaited<ReturnType<typeof getDatabaseSize>>
export type DatabaseSizeError = ExecuteSqlError

export const useDatabaseSizeQuery = <TData = DatabaseSizeData>(
  { projectRef, connectionString }: DatabaseSizeVariables,
  { enabled = true, ...options }: UseQueryOptions<DatabaseSizeData, DatabaseSizeError, TData> = {}
) =>
  useQuery<DatabaseSizeData, DatabaseSizeError, TData>(
    databaseKeys.databaseSize(projectRef),
    ({ signal }) => getDatabaseSize({ projectRef, connectionString }, signal),
    {
      enabled: enabled && typeof projectRef !== 'undefined',
      ...options,
    }
  )
