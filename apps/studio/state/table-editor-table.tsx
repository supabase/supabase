import { useParams } from 'common'
import { PropsWithChildren, createContext, useContext, useRef } from 'react'
import { proxy, useSnapshot } from 'valtio'
import { proxySet } from 'valtio/utils'

export const createTableEditorTableState = () => {
  const state = proxy({
    enforceExactCount: false,
    setEnforceExactCount: (value: boolean) => {
      state.enforceExactCount = value
    },

    page: 1,
    setPage: (page: number) => {
      state.page = page

      // reset selected row state
      state.setSelectedRows(new Set())
    },

    /* Rows */
    selectedRows: proxySet<number>(),
    allRowsSelected: false,
    setSelectedRows: (rows: Set<number>, selectAll?: boolean) => {
      state.allRowsSelected = selectAll ?? false
      state.selectedRows = proxySet(rows)
    },

    /* Cells */
    selectedCellPosition: null as { idx: number; rowIdx: number } | null,
    setSelectedCellPosition: (position: { idx: number; rowIdx: number } | null) => {
      state.selectedCellPosition = position
    },
  })

  return state
}

export type TableEditorTableState = ReturnType<typeof createTableEditorTableState>

export const TableEditorTableStateContext = createContext<TableEditorTableState>(
  createTableEditorTableState()
)

export const TableEditorTableStateContextProvider = ({ children }: PropsWithChildren<{}>) => {
  const state = useRef(createTableEditorTableState()).current

  return (
    <TableEditorTableStateContext.Provider value={state}>
      {children}
    </TableEditorTableStateContext.Provider>
  )
}

export const useTableEditorTableStateSnapshot = (options?: Parameters<typeof useSnapshot>[1]) => {
  const state = useContext(TableEditorTableStateContext)
  return useSnapshot(state, options)
}

export type TableEditorTableStateSnapshot = ReturnType<typeof useTableEditorTableStateSnapshot>
