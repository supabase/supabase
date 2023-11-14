import { PostgresMaterializedView } from '@supabase/postgres-meta'
import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { get } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { materializedViewKeys } from './keys'
import { MaterializedView } from './materialized-view-query'

export type MaterializedViewsVariables = {
  projectRef?: string
  connectionString?: string
}

export type MaterializedViewsResponse = MaterializedView[] | { error?: any }

export async function getMaterializedViews(
  { projectRef, connectionString }: MaterializedViewsVariables,
  signal?: AbortSignal
) {
  if (!projectRef) {
    throw new Error('projectRef is required')
  }

  let headers = new Headers()
  if (connectionString) headers.set('x-connection-encrypted', connectionString)

  const response = (await get(`${API_URL}/pg-meta/${projectRef}/materialized-views`, {
    headers: Object.fromEntries(headers),
    signal,
  })) as MaterializedViewsResponse

  if (!Array.isArray(response) && response.error) {
    throw response.error
  }

  return response as PostgresMaterializedView[]
}

export type MaterializedViewsData = Awaited<ReturnType<typeof getMaterializedViews>>
export type MaterializedViewsError = unknown

export const useMaterializedViewsQuery = <TData = MaterializedViewsData>(
  { projectRef, connectionString }: MaterializedViewsVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<MaterializedViewsData, MaterializedViewsError, TData> = {}
) =>
  useQuery<MaterializedViewsData, MaterializedViewsError, TData>(
    materializedViewKeys.list(projectRef),
    ({ signal }) => getMaterializedViews({ projectRef, connectionString }, signal),
    { enabled: enabled && typeof projectRef !== 'undefined', ...options }
  )
