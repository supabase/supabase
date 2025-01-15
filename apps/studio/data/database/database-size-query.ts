import { createQuery } from 'react-query-kit'
import { executeSql, ExecuteSqlError } from '../sql/execute-sql-query'

export const getDatabaseSizeSql = () => {
  const sql = /* SQL */ `
select sum(pg_database_size(pg_database.datname))::bigint as db_size from pg_database;
`.trim()

  return sql
}

export type DatabaseSizeVariables = {
  projectRef: string
  connectionString?: string
}

export async function getDatabaseSize(
  { projectRef, connectionString }: DatabaseSizeVariables,
  { signal }: { signal: AbortSignal }
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

export const useDatabaseSizeQuery = createQuery<
  DatabaseSizeData,
  DatabaseSizeVariables,
  ExecuteSqlError
>({
  queryKey: ['database-size'],
  fetcher: getDatabaseSize,
})
