import { components } from 'api-types'
import { IS_PLATFORM } from './constants'
import { handleError, get, post } from 'data/fetchers'
import { LOCAL_STORAGE_KEYS } from 'common'

type TrackFeatureFlagVariables = components['schemas']['TelemetryFeatureFlagBodyDto']
export type CallFeatureFlagsResponse = components['schemas']['TelemetryCallFeatureFlagsResponseDto']

export async function getPHFeatureFlags() {
  if (!IS_PLATFORM) return undefined
  const { data, error } = await get(`/platform/telemetry/feature-flags`, {})

  if (error) handleError(error)
  return data as CallFeatureFlagsResponse
}

export async function trackFeatureFlag(body: TrackFeatureFlagVariables) {
  const consent =
    (typeof window !== 'undefined'
      ? localStorage.getItem(LOCAL_STORAGE_KEYS.TELEMETRY_CONSENT)
      : null) === 'true'

  if (!consent || !IS_PLATFORM) return undefined
  const { data, error } = await post(`/platform/telemetry/feature-flags/track`, { body })

  if (error) handleError(error)
  return data
}
