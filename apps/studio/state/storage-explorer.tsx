import { createContext, PropsWithChildren, useContext, useEffect, useState } from 'react'
import { useLatest } from 'react-use'
import { proxy, snapshot, useSnapshot } from 'valtio'

import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import {
  STORAGE_SORT_BY,
  STORAGE_SORT_BY_ORDER,
  STORAGE_VIEWS,
} from 'components/to-be-cleaned/Storage/Storage.constants'
import { getAPIKeys, useProjectSettingsV2Query } from 'data/config/project-settings-v2-query'
import { IS_PLATFORM, LOCAL_STORAGE_KEYS } from 'lib/constants'
import { tryParseJson } from 'lib/helpers'

const DEFAULT_PREFERENCES = {
  view: STORAGE_VIEWS.COLUMNS,
  sortBy: STORAGE_SORT_BY.NAME,
  sortByOrder: STORAGE_SORT_BY_ORDER.ASC,
}

function createStorageExplorerState({
  projectRef,
  resumableUploadUrl,
  serviceKey,
}: {
  projectRef: string
  resumableUploadUrl: string
  serviceKey: string
}) {
  const localStorageKey = LOCAL_STORAGE_KEYS.STORAGE_PREFERENCE(projectRef)
  const { view, sortBy, sortByOrder } =
    (typeof window !== 'undefined' && tryParseJson(localStorage?.getItem(localStorageKey))) ||
    DEFAULT_PREFERENCES

  const state = proxy({
    projectRef,
    resumableUploadUrl,
    serviceKey,

    view,
    sortBy,
    sortByOrder,
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

  const [state, setState] = useState(() =>
    createStorageExplorerState({
      projectRef: project?.ref ?? '',
      resumableUploadUrl: !!settings ? resumableUploadUrl : '',
      serviceKey: serviceKey?.api_key ?? '',
    })
  )

  const stateRef = useLatest(state)

  useEffect(() => {
    const snap = snapshot(stateRef.current)
    const hasDataReady = !!project?.ref && !!settings
    const isDifferentProject =
      snap.projectRef !== project?.ref ||
      snap.serviceKey !== serviceKey?.api_key ||
      snap.resumableUploadUrl !== resumableUploadUrl

    if (hasDataReady && isDifferentProject) {
      setState(
        createStorageExplorerState({
          projectRef: project?.ref ?? '',
          resumableUploadUrl: !!settings ? resumableUploadUrl : '',
          serviceKey: serviceKey?.api_key ?? '',
        })
      )
    }
  }, [project?.ref, resumableUploadUrl, serviceKey?.api_key, settings, stateRef])

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
