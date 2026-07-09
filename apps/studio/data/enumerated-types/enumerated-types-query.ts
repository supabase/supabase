import pgMeta, { type PGType } from '@supabase/pg-meta'
import { useQuery } from '@tanstack/react-query'

import { executeSql } from '../sql/execute-sql-mutation'
import { enumeratedTypesKeys } from './keys'
import type { components } from '@/data/api'
import type { ResponseError, UseCustomQueryOptions } from '@/types'

export type EnumeratedTypesVariables = {
  projectRef?: string
  connectionString?: string | null
}

export type EnumeratedType = components['schemas']['PostgresType']

export async function getEnumeratedTypes(
  { projectRef, connectionString }: EnumeratedTypesVariables,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')

  const { sql } = pgMeta.types.list()
  const { result } = await executeSql(
    {
      projectRef,
      connectionString,
      sql,
      queryKey: ['types'],
    },
    signal
  )

  return result as PGType[]
}

export type EnumeratedTypesData = Awaited<ReturnType<typeof getEnumeratedTypes>>
export type EnumeratedTypesError = ResponseError

export const useEnumeratedTypesQuery = <TData = EnumeratedTypesData>(
  { projectRef, connectionString }: EnumeratedTypesVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<EnumeratedTypesData, EnumeratedTypesError, TData> = {}
) =>
  useQuery<EnumeratedTypesData, EnumeratedTypesError, TData>({
    queryKey: enumeratedTypesKeys.list(projectRef),
    queryFn: ({ signal }) => getEnumeratedTypes({ projectRef, connectionString }, signal),
    enabled: enabled && typeof projectRef !== 'undefined',
    ...options,
  })
