import type { PostgresColumn } from '@supabase/postgres-meta'
import { PropsWithChildren, createContext, useContext } from 'react'
import { proxy, useSnapshot } from 'valtio'

import { useConstant } from 'common'
import type { SupaRow } from 'components/grid/types'
import {
  generateTableChangeKey,
  generateTableChangeKeyFromOperation,
} from 'components/grid/utils/queueOperationUtils'
import { ForeignKey } from 'components/interfaces/TableGridEditor/SidePanelEditor/ForeignKeySelector/ForeignKeySelector.types'
import type { EditValue } from 'components/interfaces/TableGridEditor/SidePanelEditor/RowEditor/RowEditor.types'
import type { TableField } from 'components/interfaces/TableGridEditor/SidePanelEditor/TableEditor/TableEditor.types'
import type { Dictionary } from 'types'

import {
  NewQueuedOperation,
  QueuedOperationType,
  type AddRowPayload,
  type DeleteRowPayload,
  type EditCellContentPayload,
  type OperationQueueState,
  type QueuedOperation,
  type QueueStatus,
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
    onViewOperationQueue: () => {
      state.ui = {
        open: 'side-panel',
        sidePanel: { type: 'operation-queue' },
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
     * Handles conflict resolution:
     * - DELETE_ROW on a row: remove any pending EDIT_CELL ops for that row
     * - EDIT_CELL on a row pending deletion: reject (console.warn)
     * - EDIT_CELL on a newly added row: merge edit into ADD_ROW's rowData
     * - DELETE_ROW on a newly added row: cancel both operations
     */
    queueOperation: (operation: NewQueuedOperation) => {
      // Conflict resolution for DELETE_ROW operations
      if (operation.type === QueuedOperationType.DELETE_ROW) {
        const deletePayload = operation.payload as DeleteRowPayload
        const rowIdentifiers = deletePayload.rowIdentifiers

        // Check if this row was newly added (by tempId)
        const tempId = (deletePayload.originalRow as any)?.__tempId
        if (tempId) {
          // If deleting a newly added row, just remove the ADD_ROW operation
          const addRowKey = generateTableChangeKey({
            type: QueuedOperationType.ADD_ROW,
            tableId: operation.tableId,
            tempId,
          })
          state.operationQueue.operations = state.operationQueue.operations.filter(
            (op) => op.id !== addRowKey
          )

          // Also remove any EDIT_CELL operations for this temp row
          state.operationQueue.operations = state.operationQueue.operations.filter((op) => {
            if (op.type === QueuedOperationType.EDIT_CELL_CONTENT) {
              const editPayload = op.payload as EditCellContentPayload
              // Check if this edit is for the same temp row
              const editTempId = (editPayload.rowIdentifiers as any)?.__tempId
              return editTempId !== tempId
            }
            return true
          })

          // Update status if queue is now empty
          if (state.operationQueue.operations.length === 0) {
            state.operationQueue.status = 'idle'
          } else if (state.operationQueue.status === 'idle') {
            state.operationQueue.status = 'pending'
          }
          return // Don't add the DELETE operation for newly added rows
        }

        // Remove any pending EDIT_CELL operations for the row being deleted
        state.operationQueue.operations = state.operationQueue.operations.filter((op) => {
          if (
            op.type === QueuedOperationType.EDIT_CELL_CONTENT &&
            op.tableId === operation.tableId
          ) {
            const editPayload = op.payload as EditCellContentPayload
            // Check if the row identifiers match
            const identifiersMatch = Object.entries(rowIdentifiers).every(
              ([key, value]) => editPayload.rowIdentifiers[key] === value
            )
            return !identifiersMatch
          }
          return true
        })
      }

      // Conflict resolution for EDIT_CELL_CONTENT operations
      if (operation.type === QueuedOperationType.EDIT_CELL_CONTENT) {
        const editPayload = operation.payload as EditCellContentPayload
        const rowIdentifiers = editPayload.rowIdentifiers

        // Check if this row is pending deletion
        const isPendingDeletion = state.operationQueue.operations.some((op) => {
          if (op.type === QueuedOperationType.DELETE_ROW && op.tableId === operation.tableId) {
            const deletePayload = op.payload as DeleteRowPayload
            return Object.entries(deletePayload.rowIdentifiers).every(
              ([key, value]) => rowIdentifiers[key] === value
            )
          }
          return false
        })

        if (isPendingDeletion) {
          console.warn(
            'Cannot edit a cell on a row that is pending deletion. Remove the delete operation first.'
          )
          return
        }

        // Check if this edit is on a newly added row (by tempId)
        const tempId = (rowIdentifiers as any)?.__tempId
        if (tempId) {
          // Find the ADD_ROW operation
          const addRowIndex = state.operationQueue.operations.findIndex((op) => {
            if (op.type === QueuedOperationType.ADD_ROW && op.tableId === operation.tableId) {
              const addPayload = op.payload as AddRowPayload
              return addPayload.tempId === tempId
            }
            return false
          })

          if (addRowIndex >= 0) {
            // Merge the edit into the ADD_ROW's rowData
            const addOp = state.operationQueue.operations[addRowIndex]
            const addPayload = addOp.payload as AddRowPayload
            addPayload.rowData[editPayload.columnName] = editPayload.newValue
            state.operationQueue.operations[addRowIndex] = {
              ...addOp,
              payload: addPayload,
              timestamp: Date.now(),
            }

            if (state.operationQueue.status === 'idle') {
              state.operationQueue.status = 'pending'
            }
            return // Don't add a separate EDIT_CELL operation
          }
        }
      }

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
          const existingPayload = state.operationQueue.operations[existingOpIndex]
            .payload as EditCellContentPayload
          ;(newOperation.payload as EditCellContentPayload).oldValue = existingPayload.oldValue
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

    /**
     * Check if a row is pending deletion
     */
    hasPendingRowDeletion: (tableId: number, rowIdentifiers: Record<string, unknown>): boolean => {
      return state.operationQueue.operations.some((op) => {
        if (op.type === QueuedOperationType.DELETE_ROW && op.tableId === tableId) {
          const deletePayload = op.payload as DeleteRowPayload
          return Object.entries(rowIdentifiers).every(
            ([key, value]) => deletePayload.rowIdentifiers[key] === value
          )
        }
        return false
      })
    },

    /**
     * Get all pending ADD_ROW operations for a table
     */
    getPendingAddRows: (tableId: number): AddRowPayload[] => {
      return state.operationQueue.operations
        .filter((op) => op.type === QueuedOperationType.ADD_ROW && op.tableId === tableId)
        .map((op) => op.payload as AddRowPayload)
    },

    /**
     * Get operation counts by type, optionally filtered by tableId
     */
    getOperationCounts: (
      tableId?: number
    ): { edits: number; adds: number; deletes: number; total: number } => {
      const operations = tableId
        ? state.operationQueue.operations.filter((op) => op.tableId === tableId)
        : state.operationQueue.operations

      return {
        edits: operations.filter((op) => op.type === QueuedOperationType.EDIT_CELL_CONTENT).length,
        adds: operations.filter((op) => op.type === QueuedOperationType.ADD_ROW).length,
        deletes: operations.filter((op) => op.type === QueuedOperationType.DELETE_ROW).length,
        total: operations.length,
      }
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
