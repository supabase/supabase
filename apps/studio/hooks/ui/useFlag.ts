import * as Sentry from '@sentry/nextjs'
import { IS_PLATFORM, useFeatureFlags } from 'common'
import { useLocalStorageQuery } from 'hooks/misc/useLocalStorage'
import { trackFeatureFlag } from 'lib/posthog'

const isObjectEmpty = (obj: Object) => {
  return Object.keys(obj).length === 0
}

/**
 * Hook to retrieve a PostHog feature flag value.
 *
 * @returns `undefined | false | T` where:
 * - `undefined` = PostHog store is still loading OR flag doesn't exist (treat as "don't show")
 * - `false` = Flag is explicitly set to false (typically means "disabled" or "control" for experiments)
 * - `T` = The actual flag value (string, boolean, or custom type like variant names)
 *
 * @example Experiment usage convention:
 * ```typescript
 * const variant = usePHFlag<ExperimentVariant | false>('experimentName')
 *
 * // undefined = loading/doesn't exist, don't render anything yet
 * if (variant === undefined) return null
 *
 * // false = explicitly disabled, show control
 * if (variant === false) return <Control />
 *
 * // Otherwise, variant has a value, show experiment
 * return <Experiment variant={variant} />
 * ```
 *
 * @todo TODO(Alaister): move this to packages/common/feature-flags.tsx and rename to useFlag
 * @todo TODO(sean): Refactor to have explicit loading/disabled/value states
 *       See https://linear.app/supabase/issue/GROWTH-539
 */
export function usePHFlag<T = string | boolean>(name: string) {
  const flagStore = useFeatureFlags()
  // [Joshen] Prepend PH flags with "PH" in local storage for easier identification of PH flags
  const [trackedValue, setTrackedValue] = useLocalStorageQuery(`ph_${name}`, '')

  const store = flagStore.posthog
  const flagValue = store[name]

  if (!IS_PLATFORM) return false

  // Flag store has not been initialized
  if (isObjectEmpty(store)) return undefined

  if (!isObjectEmpty(store) && flagValue === undefined) {
    console.error(`Flag key "${name}" does not exist in PostHog flag store`)
    return undefined
  }

  if (trackedValue !== flagValue) {
    try {
      // [Joshen] Only fire the track endpoint once across sessions unless the flag value changes
      // Note: This cannot guarantee excess calls in the event for e.g user clears local storage or uses incognito
      // trackFeatureFlag checks for telemetry consent before actually firing the request too
      trackFeatureFlag({ feature_flag_name: name, feature_flag_value: flagValue })
      setTrackedValue(flagValue as string)
    } catch (error: any) {
      Sentry.withScope((scope) => {
        scope.setTag('type', 'phTrackFailure')
        Sentry.captureException(error)
      })
      console.error(error.message)
    }
  }

  return flagValue as T
}
