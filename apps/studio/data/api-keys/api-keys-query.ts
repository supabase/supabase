import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { get, handleError } from 'data/fetchers'
import { ResponseError } from 'types'

import { apiKeysKeys } from './keys'

export interface APIKeysVariables {
  ref: string
}

export async function getAPIKeys({ ref }: APIKeysVariables, signal?: AbortSignal) {
  const { data, error } = await get(`/v1/projects/{ref}/api-keys`, {
    params: { path: { ref } },
    signal,
  })

  if (error) {
    handleError(error)
  }

  return data
}

export type APIKeysData = Awaited<ReturnType<typeof getAPIKeys>>

export const useAPIKeysQuery = <TData = APIKeysData>(
  { ref }: APIKeysVariables,
  { enabled, ...options }: UseQueryOptions<APIKeysData, ResponseError, TData> = {}
) =>
  useQuery<APIKeysData, ResponseError, TData>(
    apiKeysKeys.list(ref),
    ({ signal }) => getAPIKeys({ ref }, signal),
    {
      enabled: enabled && !!ref,
      refetchOnMount: false,
      ...options,
    }
  )
