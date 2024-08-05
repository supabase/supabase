import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { get, handleError } from 'data/fetchers'
import { logDrainsKeys } from './keys'
import { ResponseError } from 'types'

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
  { enabled, ...options }: UseQueryOptions<LogDrainsData, LogDrainsyError, TData> = {}
) =>
  useQuery<LogDrainsData, LogDrainsyError, TData>(
    logDrainsKeys.list(ref),
    ({ signal }) => getLogDrains({ ref }, signal),
    {
      enabled: enabled && !!ref,
      refetchOnMount: false,
      ...options,
    }
  )
