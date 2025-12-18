import { useQuery } from '@tanstack/react-query'

import { get, handleError } from 'data/fetchers'
import { ResponseError, UseCustomQueryOptions } from 'types'
import { platformKeys } from './keys'

export type PlatformStatusResponse = {
  isHealthy: boolean
}

export async function getPlatformStatus(signal?: AbortSignal) {
  const { data, error } = await get('/platform/status', { signal })

  // Handle 401 (unauthorized) errors gracefully - support page may be accessible without full auth
  if (error) {
    if (error instanceof ResponseError && error.code === 401) {
      // Return default value instead of throwing for unauthenticated users
      return { isHealthy: true } as PlatformStatusResponse
    }
    return handleError(error)
  }

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
