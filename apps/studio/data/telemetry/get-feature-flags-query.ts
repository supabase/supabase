import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { components } from 'api-types'

import { handleError, get } from 'data/fetchers'
import { IS_PLATFORM } from 'lib/constants'
import type { ResponseError } from 'types'
import { featureflagKeys } from './keys'

export type CallFeatureFlagsResponse = components['schemas']['TelemetryCallFeatureFlagsResponseDto']

export async function getFeatureFlags() {
  if (!IS_PLATFORM) return undefined

  const { data, error } = await get(`/platform/telemetry/feature-flags`, {})
  if (error) handleError(error)
  return data as CallFeatureFlagsResponse
}

type GetFeatureFlagsData = Awaited<ReturnType<typeof getFeatureFlags>>

export const useGetFeatureFlagsQuery = <TData = GetFeatureFlagsData>({
  ...options
}: UseQueryOptions<GetFeatureFlagsData, ResponseError, TData> = {}) =>
  useQuery<GetFeatureFlagsData, ResponseError, TData>(
    featureflagKeys.flags(),
    () => getFeatureFlags(),
    {
      ...options,
    }
  )
