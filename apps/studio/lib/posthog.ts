import { components } from 'api-types'
import { handleError, post } from 'data/fetchers'
import { IS_PLATFORM } from './constants'
import { LOCAL_STORAGE_KEYS, hasConsented } from 'common'

type TrackFeatureFlagVariables = components['schemas']['TelemetryFeatureFlagBodyDto']

export async function trackFeatureFlag(body: TrackFeatureFlagVariables) {
  const consent = hasConsented()

  if (!consent || !IS_PLATFORM) return undefined
  const { data, error } = await post(`/platform/telemetry/feature-flags/track`, { body })

  if (error) handleError(error)
  return data
}
