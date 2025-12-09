import { useQuery } from '@tanstack/react-query'

import { DEFAULT_PLATFORM_APPLICATION_NAME } from '@supabase/pg-meta/src/constants'
import { PostgresMaterializedView } from '@supabase/postgres-meta'
import { get, handleError } from 'data/fetchers'
import type { ResponseError, UseCustomQueryOptions } from 'types'
import { materializedViewKeys } from './keys'

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

  let headers = new Headers()
  if (connectionString) headers.set('x-connection-encrypted', connectionString)

  const { data, error } = await get('/platform/pg-meta/{ref}/materialized-views', {
    params: {
      header: {
        'x-connection-encrypted': connectionString!,
        'x-pg-application-name': DEFAULT_PLATFORM_APPLICATION_NAME,
      },
      path: { ref: projectRef },
      query: {
        included_schemas: schema || '',
        include_columns: true,
      } as any,
    },
    headers,
    signal,
  })

  if (error) handleError(error)
  return data as PostgresMaterializedView[]
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
