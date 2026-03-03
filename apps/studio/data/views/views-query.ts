import { useQuery } from '@tanstack/react-query'

import { DEFAULT_PLATFORM_APPLICATION_NAME } from '@supabase/pg-meta/src/constants'
import { PostgresView } from '@supabase/postgres-meta'
import { get, handleError } from 'data/fetchers'
import type { ResponseError, UseCustomQueryOptions } from 'types'
import { viewKeys } from './keys'

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

  let headers = new Headers()
  if (connectionString) headers.set('x-connection-encrypted', connectionString)

  const { data, error } = await get('/platform/pg-meta/{ref}/views', {
    params: {
      header: {
        'x-connection-encrypted': connectionString!,
        'x-pg-application-name': DEFAULT_PLATFORM_APPLICATION_NAME,
      },
      path: { ref: projectRef },
      query: {
        included_schemas: schema || '',
      } as any,
    },
    headers,
    signal,
  })

  if (error) handleError(error)
  return data as PostgresView[]
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
