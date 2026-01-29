import { generateTableChangeKey, generateTableChangeKeyFromOperation } from './queueOperationUtils'
import {
  type AddRowPayload,
  type DeleteRowPayload,
  type EditCellContentPayload,
  NewQueuedOperation,
  QueuedOperation,
  QueuedOperationType,
} from '@/state/table-editor-operation-queue.types'

// ============================================================================
// Result Types
// ============================================================================

/**
 * Result of resolving DELETE_ROW conflicts
 */
export type DeleteConflictResult =
  | { action: 'skip'; filteredOperations: QueuedOperation[] } // Don't add the delete (was a newly added row), but still filter the queue
  | { action: 'add'; filteredOperations: QueuedOperation[] } // Add delete, here's filtered queue

/**
 * Result of resolving EDIT_CELL_CONTENT conflicts
 */
export type EditConflictResult =
  | { action: 'reject'; reason: string } // Can't edit (row pending deletion)
  | { action: 'merge'; updatedOperations: QueuedOperation[] } // Merged into ADD_ROW
  | { action: 'add' } // Normal add/update

/**
 * Result of upserting an operation into the queue
 */
export type UpsertResult = {
  operations: QueuedOperation[]
  wasUpdate: boolean
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Check if an operation's row identifiers match the given identifiers.
 * Works for both EDIT_CELL_CONTENT and DELETE_ROW operations.
 */
export function operationMatchesRow(
  operation: QueuedOperation,
  tableId: number,
  rowIdentifiers: Record<string, unknown>
): boolean {
  if (operation.tableId !== tableId) return false

  if (operation.type === QueuedOperationType.EDIT_CELL_CONTENT) {
    const payload = operation.payload as EditCellContentPayload
    return Object.entries(rowIdentifiers).every(
      ([key, value]) => payload.rowIdentifiers[key] === value
    )
  }

  if (operation.type === QueuedOperationType.DELETE_ROW) {
    const payload = operation.payload as DeleteRowPayload
    return Object.entries(payload.rowIdentifiers).every(
      ([key, value]) => rowIdentifiers[key] === value
    )
  }

  return false
}

/**
 * Check if an EDIT_CELL operation targets a row with the given tempId.
 */
export function editOperationMatchesTempId(operation: QueuedOperation, tempId: string): boolean {
  if (operation.type !== QueuedOperationType.EDIT_CELL_CONTENT) return false
  const payload = operation.payload as EditCellContentPayload
  return (payload.rowIdentifiers as any)?.__tempId === tempId
}

// ============================================================================
// Conflict Resolution Functions
// ============================================================================

/**
 * Resolve conflicts when adding a DELETE_ROW operation.
 *
 * Handles two scenarios:
 * 1. Deleting a newly added row (has tempId): removes the ADD_ROW op and any EDIT_CELL ops for that row
 * 2. Deleting an existing row: removes any pending EDIT_CELL operations for that row
 *
 * @param operations - Current queue of operations (readonly)
 * @param deleteOperation - The DELETE_ROW operation being added
 * @returns DeleteConflictResult indicating whether to skip or add the operation
 */
export function resolveDeleteRowConflicts(
  operations: readonly QueuedOperation[],
  deleteOperation: NewQueuedOperation
): DeleteConflictResult {
  const deletePayload = deleteOperation.payload as DeleteRowPayload
  const rowIdentifiers = deletePayload.rowIdentifiers

  // Check if this row was newly added (by tempId)
  const tempId = (deletePayload.originalRow as any)?.__tempId
  if (tempId) {
    // If deleting a newly added row, filter out the ADD_ROW operation
    const addRowKey = generateTableChangeKey({
      type: QueuedOperationType.ADD_ROW,
      tableId: deleteOperation.tableId,
      tempId,
    })

    let filteredOperations = operations.filter((op) => op.id !== addRowKey)

    // Also remove any EDIT_CELL operations for this temp row
    filteredOperations = filteredOperations.filter((op) => !editOperationMatchesTempId(op, tempId))

    return { action: 'skip', filteredOperations }
  }

  // For existing rows, remove any pending EDIT_CELL operations for the row being deleted
  const filteredOperations = operations.filter(
    (op) => !operationMatchesRow(op, deleteOperation.tableId, rowIdentifiers)
  )

  return { action: 'add', filteredOperations }
}

/**
 * Resolve conflicts when adding an EDIT_CELL_CONTENT operation.
 *
 * Handles three scenarios:
 * 1. Editing a row pending deletion: reject the edit
 * 2. Editing a newly added row: merge the edit into the ADD_ROW's rowData
 * 3. Normal edit: proceed with add/update
 *
 * @param operations - Current queue of operations (readonly)
 * @param editOperation - The EDIT_CELL_CONTENT operation being added
 * @returns EditConflictResult indicating how to handle the operation
 */
export function resolveEditCellConflicts(
  operations: readonly QueuedOperation[],
  editOperation: NewQueuedOperation
): EditConflictResult {
  const editPayload = editOperation.payload as EditCellContentPayload
  const rowIdentifiers = editPayload.rowIdentifiers

  // Check if this row is pending deletion
  const isPendingDeletion = operations.some((op) => {
    if (op.type === QueuedOperationType.DELETE_ROW && op.tableId === editOperation.tableId) {
      const deletePayload = op.payload as DeleteRowPayload
      return Object.entries(deletePayload.rowIdentifiers).every(
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
  const tempId = (rowIdentifiers as any)?.__tempId
  if (tempId) {
    // Find the ADD_ROW operation
    const addRowIndex = operations.findIndex((op) => {
      if (op.type === QueuedOperationType.ADD_ROW && op.tableId === editOperation.tableId) {
        const addPayload = op.payload as AddRowPayload
        return addPayload.tempId === tempId
      }
      return false
    })

    if (addRowIndex >= 0) {
      // Merge the edit into the ADD_ROW's rowData
      const updatedOperations = [...operations]
      const addOp = updatedOperations[addRowIndex]
      const addPayload = { ...(addOp.payload as AddRowPayload) }
      addPayload.rowData = { ...addPayload.rowData, [editPayload.columnName]: editPayload.newValue }

      updatedOperations[addRowIndex] = {
        ...addOp,
        payload: addPayload,
        timestamp: Date.now(),
      }

      return { action: 'merge', updatedOperations }
    }
  }

  // Normal case: proceed with add/update
  return { action: 'add' }
}

/**
 * Upsert an operation into the queue.
 *
 * If an operation with the same key exists:
 * - For EDIT_CELL_CONTENT: preserves the original oldValue
 * - For other types: replaces the operation entirely
 *
 * @param operations - Current queue of operations (readonly)
 * @param newOperation - The operation to add/update
 * @returns UpsertResult with the updated operations array and whether it was an update
 */
export function upsertOperation(
  operations: readonly QueuedOperation[],
  newOperation: NewQueuedOperation
): UpsertResult {
  const operationKey = generateTableChangeKeyFromOperation(newOperation)
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
    if (queuedOperation.type === QueuedOperationType.EDIT_CELL_CONTENT) {
      const existingPayload = operations[existingOpIndex].payload as EditCellContentPayload
      ;(queuedOperation.payload as EditCellContentPayload).oldValue = existingPayload.oldValue
    }

    updatedOperations[existingOpIndex] = queuedOperation
    return { operations: updatedOperations, wasUpdate: true }
  }

  return { operations: [...operations, queuedOperation], wasUpdate: false }
}
