import { PostgresView } from '@supabase/postgres-meta'
import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { get } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { viewKeys } from './keys'
import { View } from './view-query'

export type ViewsVariables = {
  projectRef?: string
  connectionString?: string
}

export type ViewsResponse = View[] | { error?: any }

export async function getViews(
  { projectRef, connectionString }: ViewsVariables,
  signal?: AbortSignal
) {
  if (!projectRef) {
    throw new Error('projectRef is required')
  }

  let headers = new Headers()
  if (connectionString) headers.set('x-connection-encrypted', connectionString)

  const response = (await get(`${API_URL}/pg-meta/${projectRef}/views`, {
    headers: Object.fromEntries(headers),
    signal,
  })) as ViewsResponse

  if (!Array.isArray(response) && response.error) {
    throw response.error
  }

  return response as PostgresView[]
}

export type ViewsData = Awaited<ReturnType<typeof getViews>>
export type ViewsError = unknown

export const useViewsQuery = <TData = ViewsData>(
  { projectRef, connectionString }: ViewsVariables,
  { enabled = true, ...options }: UseQueryOptions<ViewsData, ViewsError, TData> = {}
) =>
  useQuery<ViewsData, ViewsError, TData>(
    viewKeys.list(projectRef),
    ({ signal }) => getViews({ projectRef, connectionString }, signal),
    { enabled: enabled && typeof projectRef !== 'undefined', ...options }
  )
