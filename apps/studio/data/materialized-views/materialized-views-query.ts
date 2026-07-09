import pgMeta, { type PGMaterializedView } from '@supabase/pg-meta'
import { useQuery } from '@tanstack/react-query'

import { executeSql } from '../sql/execute-sql-mutation'
import { materializedViewKeys } from './keys'
import type { ResponseError, UseCustomQueryOptions } from '@/types'

export type MaterializedViewsVariables = {
  projectRef?: string
  connectionString?: string | null
  schema?: string
}

export async function getMaterializedViews(
  { projectRef, connectionString, schema }: MaterializedViewsVariables,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')

  const { sql } = pgMeta.materializedViews.list({ includedSchemas: schema ? [schema] : undefined })

  const { result } = await executeSql(
    {
      projectRef,
      connectionString,
      sql,
      queryKey: ['materialized-views', schema].filter(Boolean),
    },
    signal
  )

  return result as PGMaterializedView[]
}

export type MaterializedViewsData = Awaited<ReturnType<typeof getMaterializedViews>>
export type MaterializedViewsError = ResponseError

export const useMaterializedViewsQuery = <TData = MaterializedViewsData>(
  { projectRef, connectionString, schema }: MaterializedViewsVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<MaterializedViewsData, MaterializedViewsError, TData> = {}
) =>
  useQuery<MaterializedViewsData, MaterializedViewsError, TData>({
    queryKey: schema
      ? materializedViewKeys.listBySchema(projectRef, schema)
      : materializedViewKeys.list(projectRef),
    queryFn: ({ signal }) => getMaterializedViews({ projectRef, connectionString, schema }, signal),
    enabled: enabled && typeof projectRef !== 'undefined',
    staleTime: 0,
    ...options,
  })
