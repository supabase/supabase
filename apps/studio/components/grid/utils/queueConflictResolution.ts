import { isPendingAddRow } from '../types'
import { generateTableChangeKey, rowMatchesIdentifiers } from './queueOperationUtils'
import {
  type NewDeleteRowOperation,
  type NewEditCellContentOperation,
  NewQueuedOperation,
  QueuedOperation,
  QueuedOperationType,
  isDeleteRowOperation,
  isEditCellContentOperation,
} from '@/state/table-editor-operation-queue.types'

export type DeleteConflictResult =
  | { action: 'skip'; filteredOperations: QueuedOperation[] }
  | { action: 'add'; filteredOperations: QueuedOperation[] }

export type EditConflictResult =
  | { action: 'reject'; reason: string }
  | { action: 'merge'; updatedOperations: QueuedOperation[] }
  | { action: 'add' }

export type UpsertResult = {
  operations: QueuedOperation[]
}

function editOperationMatchesTempId(operation: QueuedOperation, tempId: string): boolean {
  if (!isEditCellContentOperation(operation)) return false
  return operation.payload.rowIdentifiers.__tempId === tempId
}

export function operationMatchesRow(
  operation: QueuedOperation,
  tableId: number,
  rowIdentifiers: Record<string, unknown>
): boolean {
  if (operation.tableId !== tableId) return false

  if (
    operation.type === QueuedOperationType.EDIT_CELL_CONTENT ||
    operation.type === QueuedOperationType.DELETE_ROW
  ) {
    return rowMatchesIdentifiers(operation.payload.rowIdentifiers, rowIdentifiers)
  }

  return false
}

export function resolveDeleteRowConflicts(
  operations: readonly QueuedOperation[],
  deleteOperation: NewDeleteRowOperation
): DeleteConflictResult {
  const rowIdentifiers = deleteOperation.payload.rowIdentifiers

  // Check if this row was newly added (by tempId)
  // If deleting a newly added row, filter out the ADD_ROW operation
  const originalRow = deleteOperation.payload.originalRow
  if (isPendingAddRow(originalRow)) {
    const tempId = originalRow.__tempId
    const addRowKey = generateTableChangeKey({
      type: QueuedOperationType.ADD_ROW,
      tableId: deleteOperation.tableId,
      payload: {
        tempId,
        rowData: originalRow,
        table: deleteOperation.payload.table,
      },
    })

    let filteredOperations = operations
      .filter((op) => op.id !== addRowKey)
      .filter((op) => !editOperationMatchesTempId(op, tempId))

    return { action: 'skip', filteredOperations }
  }

  // For existing rows, remove any pending EDIT_CELL operations for the row being deleted
  const filteredOperations = operations.filter(
    (op) => !operationMatchesRow(op, deleteOperation.tableId, rowIdentifiers)
  )

  return { action: 'add', filteredOperations }
}

export function resolveEditCellConflicts(
  operations: readonly QueuedOperation[],
  editOperation: NewEditCellContentOperation
): EditConflictResult {
  const rowIdentifiers = editOperation.payload.rowIdentifiers

  // Check if this row is pending deletion
  const isPendingDeletion = operations.filter(isDeleteRowOperation).some((op) => {
    if (op.tableId === editOperation.tableId) {
      return Object.entries(op.payload.rowIdentifiers).every(
        ([key, value]) => rowIdentifiers[key] === value
      )
    }
    return false
  })

  if (isPendingDeletion) {
    return {
      action: 'reject',
      reason:
        'Cannot edit a cell on a row that is pending deletion. Remove the delete operation first.',
    }
  }

  // Check if this edit is on a newly added row (by tempId)
  const tempId = rowIdentifiers.__tempId
  if (tempId) {
    const addRowIndex = operations.findIndex((op) => {
      if (op.type === QueuedOperationType.ADD_ROW && op.tableId === editOperation.tableId) {
        return op.payload.tempId === tempId
      }
      return false
    })

    if (addRowIndex >= 0) {
      // Merge the edit into the ADD_ROW's rowData
      const updatedOperations = [...operations]
      const addOp = updatedOperations[addRowIndex]
      if (addOp.type === QueuedOperationType.ADD_ROW) {
        const addPayload = { ...addOp.payload }
        addPayload.rowData = {
          ...addPayload.rowData,
          [editOperation.payload.columnName]: editOperation.payload.newValue,
        }

        updatedOperations[addRowIndex] = {
          ...addOp,
          payload: addPayload,
          timestamp: Date.now(),
        }
      }

      return { action: 'merge', updatedOperations }
    }
  }

  return { action: 'add' }
}

export function upsertOperation(
  operations: readonly QueuedOperation[],
  newOperation: NewQueuedOperation
): UpsertResult {
  const operationKey = generateTableChangeKey(newOperation)
  const existingOpIndex = operations.findIndex((op) => op.id === operationKey)

  const queuedOperation: QueuedOperation = {
    ...newOperation,
    id: operationKey,
    timestamp: Date.now(),
  }

  if (existingOpIndex >= 0) {
    const updatedOperations = [...operations]

    // Keep the old value of the operation that is being overwritten
    // When a user edits the same cell multiple times before saving,
    // we need to preserve the original "before edit" value
    const existingOp = operations[existingOpIndex]
    if (
      queuedOperation.type === QueuedOperationType.EDIT_CELL_CONTENT &&
      existingOp.type === QueuedOperationType.EDIT_CELL_CONTENT
    ) {
      queuedOperation.payload.oldValue = existingOp.payload.oldValue
    }

    updatedOperations[existingOpIndex] = queuedOperation
    return { operations: updatedOperations }
  }

  return { operations: [...operations, queuedOperation] }
}
