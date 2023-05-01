import { PropsWithChildren, createContext, useContext, useRef } from 'react'
import { proxy, useSnapshot } from 'valtio'

export const createTableEditorState = () => {
  const state = proxy({
    selectedSchemaName: 'public',
    setSelectedSchemaName: (schemaName: string) => {
      state.selectedSchemaName = schemaName
    },
  })

  return state
}

export type TableEditorState = ReturnType<typeof createTableEditorState>

export const TableEditorStateContext = createContext<TableEditorState>(createTableEditorState())

export const TableEditorStateContextProvider = ({ children }: PropsWithChildren<{}>) => {
  const state = useRef(createTableEditorState()).current

  return (
    <TableEditorStateContext.Provider value={state}>{children}</TableEditorStateContext.Provider>
  )
}

export const useTableEditorStateSnapshot = (options?: Parameters<typeof useSnapshot>[1]) => {
  const state = useContext(TableEditorStateContext)
  return useSnapshot(state, options)
}
