import { useQuery } from '@tanstack/react-query'

import { get, handleError } from 'data/fetchers'
import { platformKeys } from './keys'
import { UseCustomQueryOptions } from 'types'

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
  options: UseCustomQueryOptions<PlatformStatusData, PlatformStatusError, TData> = {}
) =>
  useQuery<PlatformStatusData, PlatformStatusError, TData>({
    queryKey: platformKeys.status(),
    queryFn: ({ signal }) => getPlatformStatus(signal),
    ...options,
  })
