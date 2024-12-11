import { useMutation, UseMutationOptions } from '@tanstack/react-query'

import { components } from 'api-types'
import { LOCAL_STORAGE_KEYS } from 'common'
import { handleError, post } from 'data/fetchers'
import { IS_PLATFORM } from 'lib/constants'

type SendFeatureFlagTrackVariables = components['schemas']['TelemetryFeatureFlagBodyDto']

export async function sendFeatureFlagTrack(flagName: string, flagValue: unknown) {
  const consent =
    (typeof window !== 'undefined'
      ? localStorage.getItem(LOCAL_STORAGE_KEYS.TELEMETRY_CONSENT)
      : null) === 'true'

  if (!consent || !IS_PLATFORM) return undefined

  const body: SendFeatureFlagTrackVariables = {
    feature_flag_name: flagName,
    feature_flag_value: flagValue,
  }
  const { data, error } = await post(`/platform/telemetry/feature-flags/track`, { body })
  if (error) handleError(error)
  return data
}
