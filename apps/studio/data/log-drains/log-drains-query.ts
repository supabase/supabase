import { useQuery } from '@tanstack/react-query'
import { get, handleError } from 'data/fetchers'
import { MAX_RETRY_FAILURE_COUNT } from 'data/query-client'
import type { ResponseError, UseCustomQueryOptions } from 'types'
import { logDrainsKeys } from './keys'

export type LogDrainsVariables = {
  ref?: string
}

export async function getLogDrains({ ref }: LogDrainsVariables, signal?: AbortSignal) {
  if (!ref) {
    throw new Error('ref is required')
  }

  const { data, error } = await get(`/platform/projects/{ref}/analytics/log-drains`, {
    params: { path: { ref: ref } },
    signal,
  })

  if (error) {
    handleError(error)
  }

  return data
}

export type LogDrainsData = Awaited<ReturnType<typeof getLogDrains>>
export type LogDrainData = LogDrainsData[number]
export type LogDrainsyError = ResponseError

export const useLogDrainsQuery = <TData = LogDrainsData>(
  { ref }: LogDrainsVariables,
  { enabled = true, ...options }: UseCustomQueryOptions<LogDrainsData, LogDrainsyError, TData> = {}
) =>
  useQuery<LogDrainsData, LogDrainsyError, TData>({
    queryKey: logDrainsKeys.list(ref),
    queryFn: ({ signal }) => getLogDrains({ ref }, signal),
    enabled: enabled && !!ref,
    refetchOnMount: false,
    retry: (failureCount, error) => {
      if (error.code === 500 || error.message.includes('API error happened')) return false
      if (failureCount < MAX_RETRY_FAILURE_COUNT) {
        return true
      }
      return false
    },
    ...options,
  })
