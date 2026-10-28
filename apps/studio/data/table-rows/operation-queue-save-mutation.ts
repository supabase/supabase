import { joinSqlFragments, safeSql, type SafeSqlFragment } from '@supabase/pg-meta'
import { wrapWithTransaction } from '@supabase/pg-meta/src/query'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { tableRowKeys } from './keys'
import { getTableRowCreateSql } from './table-row-create-mutation'
import { getTableRowDeleteSql } from './table-row-delete-mutation'
import { getTableRowUpdateSql } from './table-row-update-mutation'
import type { PendingAddRow } from '@/components/grid/types'
import { unguarded } from '@/data/fetchers'
import { executeSql } from '@/data/sql/execute-sql-mutation'
import { RoleImpersonationState, wrapWithRoleImpersonation } from '@/lib/role-impersonation'
import { isRoleImpersonationEnabled } from '@/state/role-impersonation-state'
import {
  isEditCellContentOperation,
  QueuedOperation,
  QueuedOperationType,
  type EditCellContentOperation,
} from '@/state/table-editor-operation-queue.types'
import type { Dictionary, ResponseError, UseCustomMutationOptions } from '@/types'

/** A single cell change, as much of one as it takes to write it. */
export type CellEditStatementInput = {
  table: { id: number; name: string; schema: string }
  rowIdentifiers: Dictionary<unknown>
  columnName: string
  newValue: unknown
  enumArrayColumns?: string[]
}

function getCellEditRowKey({ table, rowIdentifiers }: CellEditStatementInput): string {
  const rowIdentifiersKey = JSON.stringify(
    Object.entries(rowIdentifiers).sort(([a], [b]) => a.localeCompare(b))
  )

  return `${table.id}:${rowIdentifiersKey}`
}

/**
 * One UPDATE per edited row, so several cells changed on the same row are written in a
 * single statement rather than one statement per cell.
 */
export function getCellEditUpdateStatements(
  edits: readonly CellEditStatementInput[]
): Array<SafeSqlFragment> {
  const editsByRow = new Map<string, CellEditStatementInput[]>()
  for (const edit of edits) {
    const key = getCellEditRowKey(edit)
    editsByRow.set(key, [...(editsByRow.get(key) ?? []), edit])
  }

  return [...editsByRow.values()].map((rowEdits) => {
    const { table, rowIdentifiers } = rowEdits[0]
    return stripTrailingSemicolon(
      getTableRowUpdateSql({
        table: { id: table.id, name: table.name, schema: table.schema },
        configuration: { identifiers: rowIdentifiers },
        payload: Object.fromEntries(
          rowEdits.map(({ columnName, newValue }) => [columnName, newValue])
        ),
        enumArrayColumns: [
          ...new Set(rowEdits.flatMap(({ enumArrayColumns }) => enumArrayColumns ?? [])),
        ],
        returning: false,
      })
    )
  })
}

export type OperationQueueSaveVariables = {
  projectRef: string
  connectionString?: string | null
  operations: readonly QueuedOperation[]
  roleImpersonationState?: RoleImpersonationState
}

/**
 * Generates SQL for a single queued operation.
 * Extend this function as new operation types are added.
 */
function getOperationSql(operation: QueuedOperation): SafeSqlFragment {
  switch (operation.type) {
    case QueuedOperationType.EDIT_CELL_CONTENT: {
      const { payload } = operation
      return getTableRowUpdateSql({
        table: {
          id: payload.table.id,
          name: payload.table.name,
          schema: payload.table.schema,
        },
        configuration: { identifiers: payload.rowIdentifiers },
        payload: { [payload.columnName]: payload.newValue },
        enumArrayColumns: payload.enumArrayColumns ?? [],
        returning: false,
      })
    }
    case QueuedOperationType.ADD_ROW: {
      const { payload } = operation
      // Clean internal fields before SQL generation
      const { __tempId, idx, ...cleanRowData } = payload.rowData as PendingAddRow
      return getTableRowCreateSql({
        table: { id: payload.table.id, name: payload.table.name, schema: payload.table.schema },
        payload: cleanRowData,
        enumArrayColumns: payload.enumArrayColumns ?? [],
        returning: false,
      })
    }
    case QueuedOperationType.DELETE_ROW: {
      const { payload } = operation
      // Create a mock row with the row identifiers for the delete SQL
      const mockRow = { idx: 0, ...payload.rowIdentifiers }
      return getTableRowDeleteSql({
        table: payload.table,
        rows: [mockRow],
      })
    }
    default: {
      // Error should never happen, but we'll handle it anyway. cast to never for exhaustive check.
      const _exhaustiveCheck: never = operation
      throw new Error(`Unknown operation: ${(_exhaustiveCheck as { type: string }).type}`)
    }
  }
}

function sortOperations(operations: readonly QueuedOperation[]): QueuedOperation[] {
  const operationOrder: Record<QueuedOperationType, number> = {
    [QueuedOperationType.DELETE_ROW]: 0,
    [QueuedOperationType.ADD_ROW]: 1,
    [QueuedOperationType.EDIT_CELL_CONTENT]: 2,
  }

  return [...operations].sort((a, b) => {
    return operationOrder[a.type] - operationOrder[b.type]
  })
}

function stripTrailingSemicolon(sql: SafeSqlFragment): SafeSqlFragment {
  return (sql.endsWith(';') ? sql.slice(0, -1) : sql) as SafeSqlFragment
}

export function getOperationSqlStatements(
  operations: readonly QueuedOperation[]
): Array<SafeSqlFragment> {
  const statements: Array<SafeSqlFragment> = []
  const editCellOperations: EditCellContentOperation[] = []

  for (const operation of sortOperations(operations)) {
    if (isEditCellContentOperation(operation)) editCellOperations.push(operation)
    else statements.push(stripTrailingSemicolon(getOperationSql(operation)))
  }

  return [
    ...statements,
    ...getCellEditUpdateStatements(editCellOperations.map(({ payload }) => payload)),
  ]
}

/**
 * Saves all queued operations in a single database transaction.
 * If any operation fails, the entire transaction is rolled back.
 */
export async function saveOperationQueue({
  projectRef,
  connectionString,
  operations,
  roleImpersonationState,
}: OperationQueueSaveVariables) {
  if (operations.length === 0) {
    return { result: [] }
  }

  const statements = getOperationSqlStatements(operations)

  const transactionSql = wrapWithTransaction(safeSql`${joinSqlFragments(statements, ';\n')};`)

  const sql = wrapWithRoleImpersonation(transactionSql, roleImpersonationState)

  const { result } = await executeSql({
    projectRef,
    connectionString,
    sql,
    isRoleImpersonationEnabled: isRoleImpersonationEnabled(roleImpersonationState?.role),
    queryKey: ['operation-queue-save'],
    grant: unguarded.migrating,
  })

  return { result }
}

type OperationQueueSaveData = Awaited<ReturnType<typeof saveOperationQueue>>

export const useOperationQueueSaveMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<OperationQueueSaveData, ResponseError, OperationQueueSaveVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<OperationQueueSaveData, ResponseError, OperationQueueSaveVariables>({
    mutationFn: (vars) => saveOperationQueue(vars),
    async onSuccess(data, variables, context) {
      const { projectRef, operations } = variables

      // Collect all unique table IDs that were affected
      const affectedTableIds = [...new Set(operations.map((op) => op.tableId))]

      // Invalidate queries for all affected tables (both rows and count)
      await Promise.all(
        affectedTableIds.map((tableId) =>
          queryClient.invalidateQueries({
            queryKey: tableRowKeys.tableRowsAndCount(projectRef, tableId),
          })
        )
      )

      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to save changes: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
