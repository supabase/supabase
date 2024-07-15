import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { get, handleError } from 'data/fetchers'
import { ResponseError } from 'types'
import { analyticsKeys } from '../keys'

export type BackendsQueryVariables = {
  ref?: string
}

export async function getBackends({ ref }: BackendsQueryVariables, signal?: AbortSignal) {
  // TODO: Uncomment when endpoint is ready
  // const { data, error } = await get(`/v1/projects/{ref}/analytics/backends`, {
  //   params: { path: { ref: ref } },
  //   signal,
  // })

  // if (error) {
  //   handleError(error)
  // }

  // return data

  return [
    {
      config: {},
      id: 1,
      inserted_at: '2024-07-15T12:44:00.681Z',
      name: 'BACKEND NAME',
      token: '12345',
      updated_at: '2024-07-15T12:44:00.681Z',
    },
  ]
}

export type BackendsQueryData = Awaited<ReturnType<typeof getBackends>>
export type BackendsQueryError = ResponseError

export const useLogBackendsQuery = <TData = BackendsQueryData>(
  { ref }: BackendsQueryVariables,
  { enabled, ...options }: UseQueryOptions<BackendsQueryData, BackendsQueryError, TData> = {}
) =>
  useQuery<BackendsQueryData, BackendsQueryError, TData>(
    analyticsKeys.backends(ref),
    ({ signal }) => getBackends({ ref }, signal),
    {
      enabled: enabled && typeof ref !== 'undefined',
      staleTime: Infinity,
      cacheTime: 15 * 60 * 1000, // 15 mins cache time
      refetchOnMount: false,
      refetchInterval: false,
      ...options,
    }
  )
