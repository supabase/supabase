import type { QueryClient } from '@tanstack/react-query'
import { isTableLike, type Entity } from 'data/table-editor/table-editor-types'
import { tableRowKeys } from 'data/table-rows/keys'
import type { TableRowsData } from 'data/table-rows/table-rows-query'
import type { Dictionary } from 'types'

import { isPendingAddRow, PendingAddRow, PendingDeleteRow, SupaRow } from '../types'
import {
  EditCellContentOperation,
  NewQueuedOperation,
  QueuedOperation,
  QueuedOperationType,
} from '@/state/table-editor-operation-queue.types'

interface EditCellKeyOperation
  extends Omit<EditCellContentOperation, 'payload' | 'id' | 'timestamp'> {
  type: QueuedOperationType.EDIT_CELL_CONTENT
  tableId: number
  payload: {
    columnName: string
    rowIdentifiers: Dictionary<unknown>
  }
}

export function generateTableChangeKey(
  operation: NewQueuedOperation | EditCellKeyOperation
): string {
  if (operation.type === QueuedOperationType.EDIT_CELL_CONTENT) {
    const { columnName, rowIdentifiers } = operation.payload
    const rowIdentifiersKey = Object.entries(rowIdentifiers)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}:${value}`)
      .join('|')
    return `${operation.type}:${operation.tableId}:${columnName}:${rowIdentifiersKey}`
  }

  if (operation.type === QueuedOperationType.ADD_ROW) {
    return `${operation.type}:${operation.tableId}:${operation.payload.tempId}`
  }

  if (operation.type === QueuedOperationType.DELETE_ROW) {
    const { rowIdentifiers } = operation.payload
    const rowIdentifiersKey = Object.entries(rowIdentifiers)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}:${value}`)
      .join('|')
    return `${operation.type}:${operation.tableId}:${rowIdentifiersKey}`
  }

  // Exhaustive check - TypeScript will error if we miss a case
  const _exhaustiveCheck: never = operation
  throw new Error(`Unknown operation type: ${(_exhaustiveCheck as { type: string }).type}`)
}

export function rowMatchesIdentifiers(
  row: Dictionary<unknown>,
  rowIdentifiers: Dictionary<unknown>
): boolean {
  const identifierEntries = Object.entries(rowIdentifiers)
  if (identifierEntries.length === 0) return false
  return identifierEntries.every(([key, value]) => row[key] === value)
}

export function applyCellEdit(
  rows: SupaRow[],
  columnName: string,
  rowIdentifiers: Dictionary<unknown>,
  newValue: unknown
): SupaRow[] {
  return rows.map((row) => {
    const rowMatches = rowMatchesIdentifiers(row, rowIdentifiers)
    if (rowMatches) {
      return { ...row, [columnName]: newValue }
    }
    return row
  })
}

export function applyRowAdd(
  rows: SupaRow[],
  tempId: string,
  idx: number,
  rowData: Dictionary<unknown>
): (PendingAddRow | SupaRow)[] {
  // Check if row with this tempId already exists
  const existingIndex = rows.findIndex((row) => isPendingAddRow(row) && row.__tempId === tempId)
  if (existingIndex >= 0) {
    // Update existing row in place
    return rows.map((row, index) => {
      if (index === existingIndex) {
        return { ...row, ...rowData, __tempId: tempId }
      }
      return row
    })
  }

  const newRow: PendingAddRow = {
    idx,
    ...rowData,
    __tempId: tempId,
  }
  return [newRow, ...rows]
}

export function markRowAsDeleted(
  rows: SupaRow[],
  rowIdentifiers: Dictionary<unknown>
): (PendingDeleteRow | SupaRow)[] {
  return rows.map((row): PendingDeleteRow | SupaRow => {
    const rowMatches = rowMatchesIdentifiers(row, rowIdentifiers)
    if (rowMatches) {
      return { ...row, __isDeleted: true }
    }
    return row
  })
}

export function removeRow(rows: SupaRow[], rowIdentifiers: Dictionary<unknown>): SupaRow[] {
  return rows.filter((row) => !rowMatchesIdentifiers(row, rowIdentifiers))
}

interface QueueCellEditParams {
  queryClient: QueryClient
  queueOperation: (operation: NewQueuedOperation) => void
  projectRef: string
  tableId: number
  table: Entity
  row: SupaRow
  rowIdentifiers: Dictionary<unknown>
  columnName: string
  oldValue: unknown
  newValue: unknown
  enumArrayColumns?: string[]
}

export function queueCellEditWithOptimisticUpdate({
  queryClient,
  queueOperation,
  projectRef,
  tableId,
  table,
  row,
  rowIdentifiers: callerRowIdentifiers,
  columnName,
  oldValue,
  newValue,
  enumArrayColumns,
}: QueueCellEditParams) {
  // Updated row identifiers to include __tempId for pending add rows so edits merge into ADD_ROW operation
  const rowIdentifiers: Dictionary<unknown> = { ...callerRowIdentifiers }
  if (isPendingAddRow(row)) {
    rowIdentifiers.__tempId = row.__tempId
  }

  // Queue the operation
  queueOperation({
    type: QueuedOperationType.EDIT_CELL_CONTENT,
    tableId,
    payload: {
      rowIdentifiers,
      columnName,
      oldValue,
      newValue,
      table,
      enumArrayColumns,
    },
  })

  // Apply optimistic update to the UI
  const queryKey = tableRowKeys.tableRows(projectRef, { table: { id: tableId } })
  queryClient.setQueriesData<TableRowsData>({ queryKey }, (old) => {
    if (!old) return old
    return {
      ...old,
      rows: applyCellEdit(old.rows, columnName, rowIdentifiers, newValue),
    }
  })
}

interface QueueRowAddParams {
  queryClient: QueryClient
  queueOperation: (operation: NewQueuedOperation) => void
  projectRef: string
  tableId: number
  table: Entity
  rowData: PendingAddRow
  enumArrayColumns?: string[]
}

export function queueRowAddWithOptimisticUpdate({
  queryClient,
  queueOperation,
  projectRef,
  tableId,
  table,
  rowData,
  enumArrayColumns,
}: QueueRowAddParams) {
  // Generate unique idx and tempId for this pending row
  const idx = -Date.now()
  const tempId = String(idx)

  // Queue the operation
  queueOperation({
    type: QueuedOperationType.ADD_ROW,
    tableId,
    payload: {
      tempId,
      rowData,
      table,
      enumArrayColumns,
    },
  })

  // Apply optimistic update to the UI
  const queryKey = tableRowKeys.tableRows(projectRef, { table: { id: tableId } })
  queryClient.setQueriesData<TableRowsData>({ queryKey }, (old) => {
    if (!old) return old
    return {
      ...old,
      rows: applyRowAdd(old.rows, tempId, idx, rowData),
    }
  })
}

interface ReapplyOptimisticUpdatesParams {
  queryClient: QueryClient
  projectRef: string
  tableId: number
  operations: readonly QueuedOperation[]
}

export function reapplyOptimisticUpdates({
  queryClient,
  projectRef,
  tableId,
  operations,
}: ReapplyOptimisticUpdatesParams) {
  const tableOperations = operations.filter((op) => op.tableId === tableId)
  if (tableOperations.length === 0) return

  const queryKey = tableRowKeys.tableRows(projectRef, { table: { id: tableId } })
  queryClient.setQueriesData<TableRowsData>({ queryKey }, (old) => {
    if (!old) return old

    let rows = [...old.rows]
    for (const operation of tableOperations) {
      switch (operation.type) {
        case QueuedOperationType.EDIT_CELL_CONTENT: {
          const { rowIdentifiers, columnName, newValue } = operation.payload
          rows = applyCellEdit(rows, columnName, rowIdentifiers, newValue)
          break
        }
        case QueuedOperationType.ADD_ROW: {
          const { tempId, rowData } = operation.payload
          // Derive idx from tempId (tempId is stringified negative timestamp)
          const idx = Number(tempId)
          rows = applyRowAdd(rows, tempId, idx, rowData)
          break
        }
        case QueuedOperationType.DELETE_ROW: {
          const { rowIdentifiers } = operation.payload
          rows = markRowAsDeleted(rows, rowIdentifiers)
          break
        }
        default: {
          // Need to explicitly handle other operations
          throw new Error(`Unknown operation type: ${(operation as never)['type']}`)
        }
      }
    }

    return { ...old, rows }
  })
}

interface QueueRowDeletesParams {
  rows: SupaRow[]
  table: Entity
  queryClient: QueryClient
  queueOperation: (operation: NewQueuedOperation) => void
  projectRef: string | undefined
}

/**
 * Queue multiple row delete operations with optimistic updates.
 * Caller is responsible for checking if queue mode is enabled before calling.
 */
export function queueRowDeletesWithOptimisticUpdate({
  rows,
  table,
  queryClient,
  queueOperation,
  projectRef,
}: QueueRowDeletesParams): void {
  // [Ali] We can handle these better in the future
  // right now this is a pretty abnormal case of this occurring
  if (!projectRef) {
    console.error('Cannot queue row deletes: projectRef is required')
    return
  }

  if (!isTableLike(table)) {
    console.error('Cannot queue row deletes: table must be a TableLike entity')
    return
  }

  if (table.primary_keys.length === 0) {
    console.error('Cannot queue row deletes: table has no primary keys')
    return
  }

  for (const row of rows) {
    const rowIdentifiers: Record<string, unknown> = {}
    table.primary_keys.forEach((pk) => {
      rowIdentifiers[pk.name] = row[pk.name]
    })

    queueOperation({
      type: QueuedOperationType.DELETE_ROW,
      tableId: table.id,
      payload: {
        rowIdentifiers,
        originalRow: row,
        table,
      },
    })

    const queryKey = tableRowKeys.tableRows(projectRef, { table: { id: table.id } })
    queryClient.setQueriesData<TableRowsData>({ queryKey }, (old) => {
      if (!old) return old

      // For pending add rows, remove completely
      if (isPendingAddRow(row)) {
        return {
          ...old,
          rows: removeRow(old.rows, rowIdentifiers),
        }
      }

      // For existing rows, mark as deleted
      return {
        ...old,
        rows: markRowAsDeleted(old.rows, rowIdentifiers),
      }
    })
  }
}
