import { useFlag } from 'common'
import {
  loadTableEditorStateFromLocalStorage,
  parseSupaTable,
  saveTableEditorStateToLocalStorageDebounced,
} from 'components/grid/SupabaseGrid.utils'
import { TableIndexAdvisorProvider } from 'components/grid/context/TableIndexAdvisorContext'
import { Filter, SupaRow } from 'components/grid/types'
import { getInitialGridColumns } from 'components/grid/utils/column'
import { getGridColumns } from 'components/grid/utils/gridColumns'
import { Entity } from 'data/table-editor/table-editor-types'
import { PropsWithChildren, createContext, useContext, useEffect, useRef } from 'react'
import { CalculatedColumn } from 'react-data-grid'
import { proxy, ref, subscribe, useSnapshot } from 'valtio'
import { proxySet } from 'valtio/utils'

import { useTableEditorStateSnapshot } from './table-editor'

export const createTableEditorTableState = ({
  projectRef,
  table: originalTable,
  editable = true,
  onAddColumn,
  onExpandJSONEditor,
  onExpandTextEditor,
}: {
  projectRef: string
  table: Entity
  /** If set to true, render an additional "+" column to support adding a new column in the grid editor */
  editable?: boolean
  onAddColumn: () => void
  onExpandJSONEditor: (column: string, row: SupaRow) => void
  onExpandTextEditor: (column: string, row: SupaRow) => void
}) => {
  const table = parseSupaTable(originalTable)

  const savedState = loadTableEditorStateFromLocalStorage(projectRef, table.id)
  const gridColumns = getInitialGridColumns(
    getGridColumns(table, {
      tableId: table.id,
      editable,
      onAddColumn: editable ? onAddColumn : undefined,
      onExpandJSONEditor,
      onExpandTextEditor,
    }),
    savedState
  )

  const state = proxy({
    /* Table */
    table,
    originalTable,

    /**
     * Used for tracking changes to the table
     * Do not use outside of table-editor-table.tsx
     */
    _originalTableRef: ref(originalTable),

    updateTable: (table: Entity) => {
      const supaTable = parseSupaTable(table)

      const gridColumns = getInitialGridColumns(
        getGridColumns(supaTable, {
          tableId: table.id,
          editable: state.editable,
          onAddColumn: state.editable ? onAddColumn : undefined,
          onExpandJSONEditor,
          onExpandTextEditor,
        }),
        { gridColumns: state.gridColumns }
      )

      state.table = supaTable
      state.gridColumns = gridColumns
      state.originalTable = table
      state._originalTableRef = ref(table)
    },

    /* Rows */
    selectedRows: proxySet<number>(),
    allRowsSelected: false,
    setSelectedRows: (rows: Set<number>, selectAll?: boolean) => {
      state.allRowsSelected = selectAll ?? false
      state.selectedRows = proxySet(rows)
    },
    resetSelectedRows: () => {
      state.allRowsSelected = false
      state.selectedRows = proxySet(new Set())
    },

    /* Columns */
    gridColumns,
    moveColumn: (fromKey: string, toKey: string) => {
      const fromIdx = state.gridColumns.findIndex((x) => x.key === fromKey)
      const toIdx = state.gridColumns.findIndex((x) => x.key === toKey)
      const moveItem = state.gridColumns[fromIdx]

      state.gridColumns.splice(fromIdx, 1)
      state.gridColumns.splice(toIdx, 0, moveItem)
    },
    updateColumnSize: (index: number, width: number) => {
      if (state.gridColumns[index]) {
        ;(state.gridColumns[index] as CalculatedColumn<any, any> & { width?: number }).width = width
      }
    },
    freezeColumn: (columnKey: string) => {
      const index = state.gridColumns.findIndex((x) => x.key === columnKey)
      if (state.gridColumns[index]) {
        ;(state.gridColumns[index] as CalculatedColumn<any, any> & { frozen?: boolean }).frozen =
          true
      }
    },
    unfreezeColumn: (columnKey: string) => {
      const index = state.gridColumns.findIndex((x) => x.key === columnKey)
      if (state.gridColumns[index]) {
        ;(state.gridColumns[index] as CalculatedColumn<any, any> & { frozen?: boolean }).frozen =
          false
      }
    },
    updateColumnIdx: (columnKey: string, columnIdx: number) => {
      const index = state.gridColumns.findIndex((x) => x.key === columnKey)
      if (state.gridColumns[index]) {
        ;(state.gridColumns[index] as CalculatedColumn<any, any> & { idx?: number }).idx = columnIdx
      }
      state.gridColumns.sort((a, b) => a.idx - b.idx)
    },

    /* Cells */
    selectedCellPosition: null as { idx: number; rowIdx: number } | null,
    setSelectedCellPosition: (position: { idx: number; rowIdx: number } | null) => {
      state.selectedCellPosition = position
    },

    /* Misc */
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

    editable,
    setEditable: (editable: boolean) => {
      state.editable = editable

      // When changing the editable flag, all grid columns need to be recreated for the editable flag to be propagated.
      state.gridColumns = getInitialGridColumns(
        getGridColumns(state.table, {
          tableId: table.id,
          editable,
          onAddColumn: editable ? onAddColumn : undefined,
          onExpandJSONEditor,
          onExpandTextEditor,
        }),
        { gridColumns: state.gridColumns }
      )
    },

    /* Filters (NOTE: this is only for the new AI filter bar) */
    filters: [] as Filter[],
    setFilters: (filters: Filter[]) => {
      state.filters = filters
    },
    clearFilters: () => {
      state.filters = []
    },
  })

  return state
}

export type TableEditorTableState = ReturnType<typeof createTableEditorTableState>

export const TableEditorTableStateContext = createContext<TableEditorTableState>(undefined as any)

type TableEditorTableStateContextProviderProps = Omit<
  Parameters<typeof createTableEditorTableState>[0],
  'onAddColumn' | 'onExpandJSONEditor' | 'onExpandTextEditor'
>

export const TableEditorTableStateContextProvider = ({
  children,
  projectRef,
  table,
  ...props
}: PropsWithChildren<TableEditorTableStateContextProviderProps>) => {
  const showIndexAdvisor = useFlag('ShowIndexAdvisorOnTableEditor')
  const tableEditorSnap = useTableEditorStateSnapshot()
  const state = useRef(
    createTableEditorTableState({
      ...props,
      projectRef,
      table,
      onAddColumn: tableEditorSnap.onAddColumn,
      onExpandJSONEditor: (column: string, row: SupaRow) => {
        tableEditorSnap.onExpandJSONEditor({
          column,
          row,
          value: JSON.stringify(row[column]) || '',
        })
      },
      onExpandTextEditor: (column: string, row: SupaRow) => {
        tableEditorSnap.onExpandTextEditor(column, row)
      },
    })
  ).current

  useEffect(() => {
    if (typeof window !== 'undefined') {
      return subscribe(state, () => {
        saveTableEditorStateToLocalStorageDebounced({
          gridColumns: state.gridColumns,
          projectRef,
          tableId: state.table.id,
        })
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    // We can use a === check here because react-query is good
    // about returning objects with the same ref / different ref
    if (state._originalTableRef !== table) {
      state.updateTable(table)
    }
  }, [table])

  useEffect(() => {
    if (state.editable !== props.editable) {
      state.setEditable(props.editable ?? true)
    }
  }, [props.editable, state])

  return (
    <TableEditorTableStateContext.Provider value={state}>
      {showIndexAdvisor && state.table.schema ? (
        <TableIndexAdvisorProvider schema={state.table.schema ?? 'public'} table={state.table.name}>
          {children}
        </TableIndexAdvisorProvider>
      ) : (
        children
      )}
    </TableEditorTableStateContext.Provider>
  )
}

export const useTableEditorTableStateSnapshot = (options?: Parameters<typeof useSnapshot>[1]) => {
  const state = useContext(TableEditorTableStateContext)
  // as TableEditorTableState so this doesn't get marked as readonly,
  // making adopting this state easier since we're migrating from react-tracked
  return useSnapshot(state, options) as TableEditorTableState
}

export type TableEditorTableStateSnapshot = ReturnType<typeof useTableEditorTableStateSnapshot>
