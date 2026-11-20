import pgMeta, { listTypesFallback, type PGType } from '@supabase/pg-meta'
import { useQuery } from '@tanstack/react-query'

import { executeSqlWithCatalogFallback } from '../sql/catalog-fallback-query'
import { enumeratedTypesKeys } from './keys'
import type { components } from '@/data/api'
import { unguarded } from '@/data/fetchers'
import type { StudioError } from '@/lib/errors/studio-errors'
import type { UseCustomQueryOptions } from '@/types'

export type EnumeratedTypesVariables = {
  projectRef?: string
  connectionString?: string | null
  schemas?: string[]
}

export type EnumeratedType = components['schemas']['PostgresType']

export async function getEnumeratedTypes(
  { projectRef, connectionString, schemas }: EnumeratedTypesVariables,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')

  const { sql } = pgMeta.types.list({ includedSchemas: schemas })
  const { result } = await executeSqlWithCatalogFallback(
    {
      projectRef,
      connectionString,
      sqlOrigin: 'studio',
      queryName: 'types',
      sql,
      queryKey: ['types'],
      grant: unguarded.migrating,
    },
    (query) => listTypesFallback(query, { includedSchemas: schemas }),
    signal
  )

  return result as PGType[]
}

export type EnumeratedTypesData = Awaited<ReturnType<typeof getEnumeratedTypes>>
export type EnumeratedTypesError = StudioError

export const useEnumeratedTypesQuery = <TData = EnumeratedTypesData>(
  { projectRef, connectionString, schemas }: EnumeratedTypesVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<EnumeratedTypesData, EnumeratedTypesError, TData> = {}
) =>
  useQuery<EnumeratedTypesData, EnumeratedTypesError, TData>({
    queryKey: enumeratedTypesKeys.list(projectRef, schemas),
    queryFn: ({ signal }) => getEnumeratedTypes({ projectRef, connectionString, schemas }, signal),
    enabled: enabled && typeof projectRef !== 'undefined',
    ...options,
  })
