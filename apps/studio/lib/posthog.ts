import { components } from 'api-types'
import { handleError, post } from 'data/fetchers'
import { IS_PLATFORM } from './constants'

type TrackFeatureFlagVariables = components['schemas']['TelemetryFeatureFlagBody']

export async function trackFeatureFlag(body: TrackFeatureFlagVariables) {
  const consent = true // FIXME: if required, but I doubt it

  if (!consent || !IS_PLATFORM) return undefined
  const { data, error } = await post(`/platform/telemetry/feature-flags/track`, { body })

  if (error) handleError(error)
  return data
}
