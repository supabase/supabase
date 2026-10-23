import { useQuery } from '@tanstack/react-query'

import { miscKeys } from './keys'
import { fetchHandler } from '@/data/fetchers'
import { BASE_PATH, IS_PLATFORM } from '@/lib/constants'
import type { ResponseError, UseCustomQueryOptions } from '@/types'

type EnabledFeaturesOverride = { disabled_features: string[] }

export async function getEnabledFeaturesOverride(signal?: AbortSignal) {
  const res = await fetchHandler(`${BASE_PATH}/api/enabled-features-overrides`, { signal })
  if (!res.ok) throw new Error(`Failed to fetch enabled features override (${res.status})`)
  return (await res.json()) as EnabledFeaturesOverride
}

export type EnabledFeaturesOverrideData = Awaited<ReturnType<typeof getEnabledFeaturesOverride>>
export type EnabledFeaturesOverrideError = ResponseError

export const useEnabledFeaturesOverrideQuery = <TData = EnabledFeaturesOverrideData>({
  enabled = true,
  ...options
}: UseCustomQueryOptions<EnabledFeaturesOverrideData, EnabledFeaturesOverrideError, TData> = {}) =>
  useQuery<EnabledFeaturesOverrideData, EnabledFeaturesOverrideError, TData>({
    queryKey: miscKeys.enabledFeaturesOverride(),
    queryFn: ({ signal }) => getEnabledFeaturesOverride(signal),
    enabled: enabled && !IS_PLATFORM,
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    ...options,
  })
