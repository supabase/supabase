import { PostgresView } from '@supabase/postgres-meta'
import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { get } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
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
  if (!projectRef) {
    throw new Error('projectRef is required')
  }
  if (!id) {
    throw new Error('id is required')
  }

  let headers = new Headers()
  if (connectionString) headers.set('x-connection-encrypted', connectionString)

  const response = (await get(`${API_URL}/pg-meta/${projectRef}/views?id=${id}`, {
    headers: Object.fromEntries(headers),
    signal,
  })) as ViewResponse

  if ('error' in response) {
    throw response.error
  }

  return response as PostgresView
}

export type ViewData = Awaited<ReturnType<typeof getView>>
export type ViewError = unknown

export const useViewQuery = <TData = ViewData>(
  { projectRef, connectionString, id }: ViewVariables,
  { enabled = true, ...options }: UseQueryOptions<ViewData, ViewError, TData> = {}
) =>
  useQuery<ViewData, ViewError, TData>(
    viewKeys.view(projectRef, id),
    ({ signal }) => getView({ projectRef, connectionString, id }, signal),
    {
      enabled: enabled && typeof projectRef !== 'undefined' && typeof id !== 'undefined',
      ...options,
    }
  )
