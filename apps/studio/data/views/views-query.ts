import pgMeta, { type PGView } from '@supabase/pg-meta'
import { useQuery } from '@tanstack/react-query'

import { executeSql } from '../sql/execute-sql-mutation'
import { viewKeys } from './keys'
import type { ResponseError, UseCustomQueryOptions } from '@/types'

export type ViewsVariables = {
  projectRef?: string
  connectionString?: string | null
  schema?: string
}

export async function getViews(
  { projectRef, connectionString, schema }: ViewsVariables,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')

  const { sql } = pgMeta.views.list({ includedSchemas: schema ? [schema] : undefined })
  const { result } = await executeSql(
    {
      projectRef,
      connectionString,
      sql,
      queryKey: ['views', schema].filter(Boolean),
    },
    signal
  )

  return result as PGView[]
}

export type ViewsData = Awaited<ReturnType<typeof getViews>>
export type ViewsError = ResponseError

export const useViewsQuery = <TData = ViewsData>(
  { projectRef, connectionString, schema }: ViewsVariables,
  { enabled = true, ...options }: UseCustomQueryOptions<ViewsData, ViewsError, TData> = {}
) =>
  useQuery<ViewsData, ViewsError, TData>({
    queryKey: schema ? viewKeys.listBySchema(projectRef, schema) : viewKeys.list(projectRef),
    queryFn: ({ signal }) => getViews({ projectRef, connectionString, schema }, signal),
    enabled: enabled && typeof projectRef !== 'undefined',
    staleTime: 0,
    ...options,
  })
