import type { QueryClient } from '@tanstack/react-query'
import { type Entity, isTableLike } from 'data/table-editor/table-editor-types'
import { tableRowKeys } from 'data/table-rows/keys'
import type { TableRowsData } from 'data/table-rows/table-rows-query'
import type { Dictionary } from 'types'

import { PendingAddRow, PendingDeleteRow, SupaRow, isPendingAddRow } from '../types'
import {
  type AddRowPayload,
  type DeleteRowPayload,
  type EditCellContentPayload,
  NewQueuedOperation,
  QueuedOperation,
  QueuedOperationType,
} from '@/state/table-editor-operation-queue.types'

interface GenerateTableChangeKeyArgs {
  type: QueuedOperationType
  tableId: number
  columnName?: string
  rowIdentifiers?: Record<string, unknown>
  tempId?: string
}

export function generateTableChangeKeyFromOperation(operation: NewQueuedOperation): string {
  if (operation.type === QueuedOperationType.EDIT_CELL_CONTENT) {
    const payload = operation.payload as EditCellContentPayload
    return generateTableChangeKey({
      type: operation.type,
      tableId: operation.tableId,
      columnName: payload.columnName,
      rowIdentifiers: payload.rowIdentifiers,
    })
  }

  if (operation.type === QueuedOperationType.ADD_ROW) {
    const payload = operation.payload as AddRowPayload
    return generateTableChangeKey({
      type: operation.type,
      tableId: operation.tableId,
      tempId: payload.tempId,
    })
  }

  if (operation.type === QueuedOperationType.DELETE_ROW) {
    const payload = operation.payload as DeleteRowPayload
    return generateTableChangeKey({
      type: operation.type,
      tableId: operation.tableId,
      rowIdentifiers: payload.rowIdentifiers,
    })
  }

  // Need to explicitly handle other operations
  throw new Error(`Unknown operation type: ${operation.type}`)
}

export function generateTableChangeKey({
  rowIdentifiers,
  columnName,
  tableId,
  type,
  tempId,
}: GenerateTableChangeKeyArgs): string {
  // For ADD_ROW, use tempId
  if (type === QueuedOperationType.ADD_ROW && tempId) {
    return `${type}:${tableId}:${tempId}`
  }

  // For DELETE_ROW, use rowIdentifiers only (no columnName)
  if (type === QueuedOperationType.DELETE_ROW) {
    const rowIdentifiersKey = Object.entries(rowIdentifiers ?? {})
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}:${value}`)
      .join('|')
    return `${type}:${tableId}:${rowIdentifiersKey}`
  }

  // For EDIT_CELL_CONTENT, use columnName and rowIdentifiers
  const rowIdentifiersKey = Object.entries(rowIdentifiers ?? {})
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}:${value}`)
    .join('|')
  return `${type}:${tableId}:${columnName}:${rowIdentifiersKey}`
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

/**
 * Apply ADD_ROW optimistic update - add row with __tempId marker at the top
 */
export function applyRowAdd(
  rows: SupaRow[],
  tempId: string,
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
    }) as PendingAddRow[]
  }

  // Add new row at the top of the table
  const newRow: PendingAddRow = {
    idx: -1, // Use -1 to indicate it's a pending row (not yet in DB)
    ...rowData,
    __tempId: tempId,
  }
  return [newRow, ...rows]
}

/**
 * Apply DELETE_ROW optimistic update - mark row with __isDeleted marker
 */
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

/**
 * Remove a row from the list (used when cancelling ADD_ROW)
 */
export function removeRowByTempId(rows: SupaRow[], tempId: string): SupaRow[] {
  return rows.filter((row) => !isPendingAddRow(row) || row.__tempId !== tempId)
}

/**
 * Unmark a row as deleted (used when cancelling DELETE_ROW)
 */
export function unmarkRowAsDeleted(
  rows: SupaRow[],
  rowIdentifiers: Dictionary<unknown>
): SupaRow[] {
  return rows.map((row) => {
    const rowMatches = rowMatchesIdentifiers(row, rowIdentifiers)
    if (rowMatches) {
      const { __isDeleted, ...rest } = row as PendingDeleteRow
      return rest
    }
    return row
  })
}

interface QueueCellEditParams {
  queryClient: QueryClient
  queueOperation: (operation: NewQueuedOperation) => void
  projectRef: string
  tableId: number
  table: Entity
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
  rowIdentifiers,
  columnName,
  oldValue,
  newValue,
  enumArrayColumns,
}: QueueCellEditParams) {
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
  tempId: string
  rowData: Dictionary<unknown>
  enumArrayColumns?: string[]
}

export function queueRowAddWithOptimisticUpdate({
  queryClient,
  queueOperation,
  projectRef,
  tableId,
  table,
  tempId,
  rowData,
  enumArrayColumns,
}: QueueRowAddParams) {
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
      rows: applyRowAdd(old.rows, tempId, rowData),
    }
  })
}

interface QueueRowDeleteParams {
  queryClient: QueryClient
  queueOperation: (operation: NewQueuedOperation) => void
  projectRef: string
  tableId: number
  table: Entity
  rowIdentifiers: Dictionary<unknown>
  originalRow: Dictionary<unknown>
}

export function queueRowDeleteWithOptimisticUpdate({
  queryClient,
  queueOperation,
  projectRef,
  tableId,
  table,
  rowIdentifiers,
  originalRow,
}: QueueRowDeleteParams) {
  // Queue the operation
  queueOperation({
    type: QueuedOperationType.DELETE_ROW,
    tableId,
    payload: {
      rowIdentifiers,
      originalRow,
      table,
    },
  })

  // Apply optimistic update to the UI
  const queryKey = tableRowKeys.tableRows(projectRef, { table: { id: tableId } })
  queryClient.setQueriesData<TableRowsData>({ queryKey }, (old) => {
    if (!old) return old
    return {
      ...old,
      rows: markRowAsDeleted(old.rows, rowIdentifiers),
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
          const { rowIdentifiers, columnName, newValue } =
            operation.payload as EditCellContentPayload
          rows = applyCellEdit(rows, columnName, rowIdentifiers, newValue)
          break
        }
        case QueuedOperationType.ADD_ROW: {
          const { tempId, rowData } = operation.payload as AddRowPayload
          rows = applyRowAdd(rows, tempId, rowData)
          break
        }
        case QueuedOperationType.DELETE_ROW: {
          const { rowIdentifiers } = operation.payload as DeleteRowPayload
          rows = markRowAsDeleted(rows, rowIdentifiers)
          break
        }
        default: {
          // Need to explicitly handle other operations
          throw new Error(`Unknown operation type: ${operation.type}`)
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

    queueRowDeleteWithOptimisticUpdate({
      queryClient,
      queueOperation,
      projectRef,
      tableId: table.id,
      table: table,
      rowIdentifiers,
      originalRow: row,
    })
  }
}
