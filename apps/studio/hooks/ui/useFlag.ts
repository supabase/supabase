import { useContext } from 'react'

import FlagContext from 'components/ui/Flag/FlagContext'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { FlagProviderStore } from 'components/ui/Flag/FlagProvider'
import { useLocalStorageQuery } from 'hooks/misc/useLocalStorage'
import { trackFeatureFlag } from 'data/telemetry/track-feature-flag-mutation'

const isObjectEmpty = (objectName: Object) => {
  return Object.keys(objectName).length === 0
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
    trackFeatureFlag({ feature_flag_name: name, feature_flag_value: flagValue })
    setTrackedValue(flagValue as string)
  }

  return flagValue as T
}
