import pgMeta, { type PGMaterializedView } from '@supabase/pg-meta'
import { useQuery } from '@tanstack/react-query'

import { executeSql } from '../sql/execute-sql-mutation'
import { materializedViewKeys } from './keys'
import type { ResponseError, UseCustomQueryOptions } from '@/types'

export type MaterializedViewsVariables = {
  projectRef?: string
  connectionString?: string | null
  schemas?: string[]
}

export async function getMaterializedViews(
  { projectRef, connectionString, schemas }: MaterializedViewsVariables,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')

  const { sql } = pgMeta.materializedViews.list({ includedSchemas: schemas })

  const { result } = await executeSql(
    {
      projectRef,
      connectionString,
      sql,
      queryKey: ['materialized-views', schemas].filter(Boolean),
    },
    signal
  )

  return result as PGMaterializedView[]
}

export type MaterializedViewsData = Awaited<ReturnType<typeof getMaterializedViews>>
export type MaterializedViewsError = ResponseError

export const useMaterializedViewsQuery = <TData = MaterializedViewsData>(
  { projectRef, connectionString, schemas }: MaterializedViewsVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<MaterializedViewsData, MaterializedViewsError, TData> = {}
) =>
  useQuery<MaterializedViewsData, MaterializedViewsError, TData>({
    queryKey: schemas
      ? materializedViewKeys.listBySchema(projectRef, schemas)
      : materializedViewKeys.list(projectRef),
    queryFn: ({ signal }) =>
      getMaterializedViews({ projectRef, connectionString, schemas }, signal),
    enabled: enabled && typeof projectRef !== 'undefined',
    staleTime: 0,
    ...options,
  })
