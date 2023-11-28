import { PostgresColumn } from '@supabase/postgres-meta'
import { Dictionary, SupaRow } from 'components/grid'
import { ForeignRowSelectorProps } from 'components/interfaces/TableGridEditor/SidePanelEditor/RowEditor/ForeignRowSelector/ForeignRowSelector'
import { JsonEditValue } from 'components/interfaces/TableGridEditor/SidePanelEditor/RowEditor/RowEditor.types'
import { PropsWithChildren, createContext, useContext, useRef } from 'react'
import { proxy, useSnapshot } from 'valtio'

type ForeignKey = {
  foreignKey: NonNullable<ForeignRowSelectorProps['foreignKey']>
  row: Dictionary<any>
  column: PostgresColumn
}

export type SidePanel =
  | { type: 'row'; row?: Dictionary<any> }
  | { type: 'column'; column?: PostgresColumn }
  | { type: 'table'; mode: 'new' | 'edit' | 'duplicate' }
  | { type: 'schema'; mode: 'new' | 'edit' }
  | { type: 'json'; jsonValue: JsonEditValue }
  | {
      type: 'foreign-row-selector'
      foreignKey: ForeignKey
    }
  | { type: 'csv-import' }

export type ConfirmationDialog =
  | { type: 'table'; isDeleteWithCascade: boolean }
  | { type: 'column'; column: PostgresColumn; isDeleteWithCascade: boolean }
  // [Joshen] Just FYI callback, numRows, allRowsSelected is a temp workaround so that
  // DeleteConfirmationDialog can trigger dispatch methods after the successful deletion of rows.
  // Once we deprecate react tracked and move things to valtio, we can remove this.
  | {
      type: 'row'
      rows: SupaRow[]
      numRows?: number
      allRowsSelected?: boolean
      callback?: () => void
    }

export type UIState =
  | {
      open: 'none'
    }
  | {
      open: 'side-panel'
      sidePanel: SidePanel
    }
  | {
      open: 'confirmation-dialog'
      confirmationDialog: ConfirmationDialog
    }

export const createTableEditorState = () => {
  const state = proxy({
    selectedSchemaName: 'public',
    setSelectedSchemaName: (schemaName: string) => {
      state.selectedSchemaName = schemaName
    },

    page: 1,
    setPage: (page: number) => {
      state.page = page
    },
    rowsPerPage: 100,
    setRowsPerPage: (rowsPerPage: number) => {
      state.rowsPerPage = rowsPerPage
    },

    ui: { open: 'none' } as UIState,
    get sidePanel() {
      return state.ui.open === 'side-panel' ? state.ui.sidePanel : undefined
    },
    get confirmationDialog() {
      return state.ui.open === 'confirmation-dialog' ? state.ui.confirmationDialog : undefined
    },

    closeSidePanel: () => {
      state.ui = { open: 'none' }
    },
    closeConfirmationDialog: () => {
      state.ui = { open: 'none' }
    },

    onAddSchema: () => {
      state.ui = {
        open: 'side-panel',
        sidePanel: { type: 'schema', mode: 'new' },
      }
    },

    /* Tables */
    onAddTable: () => {
      state.ui = {
        open: 'side-panel',
        sidePanel: { type: 'table', mode: 'new' },
      }
    },
    onEditTable: () => {
      state.ui = {
        open: 'side-panel',
        sidePanel: { type: 'table', mode: 'edit' },
      }
    },
    onDuplicateTable: () => {
      state.ui = {
        open: 'side-panel',
        sidePanel: { type: 'table', mode: 'duplicate' },
      }
    },
    onDeleteTable: () => {
      state.ui = {
        open: 'confirmation-dialog',
        confirmationDialog: { type: 'table', isDeleteWithCascade: false },
      }
    },

    /* Columns */
    onAddColumn: () => {
      state.ui = {
        open: 'side-panel',
        sidePanel: { type: 'column' },
      }
    },
    onEditColumn: (column: PostgresColumn) => {
      state.ui = {
        open: 'side-panel',
        sidePanel: { type: 'column', column },
      }
    },
    onDeleteColumn: (column: PostgresColumn) => {
      state.ui = {
        open: 'confirmation-dialog',
        confirmationDialog: { type: 'column', column, isDeleteWithCascade: false },
      }
    },

    /* Rows */
    onAddRow: () => {
      state.ui = {
        open: 'side-panel',
        sidePanel: { type: 'row' },
      }
    },
    onEditRow: (row: Dictionary<any>) => {
      state.ui = {
        open: 'side-panel',
        sidePanel: { type: 'row', row },
      }
    },
    onDeleteRows: (
      rows: SupaRow[],
      meta: { numRows?: number; allRowsSelected: boolean; callback?: () => void } = {
        numRows: 0,
        allRowsSelected: false,
        callback: () => {},
      }
    ) => {
      const { numRows, allRowsSelected, callback } = meta
      state.ui = {
        open: 'confirmation-dialog',
        confirmationDialog: { type: 'row', rows, numRows, allRowsSelected, callback },
      }
    },

    /* Misc */
    onExpandJSONEditor: (jsonValue: JsonEditValue) => {
      state.ui = {
        open: 'side-panel',
        sidePanel: { type: 'json', jsonValue },
      }
    },
    onEditForeignKeyColumnValue: (foreignKey: ForeignKey) => {
      state.ui = {
        open: 'side-panel',
        sidePanel: { type: 'foreign-row-selector', foreignKey },
      }
    },
    onImportData: () => {
      state.ui = {
        open: 'side-panel',
        sidePanel: { type: 'csv-import' },
      }
    },

    /* Utils */
    toggleConfirmationIsWithCascade: (overrideIsDeleteWithCascade?: boolean) => {
      if (
        state.ui.open === 'confirmation-dialog' &&
        (state.ui.confirmationDialog.type === 'column' ||
          state.ui.confirmationDialog.type === 'table')
      ) {
        state.ui.confirmationDialog.isDeleteWithCascade =
          overrideIsDeleteWithCascade ?? !state.ui.confirmationDialog.isDeleteWithCascade
      }
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
