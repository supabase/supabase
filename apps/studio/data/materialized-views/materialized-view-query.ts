import { PostgresMaterializedView } from '@supabase/postgres-meta'
import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { get } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { materializedViewKeys } from './keys'

export type MaterializedViewVariables = {
  id?: number
  projectRef?: string
  connectionString?: string
}

export type MaterializedView = PostgresMaterializedView

export type MaterializedViewResponse = MaterializedView | { error?: any }

export async function getMaterializedView(
  { id, projectRef, connectionString }: MaterializedViewVariables,
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

  const response = (await get(`${API_URL}/pg-meta/${projectRef}/materialized-views?id=${id}`, {
    headers: Object.fromEntries(headers),
    signal,
  })) as MaterializedViewResponse

  if ('error' in response) {
    throw response.error
  }

  return response as PostgresMaterializedView
}

export type MaterializedViewData = Awaited<ReturnType<typeof getMaterializedView>>
export type MaterializedViewError = unknown

export const useMaterializedViewQuery = <TData = MaterializedViewData>(
  { projectRef, connectionString, id }: MaterializedViewVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<MaterializedViewData, MaterializedViewError, TData> = {}
) =>
  useQuery<MaterializedViewData, MaterializedViewError, TData>(
    materializedViewKeys.materializedView(projectRef, id),
    ({ signal }) => getMaterializedView({ projectRef, connectionString, id }, signal),
    {
      enabled: enabled && typeof projectRef !== 'undefined' && typeof id !== 'undefined',
      ...options,
    }
  )
