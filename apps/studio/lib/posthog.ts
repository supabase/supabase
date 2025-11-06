import { components } from 'api-types'
import { hasConsented } from 'common'
import { handleError, post } from 'data/fetchers'
import { IS_PLATFORM } from './constants'

type TrackFeatureFlagVariables = components['schemas']['TelemetryFeatureFlagBody']

export async function trackFeatureFlag(body: TrackFeatureFlagVariables) {
  const consent = hasConsented()

  if (!consent || !IS_PLATFORM) return undefined
  const { data, error } = await post(`/platform/telemetry/feature-flags/track`, { body })

  if (error) handleError(error)
  return data
}
