import { PropsWithChildren, createContext, useContext } from 'react'
import { proxy, useSnapshot } from 'valtio'

import { useConstant } from 'common'

export function createDatabaseSettingsState() {
  const state = proxy({
    usePoolerConnection: true,
    setUsePoolerConnection: (value: boolean) => {
      state.usePoolerConnection = value
    },
    showPoolingModeHelper: false,
    setShowPoolingModeHelper: (value: boolean) => {
      state.showPoolingModeHelper = value
    },
  })

  return state
}

export type DatabaseSettingsState = ReturnType<typeof createDatabaseSettingsState>

export const DatabaseSettingsStateContext = createContext<DatabaseSettingsState>(
  createDatabaseSettingsState()
)

export const DatabaseSettingsStateContextProvider = ({ children }: PropsWithChildren) => {
  const state = useConstant(createDatabaseSettingsState)

  return (
    <DatabaseSettingsStateContext.Provider value={state}>
      {children}
    </DatabaseSettingsStateContext.Provider>
  )
}

export function useDatabaseSettingsStateSnapshot(options?: Parameters<typeof useSnapshot>[1]) {
  const state = useContext(DatabaseSettingsStateContext)
  return useSnapshot(state, options)
}
