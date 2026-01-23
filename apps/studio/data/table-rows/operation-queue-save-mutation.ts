import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { executeSql } from 'data/sql/execute-sql-query'
import { wrapWithTransaction } from 'data/sql/utils/transaction'
import { RoleImpersonationState, wrapWithRoleImpersonation } from 'lib/role-impersonation'
import { isRoleImpersonationEnabled } from 'state/role-impersonation-state'
import {
  EditCellContentPayload,
  QueuedOperation,
  QueuedOperationType,
} from 'state/table-editor-operation-queue.types'
import type { ResponseError, UseCustomMutationOptions } from 'types'
import { tableRowKeys } from './keys'
import { getTableRowUpdateSql } from './table-row-update-mutation'

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
function getOperationSql(operation: QueuedOperation): string {
  switch (operation.type) {
    case QueuedOperationType.EDIT_CELL_CONTENT: {
      const payload = operation.payload as EditCellContentPayload
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
    default:
      throw new Error(`Unknown operation type: ${(operation as QueuedOperation).type}`)
  }
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

  // Generate SQL for each operation, stripping trailing semicolons to avoid double semicolons when joining
  const statements = operations.map((op) => {
    const sql = getOperationSql(op)
    return sql.endsWith(';') ? sql.slice(0, -1) : sql
  })

  // Combine all statements into a single transaction
  const transactionSql = wrapWithTransaction(statements.join(';\n') + ';')

  // Wrap with role impersonation if enabled
  const sql = wrapWithRoleImpersonation(transactionSql, roleImpersonationState)

  const { result } = await executeSql({
    projectRef,
    connectionString,
    sql,
    isRoleImpersonationEnabled: isRoleImpersonationEnabled(roleImpersonationState?.role),
    queryKey: ['operation-queue-save'],
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
