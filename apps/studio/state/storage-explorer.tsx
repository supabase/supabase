import { createContext, PropsWithChildren, useContext } from 'react'
import { proxy, useSnapshot } from 'valtio'

import { useConstant } from 'common'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import {
  STORAGE_SORT_BY,
  STORAGE_SORT_BY_ORDER,
  STORAGE_VIEWS,
} from 'components/to-be-cleaned/Storage/Storage.constants'
import { getAPIKeys, useProjectSettingsV2Query } from 'data/config/project-settings-v2-query'
import { IS_PLATFORM, LOCAL_STORAGE_KEYS } from 'lib/constants'
import { tryParseJson } from 'lib/helpers'

type Folder = { id: string; name: string }

function createStorageExplorerState({
  projectRef,
  resumableUploadUrl,
  serviceKey,
}: {
  projectRef: string
  resumableUploadUrl: string
  serviceKey: string
}) {
  const state = proxy({
    projectRef,
    resumableUploadUrl,
    serviceKey,

    view: STORAGE_VIEWS.COLUMNS,
    sortBy: STORAGE_SORT_BY.NAME,
    sortByOrder: STORAGE_SORT_BY_ORDER.ASC,
    isSearching: false,

    setView: (value: STORAGE_VIEWS) => {
      state.view = value
      state.updateExplorerPreference()
    },
    setSortBy: (value: STORAGE_SORT_BY) => {
      state.sortBy = value
      state.updateExplorerPreference()
    },
    setSortByOrder: (value: STORAGE_SORT_BY_ORDER) => {
      state.sortByOrder = value
      state.updateExplorerPreference()
    },
    setIsSearching: (value: boolean) => (state.isSearching = value),

    initExplorerPreference: () => {
      const localStorageKey = LOCAL_STORAGE_KEYS.STORAGE_PREFERENCE(projectRef)
      const preferences = localStorage?.getItem(localStorageKey) ?? undefined
      const preferenceJson = tryParseJson(preferences)

      // [Joshen] Load into valtio store if any, otherwise save into local storage to initialize with default values
      if (preferenceJson !== undefined) {
        state.view = preferenceJson.view
        state.sortBy = preferenceJson.sortBy
        state.sortByOrder = preferenceJson.sortByOrder
      } else {
        state.updateExplorerPreference()
      }
    },

    updateExplorerPreference: () => {
      const localStorageKey = LOCAL_STORAGE_KEYS.STORAGE_PREFERENCE(projectRef)
      const { view, sortBy, sortByOrder } = state
      localStorage.setItem(localStorageKey, JSON.stringify({ view, sortBy, sortByOrder }))
    },
  })

  return state
}

type StorageExplorerState = ReturnType<typeof createStorageExplorerState>

const StorageExplorerStateContext = createContext<StorageExplorerState>(
  createStorageExplorerState({ projectRef: '', resumableUploadUrl: '', serviceKey: '' })
)

export const StorageExplorerStateContextProvider = ({ children }: PropsWithChildren) => {
  const { project } = useProjectContext()
  const { data: settings } = useProjectSettingsV2Query({ projectRef: project?.ref })
  const endpoint = settings?.app_config?.endpoint
  const { serviceKey } = getAPIKeys(settings)
  const protocol = settings?.app_config?.protocol ?? 'https'

  const resumableUploadUrl = `${IS_PLATFORM ? 'https' : protocol}://${endpoint}/storage/v1/upload/resumable`

  const state = useConstant(() =>
    createStorageExplorerState({
      projectRef: project?.ref ?? '',
      resumableUploadUrl: !!settings ? resumableUploadUrl : '',
      serviceKey: serviceKey?.api_key ?? '',
    })
  )

  return (
    <StorageExplorerStateContext.Provider value={state}>
      {children}
    </StorageExplorerStateContext.Provider>
  )
}

export function useStorageExplorerStateSnapshot(options?: Parameters<typeof useSnapshot>[1]) {
  const state = useContext(StorageExplorerStateContext)
  return useSnapshot(state, options)
}
