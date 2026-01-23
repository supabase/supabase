import type { QueryClient } from '@tanstack/react-query'

import type { Entity } from 'data/table-editor/table-editor-types'
import { tableRowKeys } from 'data/table-rows/keys'
import type { TableRowsData } from 'data/table-rows/table-rows-query'
import { QueuedOperationType } from '@/state/table-editor-operation-queue.types'
import type { Dictionary } from 'types'

interface QueueCellEditParams {
  queryClient: QueryClient
  queueOperation: (operation: {
    type: QueuedOperationType
    tableId: number
    payload: {
      rowIdentifiers: Dictionary<any>
      columnName: string
      oldValue: any
      newValue: any
      table: Entity
      enumArrayColumns?: string[]
    }
  }) => void
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
