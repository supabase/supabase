import { getMigrationsFallback, getMigrationsSql, withCatalogFallback } from '@supabase/pg-meta'
import { useQuery } from '@tanstack/react-query'

import { databaseKeys } from './keys'
import { unguarded } from '@/data/fetchers'
import { catalogFallbackQuery } from '@/data/sql/catalog-fallback-query'
import { executeSql } from '@/data/sql/execute-sql-mutation'
import { PROJECT_STATUS } from '@/lib/constants'
import type { StudioError } from '@/lib/errors/studio-errors'
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
  const variables = {
    projectRef,
    connectionString,
    queryName: 'migrations',
    queryKey: ['migrations'],
    grant: unguarded.migrating,
  }

  try {
    const result = await withCatalogFallback(
      async () => (await executeSql({ ...variables, sqlOrigin: 'studio', sql }, signal)).result,
      () => getMigrationsFallback(catalogFallbackQuery(variables, signal))
    )

    return result as DatabaseMigration[]
  } catch (error) {
    if (
      (error as StudioError).message.includes(
        'relation "supabase_migrations.schema_migrations" does not exist'
      )
    ) {
      return []
    }

    throw error
  }
}

export type MigrationsData = Awaited<ReturnType<typeof getMigrations>>
export type MigrationsError = StudioError

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
