import type { Entity } from 'data/table-editor/table-editor-types'
import type { Dictionary } from 'types'

import { PendingAddRow, SupaRow } from '@/components/grid/types'

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
  rowData: PendingAddRow // Column values for the new row
  table: Entity
  enumArrayColumns?: string[]
}

/**
 * Payload for DELETE_ROW operations
 */
export interface DeleteRowPayload {
  rowIdentifiers: Dictionary<unknown> // Primary key values
  originalRow: SupaRow // Full row for display/undo
  table: Entity
}

export type QueuedOperationPayload = EditCellContentPayload | AddRowPayload | DeleteRowPayload

interface QueuedOperationBase {
  id: string
  tableId: number // Which table this operation belongs to
  timestamp: number
}

export interface EditCellContentOperation extends QueuedOperationBase {
  type: QueuedOperationType.EDIT_CELL_CONTENT
  payload: EditCellContentPayload
}

export interface AddRowOperation extends QueuedOperationBase {
  type: QueuedOperationType.ADD_ROW
  payload: AddRowPayload
}

export interface DeleteRowOperation extends QueuedOperationBase {
  type: QueuedOperationType.DELETE_ROW
  payload: DeleteRowPayload
}

export type QueuedOperation = EditCellContentOperation | AddRowOperation | DeleteRowOperation

interface NewQueuedOperationBase {
  tableId: number
}

export interface NewEditCellContentOperation extends NewQueuedOperationBase {
  type: QueuedOperationType.EDIT_CELL_CONTENT
  payload: EditCellContentPayload
}

export interface NewAddRowOperation extends NewQueuedOperationBase {
  type: QueuedOperationType.ADD_ROW
  payload: AddRowPayload
}

export interface NewDeleteRowOperation extends NewQueuedOperationBase {
  type: QueuedOperationType.DELETE_ROW
  payload: DeleteRowPayload
}

export type NewQueuedOperation =
  | NewEditCellContentOperation
  | NewAddRowOperation
  | NewDeleteRowOperation

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

export function isDeleteRowOperation(op: QueuedOperation): op is DeleteRowOperation {
  return op.type === QueuedOperationType.DELETE_ROW
}

export function isAddRowOperation(op: QueuedOperation): op is AddRowOperation {
  return op.type === QueuedOperationType.ADD_ROW
}

export function isEditCellContentOperation(op: QueuedOperation): op is EditCellContentOperation {
  return op.type === QueuedOperationType.EDIT_CELL_CONTENT
}
