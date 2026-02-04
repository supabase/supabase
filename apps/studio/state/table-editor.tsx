import type { PostgresColumn } from '@supabase/postgres-meta'
import { useConstant } from 'common'
import type { SupaRow } from 'components/grid/types'
import {
  generateTableChangeKey,
  generateTableChangeKeyFromOperation,
} from 'components/grid/utils/queueOperationUtils'
import { ForeignKey } from 'components/interfaces/TableGridEditor/SidePanelEditor/ForeignKeySelector/ForeignKeySelector.types'
import type { EditValue } from 'components/interfaces/TableGridEditor/SidePanelEditor/RowEditor/RowEditor.types'
import type { TableField } from 'components/interfaces/TableGridEditor/SidePanelEditor/TableEditor/TableEditor.types'
import { PropsWithChildren, createContext, useContext } from 'react'
import type { Dictionary } from 'types'
import { proxy, useSnapshot } from 'valtio'

import {
  NewQueuedOperation,
  type OperationQueueState,
  type QueueStatus,
  type QueuedOperation,
  QueuedOperationType,
} from './table-editor-operation-queue.types'

export const TABLE_EDITOR_DEFAULT_ROWS_PER_PAGE = 100

type ForeignKeyState = {
  foreignKey: ForeignKey
  row: Dictionary<any>
  column: PostgresColumn
}

export type SidePanel =
  | { type: 'cell'; value?: { column: string; row: Dictionary<any> } }
  | { type: 'row'; row?: Dictionary<any> }
  | { type: 'column'; column?: PostgresColumn }
  | { type: 'table'; mode: 'new' | 'edit' | 'duplicate'; templateData?: Partial<TableField> }
  | { type: 'schema'; mode: 'new' | 'edit' }
  | { type: 'json'; jsonValue: EditValue }
  | {
      type: 'foreign-row-selector'
      foreignKey: ForeignKeyState
    }
  | { type: 'csv-import'; file?: File }
  | { type: 'operation-queue' }

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

/**
 * Global table editor state for the table editor across multiple tables.
 * See ./table-editor-table.tsx for table specific state.
 */
export const createTableEditorState = () => {
  const state = proxy({
    rowsPerPage: TABLE_EDITOR_DEFAULT_ROWS_PER_PAGE,
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
    onAddTable: (templateData?: Partial<TableField>) => {
      state.ui = {
        open: 'side-panel',
        sidePanel: { type: 'table', mode: 'new', templateData },
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
    onExpandJSONEditor: (jsonValue: EditValue) => {
      state.ui = {
        open: 'side-panel',
        sidePanel: { type: 'json', jsonValue },
      }
    },
    onExpandTextEditor: (column: string, row: Dictionary<any>) => {
      state.ui = {
        open: 'side-panel',
        sidePanel: { type: 'cell', value: { column, row } },
      }
    },
    onEditForeignKeyColumnValue: (foreignKey: ForeignKeyState) => {
      state.ui = {
        open: 'side-panel',
        sidePanel: { type: 'foreign-row-selector', foreignKey },
      }
    },
    onImportData: (file?: File) => {
      state.ui = {
        open: 'side-panel',
        sidePanel: { type: 'csv-import', file },
      }
    },
    toggleViewOperationQueue: () => {
      if (state.ui.open === 'side-panel' && state.ui.sidePanel.type === 'operation-queue') {
        state.closeSidePanel()
      } else {
        state.ui = {
          open: 'side-panel',
          sidePanel: { type: 'operation-queue' },
        }
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

    // ========================================================================
    // Operation Queue
    // ========================================================================

    operationQueue: {
      operations: [],
      status: 'idle',
    } as OperationQueueState,

    /**
     * Queue a new operation for later processing.
     * If an operation with the same key already exists, it will be overwritten.
     */
    queueOperation: (operation: NewQueuedOperation) => {
      const operationKey = generateTableChangeKeyFromOperation(operation)
      const existingOpIndex = state.operationQueue.operations.findIndex(
        (op) => op.id === operationKey
      )

      const newOperation: QueuedOperation = {
        ...operation,
        id: operationKey,
        timestamp: Date.now(),
      }

      if (existingOpIndex >= 0) {
        // [Ali] Keep the old value of the operation that is being overwritten, in case someone edits the cell again, it should reference the original value.
        // When a user edits the same cell multiple times before saving, we need to preserve the original "before edit" value, not the intermediate value from the previous queued edit
        if (newOperation.type === QueuedOperationType.EDIT_CELL_CONTENT) {
          newOperation.payload.oldValue =
            state.operationQueue.operations[existingOpIndex].payload.oldValue
        }
        state.operationQueue.operations[existingOpIndex] = newOperation
      } else {
        state.operationQueue.operations.push(newOperation)
      }

      if (state.operationQueue.status === 'idle') {
        state.operationQueue.status = 'pending'
      }
    },

    /**
     * Clear all operations from the queue
     */
    clearQueue: () => {
      state.operationQueue.operations = []
      state.operationQueue.status = 'idle'
    },

    /**
     * Remove a specific operation from the queue
     */
    removeOperation: (operationId: string) => {
      state.operationQueue.operations = state.operationQueue.operations.filter(
        (op) => op.id !== operationId
      )
      if (state.operationQueue.operations.length === 0) {
        state.operationQueue.status = 'idle'
      }
    },

    /**
     * Update the queue status
     */
    setQueueStatus: (status: QueueStatus) => {
      state.operationQueue.status = status
    },

    /**
     * Check if there are any pending operations in the queue
     */
    get hasPendingOperations(): boolean {
      return state.operationQueue.operations.length > 0
    },

    hasPendingCellChange: (
      type: QueuedOperationType,
      tableId: number,
      rowIdentifiers: Record<string, unknown>,
      columnName: string
    ): boolean => {
      const key = generateTableChangeKey({
        type,
        tableId,
        columnName,
        rowIdentifiers,
      })
      return state.operationQueue.operations.some((op) => op.id === key)
    },
  })

  return state
}

export type TableEditorState = ReturnType<typeof createTableEditorState>

export const TableEditorStateContext = createContext<TableEditorState>(createTableEditorState())

export const TableEditorStateContextProvider = ({ children }: PropsWithChildren<{}>) => {
  const state = useConstant(createTableEditorState)

  return (
    <TableEditorStateContext.Provider value={state}>{children}</TableEditorStateContext.Provider>
  )
}

export const useTableEditorStateSnapshot = (options?: Parameters<typeof useSnapshot>[1]) => {
  const state = useContext(TableEditorStateContext)
  return useSnapshot(state, options)
}
