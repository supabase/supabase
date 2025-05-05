import { createContext, PropsWithChildren, useContext, useEffect, useState } from 'react'
import { useLatest } from 'react-use'
import { proxy, snapshot, useSnapshot } from 'valtio'

import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import {
  STORAGE_SORT_BY,
  STORAGE_SORT_BY_ORDER,
  STORAGE_VIEWS,
} from 'components/to-be-cleaned/Storage/Storage.constants'
import { LOCAL_STORAGE_KEYS } from 'common'
import { tryParseJson } from 'lib/helpers'

const DEFAULT_PREFERENCES = {
  view: STORAGE_VIEWS.COLUMNS,
  sortBy: STORAGE_SORT_BY.NAME,
  sortByOrder: STORAGE_SORT_BY_ORDER.ASC,
}

function createStorageExplorerState({ projectRef }: { projectRef: string }) {
  const localStorageKey = LOCAL_STORAGE_KEYS.STORAGE_PREFERENCE(projectRef)
  const { view, sortBy, sortByOrder } =
    (typeof window !== 'undefined' && tryParseJson(localStorage?.getItem(localStorageKey))) ||
    DEFAULT_PREFERENCES

  const state = proxy({
    projectRef,

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
  createStorageExplorerState({ projectRef: '' })
)

export const StorageExplorerStateContextProvider = ({ children }: PropsWithChildren) => {
  const { project } = useProjectContext()
  const [state, setState] = useState(() =>
    createStorageExplorerState({ projectRef: project?.ref ?? '' })
  )

  const stateRef = useLatest(state)

  // [Joshen] JFYI opting with the useEffect here as the storage explorer state was being loaded
  // before the project details were ready, hence the store kept returning project ref as undefined
  // Can be verified when we're saving the storage explorer preferences into local storage, that ref is undefined
  // So the useEffect here is to make sure that the project ref is loaded into the state properly
  // Although I'd be keen to re-investigate this to see if we can remove this
  useEffect(() => {
    const snap = snapshot(stateRef.current)
    const hasDataReady = !!project?.ref
    const isDifferentProject = snap.projectRef !== project?.ref

    if (hasDataReady && isDifferentProject) {
      setState(createStorageExplorerState({ projectRef: project?.ref ?? '' }))
    }
  }, [project?.ref, stateRef])

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
