import { QueryKey, useQueryClient } from '@tanstack/react-query'
import { useCallback, useRef } from 'react'
import { RowsChangeData } from 'react-data-grid'
import { toast } from 'sonner'

import { SupaRow } from 'components/grid/types'
import { convertByteaToHex } from 'components/interfaces/TableGridEditor/SidePanelEditor/RowEditor/RowEditor.utils'
import { DocsButton } from 'components/ui/DocsButton'
import { Entity, isTableLike } from 'data/table-editor/table-editor-types'
import { tableRowKeys } from 'data/table-rows/keys'
import {
  TableRowUpdateVariables,
  useTableRowUpdateMutation,
} from 'data/table-rows/table-row-update-mutation'
import type { TableRowsData } from 'data/table-rows/table-rows-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { DOCS_URL } from 'lib/constants'
import { useGetImpersonatedRoleState } from 'state/role-impersonation-state'
import { CellEditHistoryItem, useTableEditorTableStateSnapshot } from 'state/table-editor-table'
import type { ResponseError } from 'types'
import { OptimisticUpdateContext, RowIdentifiers } from './Grid.types'

const UNDO_TOAST_DURATION = 5000

/** Gets enum array column names from a table (needed for proper SQL generation) */
function getEnumArrayColumns(table: Entity): string[] {
  return (
    table.columns
      ?.filter((col) => (col?.enums ?? []).length > 0 && col.data_type.toLowerCase() === 'array')
      .map((col) => col.name) ?? []
  )
}

/** Builds primary key identifiers for a row */
function buildRowIdentifiers(table: Entity, row: SupaRow): RowIdentifiers {
  const identifiers: RowIdentifiers = {}

  if (isTableLike(table)) {
    table.primary_keys.forEach((pk) => {
      const col = table.columns.find((c) => c.name === pk.name)
      identifiers[pk.name] =
        col?.format === 'bytea' ? convertByteaToHex(row[pk.name]) : row[pk.name]
    })
  }

  return identifiers
}

function createOptimisticUpdateHandlers(queryClient: ReturnType<typeof useQueryClient>) {
  return {
    async onMutate({
      projectRef,
      table,
      configuration,
      payload,
    }: TableRowUpdateVariables): Promise<OptimisticUpdateContext> {
      const primaryKeyColumns = new Set(Object.keys(configuration.identifiers))
      const queryKey = tableRowKeys.tableRows(projectRef, { table: { id: table.id } })

      await queryClient.cancelQueries({ queryKey })
      const previousRowsQueries = queryClient.getQueriesData<TableRowsData>({ queryKey })

      queryClient.setQueriesData<TableRowsData>({ queryKey }, (old) => ({
        rows:
          old?.rows.map((row) => {
            const matchesPrimaryKey = Object.entries(row)
              .filter(([key]) => primaryKeyColumns.has(key))
              .every(([key, value]) => value === configuration.identifiers[key])
            return matchesPrimaryKey ? { ...row, ...payload } : row
          }) ?? [],
      }))

      return { previousRowsQueries }
    },
    onError(error: ResponseError, _variables: TableRowUpdateVariables, context: unknown) {
      const ctx = context as OptimisticUpdateContext | undefined
      if (ctx?.previousRowsQueries) {
        ctx.previousRowsQueries.forEach(([queryKey, previousRows]) => {
          if (previousRows) {
            queryClient.setQueriesData({ queryKey }, previousRows)
          }
          queryClient.invalidateQueries({ queryKey })
        })
      }

      toast.error(error?.message ?? 'An unknown error occurred')
    },
  }
}

export function useOnRowsChange(rows: SupaRow[]) {
  const queryClient = useQueryClient()
  const { data: project } = useSelectedProjectQuery()
  const snap = useTableEditorTableStateSnapshot()
  const getImpersonatedRoleState = useGetImpersonatedRoleState()

  const toastIdRef = useRef<string | number | undefined>(undefined)
  const undoCellEditRef = useRef<() => void>(() => {})

  const optimisticHandlers = createOptimisticUpdateHandlers(queryClient)
  const { mutate: mutateUndoTableRow } = useTableRowUpdateMutation(optimisticHandlers)
  const { mutate: mutateUpdateTableRow } = useTableRowUpdateMutation(optimisticHandlers)

  /** Dismisses current toast and shows a new undo toast */
  const showUndoToast = useCallback(
    (message: string, editCount: number, variant: 'default' | 'success' = 'default') => {
      if (toastIdRef.current) toast.dismiss(toastIdRef.current)

      const toastFn = variant === 'success' ? toast.success : toast

      if (editCount > 0) {
        const description =
          editCount === 1
            ? 'Press Ctrl+Z or Cmd+Z to undo'
            : `${editCount} edits can be undone (Ctrl+Z / Cmd+Z)`

        toastIdRef.current = toastFn(message, {
          description,
          action: {
            label: variant === 'success' ? 'Undo more' : 'Undo',
            onClick: () => undoCellEditRef.current(),
          },
          duration: UNDO_TOAST_DURATION,
        })
      } else {
        toastFn(message)
      }
    },
    []
  )

  const undoCellEdit = useCallback(() => {
    if (!project || snap.cellEditHistory.length === 0) return

    const lastEdit = snap.popCellEdit()
    if (!lastEdit) return

    const { columnName, previousValue, identifiers } = lastEdit
    const table = snap.originalTable

    // Optimistically show the remaining edit count assuming its complete
    showUndoToast('Cell edit undone', snap.cellEditHistory.length - 1, 'success')

    // [Ali] Defer mutation to avoid conflicts with React's rendering cycle
    // If I left it the same way the cancelled and rendering logic throws errors
    const roleState = getImpersonatedRoleState()
    setTimeout(() => {
      mutateUndoTableRow({
        projectRef: project.ref,
        connectionString: project.connectionString,
        table,
        configuration: { identifiers },
        payload: { [columnName]: previousValue },
        enumArrayColumns: getEnumArrayColumns(table),
        roleImpersonationState: roleState,
      })
    }, 0)
  }, [project, snap, getImpersonatedRoleState, mutateUndoTableRow, showUndoToast])

  undoCellEditRef.current = undoCellEdit

  const onRowsChange = useCallback(
    (_rows: SupaRow[], data: RowsChangeData<SupaRow, unknown>) => {
      if (!project) return

      const rowData = _rows[data.indexes[0]]
      const previousRow = rows.find((r) => r.idx === rowData.idx)
      const changedColumn = Object.keys(rowData).find((col) => rowData[col] !== previousRow?.[col])

      if (!previousRow || !changedColumn) return

      const identifiers = buildRowIdentifiers(snap.originalTable, previousRow)

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

      const editHistoryItem: CellEditHistoryItem = {
        rowIdx: rowData.idx,
        columnName: changedColumn,
        previousValue: previousRow[changedColumn],
        newValue: rowData[changedColumn],
        identifiers,
      }
      const editCountBeforePush = snap.cellEditHistory.length
      snap.pushCellEdit(editHistoryItem)

      showUndoToast('Cell updated', editCountBeforePush)

      mutateUpdateTableRow({
        projectRef: project.ref,
        connectionString: project.connectionString,
        table: snap.originalTable,
        configuration: { identifiers },
        payload: { [changedColumn]: rowData[changedColumn] },
        enumArrayColumns: getEnumArrayColumns(snap.originalTable),
        roleImpersonationState: getImpersonatedRoleState(),
      })
    },
    [getImpersonatedRoleState, mutateUpdateTableRow, project, rows, snap, showUndoToast]
  )

  return { onRowsChange, undoCellEdit }
}
