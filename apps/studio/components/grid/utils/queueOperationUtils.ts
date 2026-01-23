import type { QueryClient } from '@tanstack/react-query'

import type { Entity } from 'data/table-editor/table-editor-types'
import { tableRowKeys } from 'data/table-rows/keys'
import type { TableRowsData } from 'data/table-rows/table-rows-query'
import {
  QueuedOperation,
  QueuedOperationType,
  type EditCellContentPayload,
} from '@/state/table-editor-operation-queue.types'
import type { Dictionary } from 'types'

/**
 * Generates a unique key for a queued operation based on its type, tableId,
 * column name, and row identifiers. This can be used to deduplicate operations
 * or check if an operation already exists in the queue.
 */
export function generateQueueOperationKey(
  operation: Omit<QueuedOperation, 'id' | 'timestamp'>
): string {
  switch (operation.type) {
    case QueuedOperationType.EDIT_CELL_CONTENT: {
      const payload = operation.payload as EditCellContentPayload
      const rowIdentifiersKey = Object.entries(payload.rowIdentifiers)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => `${key}:${value}`)
        .join('|')
      return `${operation.type}:${operation.tableId}:${payload.columnName}:${rowIdentifiersKey}`
    }
    default:
      // Fallback for future operation types
      return `${operation.type}:${operation.tableId}:${JSON.stringify(operation.payload)}`
  }
}

interface QueueCellEditParams {
  queryClient: QueryClient
  queueOperation: (operation: Omit<QueuedOperation, 'id' | 'timestamp'>) => void
  projectRef: string
  tableId: number
  table: Entity
  rowIdentifiers: Dictionary<any>
  columnName: string
  oldValue: any
  newValue: any
  enumArrayColumns?: string[]
}

/**
 * Queues a cell edit operation and applies an optimistic update to the UI.
 * Used by both inline cell editors and the expanded side panel editors.
 */
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
      rows: old.rows.map((row) => {
        const matches = Object.entries(rowIdentifiers).every(([key, value]) => row[key] === value)
        if (matches) {
          return { ...row, [columnName]: newValue }
        }
        return row
      }),
    }
  })
}
