import type { PostgresView } from '@supabase/postgres-meta'
import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { get, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
import { viewKeys } from './keys'

export type ViewVariables = {
  id?: number
  projectRef?: string
  connectionString?: string
}

export type View = PostgresView

export type ViewResponse = View | { error?: any }

export async function getView(
  { id, projectRef, connectionString }: ViewVariables,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')
  if (!id) throw new Error('id is required')

  let headers = new Headers()
  if (connectionString) headers.set('x-connection-encrypted', connectionString)

  const { data, error } = await get('/platform/pg-meta/{ref}/views', {
    params: {
      header: { 'x-connection-encrypted': connectionString! },
      path: { ref: projectRef },
      query: { id: `${id}` } as any,
    },
    headers,
    signal,
  })

  if (error) handleError(error)
  return data as unknown as PostgresView
}

export type ViewData = Awaited<ReturnType<typeof getView>>
export type ViewError = ResponseError

export const useViewQuery = <TData = ViewData>(
  { projectRef, connectionString, id }: ViewVariables,
  { enabled = true, ...options }: UseQueryOptions<ViewData, ViewError, TData> = {}
) =>
  useQuery<ViewData, ViewError, TData>(
    viewKeys.view(projectRef, id),
    ({ signal }) => getView({ projectRef, connectionString, id }, signal),
    {
      enabled: enabled && typeof projectRef !== 'undefined' && typeof id !== 'undefined',
      staleTime: 0,
      ...options,
    }
  )
