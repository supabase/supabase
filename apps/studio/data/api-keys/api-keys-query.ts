import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { get, handleError } from 'data/fetchers'
import { ResponseError } from 'types'

import { apiKeysKeys } from './keys'

export interface APIKeysVariables {
  projectRef?: string
}

export async function getAPIKeys({ projectRef }: APIKeysVariables, signal?: AbortSignal) {
  if (!projectRef) throw new Error('projectRef is required')

  const { data, error } = await get(`/v1/projects/{ref}/api-keys`, {
    params: { path: { ref: projectRef } },
    signal,
  })

  if (error) {
    handleError(error)
  }

  return data
}

export type APIKeysData = Awaited<ReturnType<typeof getAPIKeys>>

export const useAPIKeysQuery = <TData = APIKeysData>(
  { projectRef }: APIKeysVariables,
  { enabled, ...options }: UseQueryOptions<APIKeysData, ResponseError, TData> = {}
) =>
  useQuery<APIKeysData, ResponseError, TData>(
    apiKeysKeys.list(projectRef),
    ({ signal }) => getAPIKeys({ projectRef }, signal),
    {
      enabled: enabled && !!projectRef,
      ...options,
    }
  )
