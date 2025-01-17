import { components } from 'api-types'
import { LOCAL_STORAGE_KEYS } from 'common'
import { handleError, post } from 'data/fetchers'
import { IS_PLATFORM } from './constants'

type TrackFeatureFlagVariables = components['schemas']['TelemetryFeatureFlagBodyDto']

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
