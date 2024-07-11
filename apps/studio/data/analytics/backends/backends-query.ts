import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { get, handleError } from 'data/fetchers'
import { ResponseError } from 'types'
import { analyticsKeys } from '../keys'

export type BackendsQueryVariables = {
  ref: string
}

export async function getBackends({ ref }: BackendsQueryVariables, signal?: AbortSignal) {
  const { data, error } = await get(`/v1/projects/{ref}/analytics/backends`, {
    params: { path: { ref: ref } },
    signal,
  })

  if (error) {
    handleError(error)
  }

  return data
}

export type BackendsQueryData = Awaited<ReturnType<typeof getBackends>>
export type BackendsQueryError = ResponseError

export const useBackendsQueryQuery = <TData = BackendsQueryData>(
  { ref }: BackendsQueryVariables,
  { enabled, ...options }: UseQueryOptions<BackendsQueryData, BackendsQueryError, TData> = {}
) =>
  useQuery<BackendsQueryData, BackendsQueryError, TData>(
    analyticsKeys.backends(ref),
    ({ signal }) => getBackends({ ref }, signal),
    {
      enabled,
      staleTime: Infinity,
      cacheTime: 15 * 60 * 1000, // 15 mins cache time
      refetchOnMount: false,
      refetchInterval: false,
      ...options,
    }
  )
