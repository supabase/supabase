import type { Entity } from 'data/table-editor/table-editor-types'
import type { Dictionary } from 'types'

/**
 * Extensible enum for queued operation types.
 * Add new operation types here as we expand the queuing system.
 */
export enum QueuedOperationType {
  EDIT_CELL_CONTENT = 'edit_cell_content',
  // Future: DELETE_ROW, ADD_ROW, EDIT_COLUMN, etc.
}

/**
 * Payload for EDIT_CELL_CONTENT operations
 */
export interface EditCellContentPayload {
  rowIdentifiers: Dictionary<unknown> // Primary key values to identify the row
  columnName: string
  oldValue: unknown
  newValue: unknown
  // For mutation support
  table: Entity
  enumArrayColumns?: string[]
}

/**
 * Union type for all operation payloads.
 * Extend this as new operation types are added.
 */
export type QueuedOperationPayload = EditCellContentPayload

/**
 * Individual queued operation
 */
export interface QueuedOperation {
  id: string
  type: QueuedOperationType
  tableId: number // Which table this operation belongs to
  timestamp: number
  payload: QueuedOperationPayload
}

export type NewQueuedOperation = Omit<QueuedOperation, 'id' | 'timestamp'>

/**
 * Status of the overall operation queue
 */
export type QueueStatus = 'idle' | 'pending' | 'saving' | 'error'

/**
 * Operation queue state structure
 */
export interface OperationQueueState {
  operations: QueuedOperation[]
  status: QueueStatus
}
