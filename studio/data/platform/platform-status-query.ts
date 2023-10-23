import { useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query'
import { get } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { useCallback } from 'react'
import { platformKeys } from './keys'

export type PlatformStatusResponse = {
  isHealthy: boolean
}

export async function getPlatformStatus(signal?: AbortSignal) {
  const response = await get(`${API_URL}/status`, {
    signal,
  })
  if (response.error) {
    throw response.error
  }

  return { isHealthy: response.is_healthy } as PlatformStatusResponse
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

export const usePlatformStatusPrefetch = () => {
  const client = useQueryClient()

  return useCallback(() => {
    client.prefetchQuery(platformKeys.status(), ({ signal }) => getPlatformStatus(signal))
  }, [])
}
