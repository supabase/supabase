import { QueryKey, useQueryClient } from '@tanstack/react-query'
import { useCallback, useRef } from 'react'
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
import { CellEditHistoryItem, useTableEditorTableStateSnapshot } from 'state/table-editor-table'
import type { Dictionary } from 'types'

/**
 * Creates optimistic update handlers for table row mutations.
 * These handlers update the UI immediately while the API call is in progress,
 * and rollback if the API call fails.
 */
function createOptimisticUpdateHandlers(queryClient: ReturnType<typeof useQueryClient>) {
  return {
    async onMutate({ projectRef, table, configuration, payload }: any) {
      const primaryKeyColumns = new Set(Object.keys(configuration.identifiers))
      const queryKey = tableRowKeys.tableRows(projectRef, { table: { id: table.id } })

      await queryClient.cancelQueries({ queryKey })

      const previousRowsQueries = queryClient.getQueriesData<TableRowsData>({ queryKey })

      queryClient.setQueriesData<TableRowsData>({ queryKey }, (old) => {
        return {
          rows:
            old?.rows.map((row) => {
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
    onError(error: any, _variables: any, context: any) {
      const { previousRowsQueries } = context as {
        previousRowsQueries: [QueryKey, { result: any[] } | undefined][]
      }

      previousRowsQueries.forEach(([queryKey, previousRows]) => {
        if (previousRows) {
          queryClient.setQueriesData({ queryKey }, previousRows)
        }
        queryClient.invalidateQueries({ queryKey })
      })

      toast.error(error?.message ?? error)
    },
  }
}

export function useOnRowsChange(rows: SupaRow[]) {
  const queryClient = useQueryClient()
  const { data: project } = useSelectedProjectQuery()
  const snap = useTableEditorTableStateSnapshot()
  const getImpersonatedRoleState = useGetImpersonatedRoleState()

  // Track the current toast ID so we can dismiss it when a new edit happens
  const toastIdRef = useRef<string | number | undefined>(undefined)

  // Use a ref to hold the undo function to avoid circular dependency
  const undoCellEditRef = useRef<() => void>(() => {})

  const optimisticHandlers = createOptimisticUpdateHandlers(queryClient)

  // Mutation for undo operations (toast is shown optimistically in undoCellEdit)
  const { mutate: mutateUndoTableRow } = useTableRowUpdateMutation(optimisticHandlers)

  // Mutation for regular updates (toast is shown optimistically in onRowsChange)
  const { mutate: mutateUpdateTableRow } = useTableRowUpdateMutation(optimisticHandlers)

  // Undo function that reverts the most recent cell edit from the history stack
  const undoCellEdit = useCallback(() => {
    if (!project || snap.cellEditHistory.length === 0) return

    // Pop the most recent edit from the stack
    const lastEdit = snap.popCellEdit()
    if (!lastEdit) return

    const { columnName, previousValue, identifiers } = lastEdit

    const enumArrayColumns = snap.originalTable.columns
      ?.filter((column) => {
        return (column?.enums ?? []).length > 0 && column.data_type.toLowerCase() === 'array'
      })
      .map((column) => column.name)

    // Dismiss the current toast and show undo confirmation immediately (optimistically)
    if (toastIdRef.current) {
      toast.dismiss(toastIdRef.current)
      toastIdRef.current = undefined
    }

    const remainingEdits = snap.cellEditHistory.length
    if (remainingEdits > 1) {
      toastIdRef.current = toast.success('Cell edit undone', {
        description: `${remainingEdits} more edit${remainingEdits > 1 ? 's' : ''} can be undone`,
        action: {
          label: 'Undo more',
          onClick: () => undoCellEditRef.current(),
        },
        duration: 5000,
      })
    } else {
      toast.success('Cell edit undone')
    }

    // [Ali] Defer the mutation to avoid conflicts with React's rendering cycle
    // This prevents "Canceled" errors when undo is triggered during other state updates
    const tableRef = snap.originalTable
    const roleState = getImpersonatedRoleState()
    setTimeout(() => {
      mutateUndoTableRow({
        projectRef: project.ref,
        connectionString: project.connectionString,
        table: tableRef,
        configuration: { identifiers },
        payload: { [columnName]: previousValue },
        enumArrayColumns,
        roleImpersonationState: roleState,
      })
    }, 0)
  }, [project, snap, getImpersonatedRoleState, mutateUndoTableRow])

  // Keep the ref updated with the latest undo function
  undoCellEditRef.current = undoCellEdit

  const onRowsChange = useCallback(
    (_rows: SupaRow[], data: RowsChangeData<SupaRow, unknown>) => {
      if (!project) return

      const rowData = _rows[data.indexes[0]]
      const previousRow = rows.find((x) => x.idx == rowData.idx)
      const changedColumn = Object.keys(rowData).find(
        (name) => rowData[name] !== previousRow![name]
      )

      if (!previousRow || !changedColumn) return

      const updatedData = { [changedColumn]: rowData[changedColumn] }

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

      const configuration = { identifiers }
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

      // Store the edit in history stack for undo functionality
      const editHistoryItem: CellEditHistoryItem = {
        rowIdx: rowData.idx,
        columnName: changedColumn,
        previousValue: previousRow[changedColumn],
        newValue: rowData[changedColumn],
        identifiers,
      }
      snap.pushCellEdit(editHistoryItem)

      // Show undo toast immediately (optimistically)
      if (toastIdRef.current) {
        toast.dismiss(toastIdRef.current)
      }
      const historyLength = snap.cellEditHistory.length
      toastIdRef.current = toast('Cell updated', {
        description:
          historyLength > 1
            ? `${historyLength} edits can be undone (Ctrl+Z / Cmd+Z)`
            : `Press Ctrl+Z or Cmd+Z to undo`,
        action: {
          label: 'Undo',
          onClick: () => undoCellEditRef.current(),
        },
        duration: 5000,
      })

      mutateUpdateTableRow({
        projectRef: project.ref,
        connectionString: project.connectionString,
        table: snap.originalTable,
        configuration,
        payload: updatedData,
        enumArrayColumns,
        roleImpersonationState: getImpersonatedRoleState(),
      })
    },
    [getImpersonatedRoleState, mutateUpdateTableRow, project, rows, snap]
  )

  return { onRowsChange, undoCellEdit }
}
