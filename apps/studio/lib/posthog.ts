import { components } from 'api-types'
import { IS_PLATFORM } from './constants'
import { handleError, get } from 'data/fetchers'

export type CallFeatureFlagsResponse = components['schemas']['TelemetryCallFeatureFlagsResponseDto']

export async function getPHFeatureFlags() {
  if (!IS_PLATFORM) return undefined
  const { data, error } = await get(`/platform/telemetry/feature-flags`, {})

  if (error) handleError(error)
  return data as CallFeatureFlagsResponse
}
