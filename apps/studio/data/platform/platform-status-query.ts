import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { get, handleError } from 'data/fetchers'
import { platformKeys } from './keys'

export type PlatformStatusResponse = {
  isHealthy: boolean
}

export async function getPlatformStatus(signal?: AbortSignal) {
  const { data, error } = await get('/platform/status', { signal })
  if (error) handleError(error)
  return { isHealthy: (data as any).is_healthy } as PlatformStatusResponse
}

export type PlatformStatusData = Awaited<ReturnType<typeof getPlatformStatus>>
export type PlatformStatusError = unknown

export const usePlatformStatusQuery = <TData = PlatformStatusData>(
  options: UseQueryOptions<PlatformStatusData, PlatformStatusError, TData> = {}
) =>
  useQuery<PlatformStatusData, PlatformStatusError, TData>(
    platformKeys.status(),
    ({ signal }) => getPlatformStatus(signal),
    options
  )
