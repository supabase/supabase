import type { QueryClient } from '@tanstack/react-query'

import type { Entity } from 'data/table-editor/table-editor-types'
import { tableRowKeys } from 'data/table-rows/keys'
import type { TableRowsData } from 'data/table-rows/table-rows-query'
import {
  NewQueuedOperation,
  QueuedOperation,
  QueuedOperationType,
  type EditCellContentPayload,
} from '@/state/table-editor-operation-queue.types'
import type { Dictionary } from 'types'
import { SupaRow } from '../types'

interface GenerateTableChangeKeyArgs {
  type: QueuedOperationType
  tableId: number
  columnName?: string
  rowIdentifiers?: Record<string, unknown>
}

export function generateTableChangeKeyFromOperation(operation: NewQueuedOperation): string {
  if (operation.type === QueuedOperationType.EDIT_CELL_CONTENT) {
    return generateTableChangeKey({
      type: operation.type,
      tableId: operation.tableId,
      columnName: operation.payload.columnName,
      rowIdentifiers: operation.payload.rowIdentifiers,
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
}: GenerateTableChangeKeyArgs): string {
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
        default: {
          // Need to explicitly handle other operations
          throw new Error(`Unknown operation type: ${operation.type}`)
        }
      }
    }

    return { ...old, rows }
  })
}
