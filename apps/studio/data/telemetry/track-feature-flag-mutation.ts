import { useMutation, UseMutationOptions } from '@tanstack/react-query'
import { components } from 'api-types'

import { LOCAL_STORAGE_KEYS } from 'common'
import { handleError, post } from 'data/fetchers'
import { IS_PLATFORM } from 'lib/constants'
import type { ResponseError } from 'types'

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

type TrackFeatureFlagData = Awaited<ReturnType<typeof trackFeatureFlag>>

export const useTrackFeatureFlagMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<TrackFeatureFlagData, ResponseError, TrackFeatureFlagVariables>,
  'mutationFn'
> = {}) => {
  return useMutation<TrackFeatureFlagData, ResponseError, TrackFeatureFlagVariables>(
    (vars) => trackFeatureFlag(vars),
    {
      async onSuccess(data, variables, context) {
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          console.error(`Failed to track feature flag: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
