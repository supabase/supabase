import { UseQueryOptions, useQuery } from '@tanstack/react-query'

import { PostgresView } from '@supabase/postgres-meta'
import { get, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
import { viewKeys } from './keys'

export type ViewsVariables = {
  projectRef?: string
  connectionString?: string
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
      header: { 'x-connection-encrypted': connectionString! },
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
  { enabled = true, ...options }: UseQueryOptions<ViewsData, ViewsError, TData> = {}
) =>
  useQuery<ViewsData, ViewsError, TData>(
    schema ? viewKeys.listBySchema(projectRef, schema) : viewKeys.list(projectRef),
    ({ signal }) => getViews({ projectRef, connectionString, schema }, signal),
    {
      enabled: enabled && typeof projectRef !== 'undefined',
      staleTime: 0,
      ...options,
    }
  )
