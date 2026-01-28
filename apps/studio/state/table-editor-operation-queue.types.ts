import type { Entity } from 'data/table-editor/table-editor-types'
import type { Dictionary } from 'types'

/**
 * Extensible enum for queued operation types.
 * Add new operation types here as we expand the queuing system.
 */
export enum QueuedOperationType {
  EDIT_CELL_CONTENT = 'edit_cell_content',
  ADD_ROW = 'add_row',
  DELETE_ROW = 'delete_row',
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
 * Payload for ADD_ROW operations
 */
export interface AddRowPayload {
  tempId: string // Client-generated UUID (row has no PK yet)
  rowData: Dictionary<unknown> // Column values for the new row
  table: Entity
  enumArrayColumns?: string[]
}

/**
 * Payload for DELETE_ROW operations
 */
export interface DeleteRowPayload {
  rowIdentifiers: Dictionary<unknown> // Primary key values
  originalRow: Dictionary<unknown> // Full row for display/undo
  table: Entity
}

/**
 * Union type for all operation payloads.
 * Extend this as new operation types are added.
 */
export type QueuedOperationPayload = EditCellContentPayload | AddRowPayload | DeleteRowPayload

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
