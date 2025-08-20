import { useFeatureFlags } from 'common'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'

const isObjectEmpty = (obj: Object) => {
  return Object.keys(obj).length === 0
}

export function useFlag<T = boolean>(name: string) {
  const flagStore = useFeatureFlags()

  const store = flagStore.configcat

  if (!isObjectEmpty(store) && store[name] === undefined) {
    console.error(`Flag key "${name}" does not exist in ConfigCat flag store`)
    return false
  }
  return store[name] as T
}

export const useIsRealtimeSettingsFFEnabled = () => {
  const { data: project } = useSelectedProjectQuery()

  // This flag is used to enable/disable the realtime settings for specific projects.
  const approvedProjects = useFlag<string>('isRealtimeSettingsEnabledOnProjects')
  // This flag is used to enable/disable the realtime settings for all projects.
  // Will override isRealtimeSettingsEnabledOnProjects if enabled
  const enableRealtimeSettingsFlag = useFlag('enableRealtimeSettings')

  const isEnabledOnProject =
    !!project?.ref &&
    typeof approvedProjects === 'string' &&
    (approvedProjects ?? '')
      .split(',')
      .map((it) => it.trim())
      .includes(project?.ref)

  return enableRealtimeSettingsFlag || isEnabledOnProject
}
