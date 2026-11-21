import pgMeta, { listForeignTablesFallback } from '@supabase/pg-meta'
import type { PGForeignTable } from '@supabase/pg-meta'
import { useQuery } from '@tanstack/react-query'

import { foreignTableKeys } from './keys'
import { unguarded } from '@/data/fetchers'
import { executeSqlWithCatalogFallback } from '@/data/sql/catalog-fallback-query'
import type { StudioError } from '@/lib/errors/studio-errors'
import type { UseCustomQueryOptions } from '@/types'

export type ForeignTablesVariables = {
  projectRef?: string
  connectionString?: string | null
  schemas?: string[]
}

export async function getForeignTables(
  { projectRef, connectionString, schemas }: ForeignTablesVariables,
  signal?: AbortSignal
) {
  const { result } = await executeSqlWithCatalogFallback(
    {
      projectRef,
      connectionString,
      sqlOrigin: 'studio',
      queryName: 'foreign-tables',
      sql: pgMeta.foreignTables.list({ includedSchemas: schemas }).sql,
      queryKey: ['foreign-tables', schemas].filter(Boolean),
      grant: unguarded.migrating,
    },
    (query) => listForeignTablesFallback(query, { includedSchemas: schemas }),
    signal
  )

  return result as PGForeignTable[]
}

export type ForeignTablesData = Awaited<ReturnType<typeof getForeignTables>>
export type ForeignTablesError = StudioError

export const useForeignTablesQuery = <TData = ForeignTablesData>(
  { projectRef, connectionString, schemas }: ForeignTablesVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<ForeignTablesData, ForeignTablesError, TData> = {}
) =>
  useQuery<ForeignTablesData, ForeignTablesError, TData>({
    queryKey: schemas
      ? foreignTableKeys.listBySchema(projectRef, schemas)
      : foreignTableKeys.list(projectRef),
    queryFn: ({ signal }) => getForeignTables({ projectRef, connectionString, schemas }, signal),
    enabled: enabled && typeof projectRef !== 'undefined',
    ...options,
  })
