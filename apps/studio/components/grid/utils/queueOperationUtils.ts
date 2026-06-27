import type { INTERNAL_Snapshot as Snapshot } from 'valtio/vanilla'

import { isPendingAddRow, PendingAddRow, SupaRow } from '../types'
import { isTableLike, type Entity } from '@/data/table-editor/table-editor-types'
import {
  EditCellContentOperation,
  NewQueuedOperation,
  QueuedOperation,
  QueuedOperationType,
} from '@/state/table-editor-operation-queue.types'
import type { Dictionary } from '@/types'

type QueuedOperationSnapshot = Snapshot<QueuedOperation>

interface EditCellKeyOperation extends Omit<
  EditCellContentOperation,
  'payload' | 'id' | 'timestamp'
> {
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

function getQueuedCurrentRowIdentifiers(
  operations: readonly QueuedOperationSnapshot[],
  tableId: number,
  primaryKeyNames: string[],
  originalIdentifiers: Dictionary<unknown>
): Dictionary<unknown> {
  const currentIdentifiers = { ...originalIdentifiers }

  operations.forEach((operation) => {
    if (operation.tableId !== tableId || operation.type !== QueuedOperationType.EDIT_CELL_CONTENT) {
      return
    }

    if (!primaryKeyNames.includes(operation.payload.columnName)) {
      return
    }

    if (rowMatchesIdentifiers(operation.payload.rowIdentifiers, originalIdentifiers)) {
      currentIdentifiers[operation.payload.columnName] = operation.payload.newValue
    }
  })

  return currentIdentifiers
}

export function getOriginalRowIdentifiersForQueuedOperation({
  operations,
  tableId,
  table,
  rowIdentifiers,
}: {
  operations: readonly QueuedOperationSnapshot[]
  tableId: number
  table: Entity
  rowIdentifiers: Dictionary<unknown>
}): Dictionary<unknown> {
  if (rowIdentifiers.__tempId !== undefined || !isTableLike(table)) {
    return rowIdentifiers
  }

  const primaryKeyNames = table.primary_keys.map((primaryKey) => primaryKey.name)
  if (primaryKeyNames.length === 0) {
    return rowIdentifiers
  }

  for (const operation of operations) {
    if (
      operation.tableId !== tableId ||
      operation.type !== QueuedOperationType.EDIT_CELL_CONTENT ||
      !primaryKeyNames.includes(operation.payload.columnName)
    ) {
      continue
    }

    const originalIdentifiers = operation.payload.rowIdentifiers
    const currentIdentifiers = getQueuedCurrentRowIdentifiers(
      operations,
      tableId,
      primaryKeyNames,
      originalIdentifiers
    )

    if (rowMatchesIdentifiers(currentIdentifiers, rowIdentifiers)) {
      return originalIdentifiers
    }
  }

  return rowIdentifiers
}

export function removeRow(rows: SupaRow[], rowIdentifiers: Dictionary<unknown>): SupaRow[] {
  return rows.filter((row) => !rowMatchesIdentifiers(row, rowIdentifiers))
}

interface QueueCellEditParams {
  queueOperation: (operation: NewQueuedOperation) => void
  operations?: readonly QueuedOperationSnapshot[]
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
  queueOperation,
  operations = [],
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
  const rowIdentifiers: Dictionary<unknown> = {
    ...getOriginalRowIdentifiersForQueuedOperation({
      operations,
      tableId,
      table,
      rowIdentifiers: callerRowIdentifiers,
    }),
  }
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
}

interface QueueRowAddParams {
  queueOperation: (operation: NewQueuedOperation) => void
  tableId: number
  table: Entity
  rowData: PendingAddRow
  enumArrayColumns?: string[]
}

export function queueRowAddWithOptimisticUpdate({
  queueOperation,
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
}

export const formatGridDataWithOperationValues = ({
  operations,
  rows,
}: {
  operations: QueuedOperation[]
  rows: SupaRow[]
}) => {
  const formattedRows = rows.slice()

  operations.forEach((op) => {
    if (op.type === QueuedOperationType.EDIT_CELL_CONTENT) {
      const { rowIdentifiers, columnName, newValue } = op.payload
      const rowIdx = formattedRows.findIndex((row) => rowMatchesIdentifiers(row, rowIdentifiers))
      if (rowIdx !== -1) {
        formattedRows[rowIdx] = { ...formattedRows[rowIdx], [columnName]: newValue }
      }
    } else if (op.type === QueuedOperationType.ADD_ROW) {
      const { tempId, rowData } = op.payload
      const idx = Number(tempId)

      // Check if row with this tempId already exists
      const existingIndex = formattedRows.findIndex(
        (row) => isPendingAddRow(row) && row.__tempId === tempId
      )
      if (existingIndex >= 0) {
        // Update existing row in place
        formattedRows[existingIndex] = {
          ...formattedRows[existingIndex],
          ...rowData,
          __tempId: tempId,
        }
      } else {
        const newRow: PendingAddRow = { ...rowData, idx, __tempId: tempId }
        formattedRows.unshift(newRow)
      }
    } else if (op.type === QueuedOperationType.DELETE_ROW) {
      const { rowIdentifiers } = op.payload
      const rowIdx = formattedRows.findIndex((row) => rowMatchesIdentifiers(row, rowIdentifiers))
      if (rowIdx !== -1) {
        formattedRows[rowIdx] = { ...formattedRows[rowIdx], __isDeleted: true }
      }
    }
  })

  return formattedRows
}

interface QueueRowDeletesParams {
  rows: SupaRow[]
  table: Entity
  operations?: readonly QueuedOperationSnapshot[]
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
  operations = [],
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
    let rowIdentifiers: Record<string, unknown> = {}
    table.primary_keys.forEach((pk) => {
      rowIdentifiers[pk.name] = row[pk.name]
    })

    rowIdentifiers = {
      ...getOriginalRowIdentifiersForQueuedOperation({
        operations,
        tableId: table.id,
        table,
        rowIdentifiers,
      }),
    }

    if (isPendingAddRow(row)) {
      rowIdentifiers.__tempId = row.__tempId
    }

    queueOperation({
      type: QueuedOperationType.DELETE_ROW,
      tableId: table.id,
      payload: {
        rowIdentifiers,
        originalRow: row,
        table,
      },
    })
  }
}
