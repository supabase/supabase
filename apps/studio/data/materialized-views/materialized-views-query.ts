import { UseQueryOptions, useQuery } from '@tanstack/react-query'

import { PostgresMaterializedView } from '@supabase/postgres-meta'
import { get, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
import { materializedViewKeys } from './keys'
import { DEFAULT_PLATFORM_APPLICATION_NAME } from '@supabase/pg-meta/src/constants'

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
  }: UseQueryOptions<MaterializedViewsData, MaterializedViewsError, TData> = {}
) =>
  useQuery<MaterializedViewsData, MaterializedViewsError, TData>(
    schema
      ? materializedViewKeys.listBySchema(projectRef, schema)
      : materializedViewKeys.list(projectRef),
    ({ signal }) => getMaterializedViews({ projectRef, connectionString, schema }, signal),
    {
      enabled: enabled && typeof projectRef !== 'undefined',
      // We're using a staleTime of 0 here because the only way to create a
      // materialized view is via SQL, which we don't know about
      staleTime: 0,
      ...options,
    }
  )
