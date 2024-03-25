import { PropsWithChildren, createContext, useCallback, useContext } from 'react'
import { proxy, snapshot, useSnapshot } from 'valtio'

import { useConstant } from 'common'

export function createDatabaseSelectorState() {
  const state = proxy({
    selectedDatabaseId: undefined as string | undefined,
    setSelectedDatabaseId: (id: string | undefined) => {
      state.selectedDatabaseId = id
    },
  })

  return state
}

export type DatabaseSelectorState = ReturnType<typeof createDatabaseSelectorState>

export const DatabaseSelectorStateContext = createContext<DatabaseSelectorState>(
  createDatabaseSelectorState()
)

export const DatabaseSelectorStateContextProvider = ({ children }: PropsWithChildren) => {
  const state = useConstant(createDatabaseSelectorState)

  return (
    <DatabaseSelectorStateContext.Provider value={state}>
      {children}
    </DatabaseSelectorStateContext.Provider>
  )
}

export function useDatabaseSelectorStateSnapshot(options?: Parameters<typeof useSnapshot>[1]) {
  const state = useContext(DatabaseSelectorStateContext)
  return useSnapshot(state, options)
}

// Helper methods
export function useGetSelectedDatabaseId() {
  const state = useContext(DatabaseSelectorStateContext)
  return useCallback(() => snapshot(state).selectedDatabaseId, [state])
}
