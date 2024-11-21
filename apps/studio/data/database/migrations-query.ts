import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { executeSql, ExecuteSqlError } from '../sql/execute-sql-query'
import { databaseKeys } from './keys'

export type DatabaseMigration = {
  version: string
  name?: string
  statements?: string[]
}

export const getMigrationsSql = () => {
  const sql = /* SQL */ `
    select
      *
    from supabase_migrations.schema_migrations sm
    order by sm.version desc
  `.trim()

  return sql
}

export type MigrationsVariables = {
  projectRef?: string
  connectionString?: string
}

export async function getMigrations(
  { projectRef, connectionString }: MigrationsVariables,
  signal?: AbortSignal
) {
  const sql = getMigrationsSql()

  try {
    const { result } = await executeSql(
      { projectRef, connectionString, sql, queryKey: ['migrations'] },
      signal
    )

    return result as DatabaseMigration[]
  } catch (error) {
    if (
      (error as ExecuteSqlError).message.includes(
        'relation "supabase_migrations.schema_migrations" does not exist'
      )
    ) {
      return []
    }

    throw error
  }
}

export type MigrationsData = Awaited<ReturnType<typeof getMigrations>>
export type MigrationsError = ExecuteSqlError

export const useMigrationsQuery = <TData = MigrationsData>(
  { projectRef, connectionString }: MigrationsVariables,
  { enabled = true, ...options }: UseQueryOptions<MigrationsData, MigrationsError, TData> = {}
) =>
  useQuery<MigrationsData, MigrationsError, TData>(
    databaseKeys.migrations(projectRef),
    ({ signal }) => getMigrations({ projectRef, connectionString }, signal),
    {
      enabled: enabled && typeof projectRef !== 'undefined',
      ...options,
    }
  )
