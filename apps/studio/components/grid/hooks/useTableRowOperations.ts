import { QueryKey, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import { toast } from 'sonner'

import type { PendingAddRow } from '../types'
import type { SupaRow } from '@/components/grid/types'
import {
  queueCellEditWithOptimisticUpdate,
  queueRowAddWithOptimisticUpdate,
  queueRowDeletesWithOptimisticUpdate,
} from '@/components/grid/utils/queueOperationUtils'
import { useIsQueueOperationsEnabled } from '@/components/interfaces/Account/Preferences/useDashboardSettings'
import { isTableLike, type Entity } from '@/data/table-editor/table-editor-types'
import { tableRowKeys } from '@/data/table-rows/keys'
import { useTableRowCreateMutation } from '@/data/table-rows/table-row-create-mutation'
import { useTableRowUpdateMutation } from '@/data/table-rows/table-row-update-mutation'
import type { TableRowsData } from '@/data/table-rows/table-rows-query'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { useGetImpersonatedRoleState } from '@/state/role-impersonation-state'
import { useTableEditorStateSnapshot } from '@/state/table-editor'
import type { Dictionary } from '@/types'

export interface EditCellParams {
  table: Entity
  tableId: number
  row: SupaRow
  rowIdentifiers: Dictionary<unknown>
  columnName: string
  oldValue: unknown
  newValue: unknown
  enumArrayColumns?: string[]
  /** When true, shows a success toast on non-queue save (used by side panel, not grid inline edits) */
  onSuccess?: () => void
}

export interface AddRowParams {
  table: Entity
  tableId: number
  rowData: PendingAddRow
  enumArrayColumns?: string[]
}

export interface UpdateRowParams {
  table: Entity
  tableId: number
  row: SupaRow
  rowIdentifiers: Dictionary<unknown>
  payload: Dictionary<unknown>
  enumArrayColumns?: string[]
  onSuccess?: () => void
}

export interface DeleteRowsParams {
  rows: SupaRow[]
  table: Entity
  allRowsSelected?: boolean
  totalRows?: number
  callback?: () => void
}

export function useTableRowOperations() {
  const isQueueEnabled = useIsQueueOperationsEnabled()
  const queryClient = useQueryClient()
  const { data: project } = useSelectedProjectQuery()
  const tableEditorSnap = useTableEditorStateSnapshot()
  const getImpersonatedRoleState = useGetImpersonatedRoleState()

  // Non-queue mutation for cell edits with optimistic updates
  const { mutateAsync: mutateUpdateTableRow, isPending: isEditPending } = useTableRowUpdateMutation(
    {
      async onMutate({ projectRef, table, configuration, payload }) {
        const primaryKeyColumns = new Set(Object.keys(configuration.identifiers))
        const queryKey = tableRowKeys.tableRows(projectRef, { table: { id: table.id } })

        await queryClient.cancelQueries({ queryKey })

        const previousRowsQueries = queryClient.getQueriesData<TableRowsData>({ queryKey })

        queryClient.setQueriesData<TableRowsData>({ queryKey }, (old) => {
          if (!old) return old
          return {
            rows: old.rows.map((row) => {
              if (
                Object.entries(row)
                  .filter(([key]) => primaryKeyColumns.has(key))
                  .every(([key, value]) => value === configuration.identifiers[key])
              ) {
                return { ...row, ...payload }
              }
              return row
            }),
          }
        })

        return { previousRowsQueries }
      },
      onError(error, _variables, context) {
        const { previousRowsQueries } = (context ?? { previousRowsQueries: [] }) as {
          previousRowsQueries: [QueryKey, TableRowsData | undefined][]
        }

        previousRowsQueries.forEach(([queryKey, previousRows]) => {
          if (previousRows) {
            queryClient.setQueriesData<TableRowsData>({ queryKey }, previousRows)
          }
          queryClient.invalidateQueries({ queryKey })
        })

        toast.error(error?.message ?? error)
      },
    }
  )

  // Non-queue mutation for row creation
  const { mutateAsync: mutateCreateTableRow } = useTableRowCreateMutation({
    onSuccess() {
      toast.success('Successfully created row')
    },
  })

  const editCell = useCallback(
    async (params: EditCellParams) => {
      if (isQueueEnabled) {
        queueCellEditWithOptimisticUpdate({
          queueOperation: tableEditorSnap.queueOperation,
          tableId: params.tableId,
          table: params.table,
          row: params.row,
          rowIdentifiers: params.rowIdentifiers,
          columnName: params.columnName,
          oldValue: params.oldValue,
          newValue: params.newValue,
          enumArrayColumns: params.enumArrayColumns,
        })
        return
      }

      if (!project) return

      const updatedData = { [params.columnName]: params.newValue }
      await mutateUpdateTableRow({
        projectRef: project.ref,
        connectionString: project.connectionString,
        table: params.table,
        configuration: { identifiers: params.rowIdentifiers },
        payload: updatedData,
        enumArrayColumns: params.enumArrayColumns ?? [],
        roleImpersonationState: getImpersonatedRoleState(),
      })
      params.onSuccess?.()
    },
    [isQueueEnabled, project, tableEditorSnap, mutateUpdateTableRow, getImpersonatedRoleState]
  )

  const updateRow = useCallback(
    async (params: UpdateRowParams) => {
      if (isQueueEnabled) {
        // Queue individual cell edits per changed column
        for (const columnName of Object.keys(params.payload)) {
          queueCellEditWithOptimisticUpdate({
            queueOperation: tableEditorSnap.queueOperation,
            tableId: params.tableId,
            table: params.table,
            row: params.row,
            rowIdentifiers: params.rowIdentifiers,
            columnName,
            oldValue: params.row[columnName],
            newValue: params.payload[columnName],
            enumArrayColumns: params.enumArrayColumns,
          })
        }
        return
      }

      if (!project) return

      await mutateUpdateTableRow({
        projectRef: project.ref,
        connectionString: project.connectionString,
        table: params.table,
        configuration: { identifiers: params.rowIdentifiers },
        payload: params.payload,
        enumArrayColumns: params.enumArrayColumns ?? [],
        roleImpersonationState: getImpersonatedRoleState(),
      })
      params.onSuccess?.()
    },
    [isQueueEnabled, project, tableEditorSnap, mutateUpdateTableRow, getImpersonatedRoleState]
  )

  const addRow = useCallback(
    async (params: AddRowParams) => {
      // Only queue if the table has primary keys (required for queue conflict resolution)
      const hasPrimaryKeys = isTableLike(params.table) && params.table.primary_keys.length > 0

      if (isQueueEnabled && hasPrimaryKeys) {
        queueRowAddWithOptimisticUpdate({
          queueOperation: tableEditorSnap.queueOperation,
          tableId: params.tableId,
          table: params.table,
          rowData: params.rowData,
          enumArrayColumns: params.enumArrayColumns,
        })
        return
      }

      if (!project) return

      await mutateCreateTableRow({
        projectRef: project.ref,
        connectionString: project.connectionString,
        table: params.table,
        payload: params.rowData,
        enumArrayColumns: params.enumArrayColumns ?? [],
        roleImpersonationState: getImpersonatedRoleState(),
      })
    },
    [isQueueEnabled, project, tableEditorSnap, mutateCreateTableRow, getImpersonatedRoleState]
  )

  const deleteRows = useCallback(
    (params: DeleteRowsParams) => {
      // When queue is enabled and not all rows are selected, queue the deletes
      if (isQueueEnabled && !params.allRowsSelected) {
        queueRowDeletesWithOptimisticUpdate({
          rows: params.rows,
          table: params.table,
          queueOperation: tableEditorSnap.queueOperation,
          projectRef: project?.ref,
        })
        params.callback?.()
        return
      }

      // Otherwise, open the confirmation dialog
      tableEditorSnap.onDeleteRows(params.rows, {
        allRowsSelected: params.allRowsSelected ?? false,
        numRows: params.allRowsSelected ? params.totalRows : params.rows.length,
        callback: params.callback,
      })
    },
    [isQueueEnabled, project, tableEditorSnap]
  )

  return {
    editCell,
    updateRow,
    addRow,
    deleteRows,
    isQueueEnabled,
    isEditPending,
  }
}
