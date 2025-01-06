import { useContext } from 'react'
import * as Sentry from '@sentry/nextjs'

import FlagContext from 'components/ui/Flag/FlagContext'
import { FlagProviderStore } from 'components/ui/Flag/FlagProvider'
import { useLocalStorageQuery } from 'hooks/misc/useLocalStorage'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { trackFeatureFlag } from 'lib/posthog'

const isObjectEmpty = (obj: Object) => {
  return Object.keys(obj).length === 0
}

export function useFlag<T = boolean>(name: string) {
  const project = useSelectedProject()
  const flagStore = useContext(FlagContext) as FlagProviderStore

  const store = flagStore.configcat

  // Temporary override as Fly projects are cant seem to upgrade their compute with the new disk UI
  if (name === 'diskAndComputeForm' && project?.cloud_provider === 'FLY') {
    return false
  }

  if (!isObjectEmpty(store) && store[name] === undefined) {
    console.error(`Flag key "${name}" does not exist in ConfigCat flag store`)
    return false
  }
  return store[name] as T
}

export function usePHFlag<T = string | boolean>(name: string) {
  const flagStore = useContext(FlagContext) as FlagProviderStore
  // [Joshen] Prepend PH flags with "PH" in local storage for easier identification of PH flags
  const [trackedValue, setTrackedValue] = useLocalStorageQuery(`ph_${name}`, '')

  const store = flagStore.posthog
  const flagValue = store[name]

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
