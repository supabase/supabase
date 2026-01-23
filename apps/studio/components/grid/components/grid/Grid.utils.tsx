import { QueryKey, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import { RowsChangeData } from 'react-data-grid'
import { toast } from 'sonner'

import { SupaRow } from 'components/grid/types'
import { convertByteaToHex } from 'components/interfaces/TableGridEditor/SidePanelEditor/RowEditor/RowEditor.utils'
import { DocsButton } from 'components/ui/DocsButton'
import { isTableLike } from 'data/table-editor/table-editor-types'
import { tableRowKeys } from 'data/table-rows/keys'
import { useTableRowUpdateMutation } from 'data/table-rows/table-row-update-mutation'
import type { TableRowsData } from 'data/table-rows/table-rows-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { DOCS_URL } from 'lib/constants'
import { useGetImpersonatedRoleState } from 'state/role-impersonation-state'
import { useTableEditorTableStateSnapshot } from 'state/table-editor-table'
import type { Dictionary } from 'types'
import { useTableEditorStateSnapshot } from '@/state/table-editor'
import { QueuedOperationType } from '@/state/table-editor-operation-queue.types'

/**
 * Feature flag to enable queuing cell edits instead of immediately saving.
 * When true: cell edits are queued and a "Save" toast appears
 * When false: cell edits are saved immediately (default behavior)
 */
export const QUEUE_CELL_EDITS = false

export function useOnRowsChange(rows: SupaRow[]) {
  const queryClient = useQueryClient()
  const { data: project } = useSelectedProjectQuery()
  const snap = useTableEditorTableStateSnapshot()
  const tableEditorSnap = useTableEditorStateSnapshot()
  const getImpersonatedRoleState = useGetImpersonatedRoleState()

  const { mutate: mutateUpdateTableRow } = useTableRowUpdateMutation({
    async onMutate({ projectRef, table, configuration, payload }) {
      const primaryKeyColumns = new Set(Object.keys(configuration.identifiers))

      const queryKey = tableRowKeys.tableRows(projectRef, { table: { id: table.id } })

      await queryClient.cancelQueries({ queryKey })

      const previousRowsQueries = queryClient.getQueriesData<TableRowsData>({ queryKey })

      queryClient.setQueriesData<TableRowsData>({ queryKey }, (old) => {
        return {
          rows:
            old?.rows.map((row) => {
              // match primary keys
              if (
                Object.entries(row)
                  .filter(([key]) => primaryKeyColumns.has(key))
                  .every(([key, value]) => value === configuration.identifiers[key])
              ) {
                return { ...row, ...payload }
              }

              return row
            }) ?? [],
        }
      })

      return { previousRowsQueries }
    },
    onError(error, _variables, context) {
      const { previousRowsQueries } = context as {
        previousRowsQueries: [
          QueryKey,
          (
            | {
                result: any[]
              }
            | undefined
          ),
        ][]
      }

      previousRowsQueries.forEach(([queryKey, previousRows]) => {
        if (previousRows) {
          queryClient.setQueriesData({ queryKey }, previousRows)
        }
        queryClient.invalidateQueries({ queryKey })
      })

      toast.error(error?.message ?? error)
    },
  })

  return useCallback(
    (_rows: SupaRow[], data: RowsChangeData<SupaRow, unknown>) => {
      if (!project) return

      const rowData = _rows[data.indexes[0]]
      const previousRow = rows.find((x) => x.idx == rowData.idx)
      const changedColumn = Object.keys(rowData).find(
        (name) => rowData[name] !== previousRow![name]
      )

      if (!previousRow || !changedColumn) return

      const enumArrayColumns = snap.originalTable.columns
        ?.filter((column) => {
          return (column?.enums ?? []).length > 0 && column.data_type.toLowerCase() === 'array'
        })
        .map((column) => column.name)

      const identifiers = {} as Dictionary<any>
      isTableLike(snap.originalTable) &&
        snap.originalTable.primary_keys.forEach((column) => {
          const col = snap.originalTable.columns.find((c) => c.name === column.name)
          identifiers[column.name] =
            col?.format === 'bytea'
              ? convertByteaToHex(previousRow[column.name])
              : previousRow[column.name]
        })

      if (Object.keys(identifiers).length === 0) {
        return toast('Unable to update row as table has no primary keys', {
          description: (
            <div>
              <p className="text-sm text-foreground-light">
                Add a primary key column to your table first to serve as a unique identifier for
                each row before updating or deleting the row.
              </p>
              <div className="mt-3">
                <DocsButton href={`${DOCS_URL}/guides/database/tables#primary-keys`} />
              </div>
            </div>
          ),
        })
      }

      const configuration = { identifiers }

      if (QUEUE_CELL_EDITS) {
        // Queue the operation instead of immediately mutating
        tableEditorSnap.queueOperation({
          type: QueuedOperationType.EDIT_CELL_CONTENT,
          tableId: snap.table.id,
          payload: {
            rowIdentifiers: identifiers,
            columnName: changedColumn,
            oldValue: previousRow[changedColumn],
            newValue: rowData[changedColumn],
            table: snap.originalTable,
            enumArrayColumns,
          },
        })

        // Apply optimistic update to the UI
        const queryKey = tableRowKeys.tableRows(project.ref, { table: { id: snap.table.id } })
        queryClient.setQueriesData<TableRowsData>({ queryKey }, (old) => {
          if (!old) return old
          return {
            rows: old.rows.map((row) => {
              // Match by primary keys
              const matches = Object.entries(identifiers).every(
                ([key, value]) => row[key] === value
              )
              if (matches) {
                return { ...row, [changedColumn]: rowData[changedColumn] }
              }
              return row
            }),
          }
        })
      } else {
        // Default behavior: immediately save the change
        const updatedData = { [changedColumn]: rowData[changedColumn] }

        mutateUpdateTableRow({
          projectRef: project.ref,
          connectionString: project.connectionString,
          table: snap.originalTable,
          configuration,
          payload: updatedData,
          enumArrayColumns,
          roleImpersonationState: getImpersonatedRoleState(),
        })
      }
    },
    [
      getImpersonatedRoleState,
      mutateUpdateTableRow,
      project,
      rows,
      snap.originalTable,
      snap.table.id,
      tableEditorSnap,
      queryClient,
    ]
  )
}
