import { getMigrationsSql } from '@supabase/pg-meta'
import { useQuery } from '@tanstack/react-query'

import { databaseKeys } from './keys'
import { executeSql, ExecuteSqlError } from '@/data/sql/execute-sql-query'
import { PROJECT_STATUS } from '@/lib/constants'
import { UseCustomQueryOptions } from '@/types'

export type DatabaseMigration = {
  version: string
  name?: string
  statements?: string[]
}

export type MigrationsVariables = {
  projectRef?: string
  projectStatus?: string
  connectionString?: string | null
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
  { projectRef, projectStatus, connectionString }: MigrationsVariables,
  { enabled = true, ...options }: UseCustomQueryOptions<MigrationsData, MigrationsError, TData> = {}
) =>
  useQuery<MigrationsData, MigrationsError, TData>({
    queryKey: databaseKeys.migrations(projectRef),
    queryFn: ({ signal }) => getMigrations({ projectRef, connectionString }, signal),
    enabled:
      enabled && typeof projectRef !== 'undefined' && projectStatus !== PROJECT_STATUS.COMING_UP,
    ...options,
  })
