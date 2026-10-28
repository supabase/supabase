import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useQuery } from '@tanstack/react-query'
import { isEqual } from 'lodash'
import { toast } from 'sonner'

import type { QueryResult } from '../types'
import { parseSupaTable } from '@/components/grid/SupabaseGrid.utils'
import { useQueryResultEditsSaveMutation } from '@/data/sql/query-result-edits-save-mutation'
import { queryResultTableQueryOptions } from '@/data/sql/query-result-table-query'
import { useTableEditorQuery } from '@/data/table-editor/table-editor-query'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { useLatest } from '@/hooks/misc/useLatest'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { useIsProtectedSchema } from '@/hooks/useProtectedSchemas'
import { useGrant } from '@/lib/grants'
import { pluralize } from '@/lib/helpers'
import {
  applyPendingCellEdits,
  getResultRowIdentifiers,
  replaceResultRows,
  stagePendingCellEdit,
  type PendingCellEdit,
} from '@/lib/query-result-editing'
import type { RoleImpersonationState } from '@/lib/role-impersonation'

type ResultRow = Record<string, unknown>

/**
 * Inline editing for a query result: works out whether the result maps back to rows of one
 * table, shows the result with its unsaved edits applied, and stages, reverts, and saves
 * those edits. Staged edits live on the result itself (see `QueryResult.pendingEdits`), so
 * whichever surface owns the result also owns them.
 */
export function useQueryResultEditing({
  result,
  isEnabled,
  roleImpersonationState,
  onResultChange,
}: {
  result?: QueryResult
  /** False while the surface is read-only or busy, which pauses editing but keeps the edits. */
  isEnabled: boolean
  /** The role to save as when the result carries none, such as after a failed re-run. */
  roleImpersonationState?: RoleImpersonationState
  onResultChange: (result: QueryResult) => void
}) {
  const { data: project } = useSelectedProjectQuery()
  const { can: canEditTables } = useAsyncCheckPermissions(
    PermissionAction.TENANT_SQL_ADMIN_WRITE,
    'tables'
  )
  const { can: canEditColumns } = useAsyncCheckPermissions(
    PermissionAction.TENANT_SQL_ADMIN_WRITE,
    'columns'
  )
  const hasWritePermission = canEditTables || canEditColumns
  const { grant: queryGrant } = useGrant('POST /platform/pg-meta/{ref}/query', {
    projectRef: project?.ref,
  })

  const context = result?.editingContext
  const isPrimaryDatabase =
    context?.databaseIdentifier === undefined || context.databaseIdentifier === project?.ref
  // Working out which table rows came from is a read, so anyone can see row details; only
  // editing needs write access.
  const canIdentifyRows =
    result?.source === 'database' &&
    !!result.sql &&
    !!context &&
    context.projectRef === project?.ref &&
    isPrimaryDatabase

  const { data: target, isLoading: isLoadingTarget } = useQuery({
    ...queryResultTableQueryOptions({
      projectRef: project?.ref,
      connectionString: project?.connectionString,
      sql: result?.sql,
      roleImpersonationState: context?.roleImpersonationState,
    }),
    enabled: canIdentifyRows,
  })
  const { isSchemaLocked } = useIsProtectedSchema({ schema: target?.table.schema ?? '' })
  // The Table Editor's view of the table, which is what its cell editors are built from.
  const { data: entity } = useTableEditorQuery(
    { projectRef: project?.ref, connectionString: project?.connectionString, id: target?.table.id },
    { enabled: !!target }
  )
  const columns = entity && entity.id === target?.table.id ? parseSupaTable(entity).columns : []

  const { mutate: saveEdits, isPending: isSaving } = useQueryResultEditsSaveMutation()

  const canEdit =
    canIdentifyRows && isEnabled && hasWritePermission && !!target && !isSchemaLocked && !isSaving
  const pendingEdits = result?.pendingEdits ?? []
  const sourceRows = result?.rows ?? []
  const shown = target
    ? applyPendingCellEdits({
        rows: sourceRows,
        edits: pendingEdits,
        table: target.table,
        columns: target.columns,
      })
    : { rows: sourceRows, editedColumns: new Map<ResultRow, Set<string>>() }

  const latestRef = useLatest({ result, target })

  const setPendingEdits = (edits: readonly PendingCellEdit[]) => {
    const latest = latestRef.current.result
    if (latest) onResultChange({ ...latest, pendingEdits: edits })
  }

  /**
   * The row as the database returned it, for a row as shown. Matched by identity first; an
   * editor that hands back a modified copy is matched by the key it shows instead.
   */
  const getSourceRow = (row: ResultRow) => {
    if (!target) return undefined
    const index = shown.rows.indexOf(row)
    if (index >= 0) return sourceRows[index]
    const identifiers = getResultRowIdentifiers(row, target.table, target.columns)
    if (!identifiers) return undefined
    const matchIndex = shown.rows.findIndex((candidate) =>
      isEqual(getResultRowIdentifiers(candidate, target.table, target.columns), identifiers)
    )
    return matchIndex >= 0 ? sourceRows[matchIndex] : undefined
  }

  /** The row as shown, for the primary key it had in the result. */
  const findRow = (rowIdentifiers: Record<string, unknown>) => {
    if (!target) return undefined
    const index = sourceRows.findIndex((row) =>
      isEqual(getResultRowIdentifiers(row, target.table, target.columns), rowIdentifiers)
    )
    return index >= 0 ? shown.rows[index] : undefined
  }

  const getRowIdentifiers = (row: ResultRow) => {
    const sourceRow = getSourceRow(row)
    return target && sourceRow
      ? getResultRowIdentifiers(sourceRow, target.table, target.columns)
      : null
  }

  const toPendingEdit = (
    rowIdentifiers: Record<string, unknown>,
    columnName: string,
    oldValue: unknown,
    newValue: unknown
  ): PendingCellEdit | undefined => {
    if (!target) return undefined
    const column = target.table.columns?.find(({ name }) => name === columnName)
    const isEnumArray =
      !!column && column.enums.length > 0 && column.data_type.toLowerCase() === 'array'
    return {
      table: { id: target.table.id, schema: target.table.schema, name: target.table.name },
      rowIdentifiers,
      columnName,
      oldValue,
      newValue,
      enumArrayColumns: isEnumArray ? [columnName] : undefined,
    }
  }

  /** Stages a change to one shown cell, named by its result column. */
  const stageCellEdit = (row: ResultRow, resultColumn: string, value: unknown) => {
    const columnName = target?.columns.find(({ name }) => name === resultColumn)?.column
    const rowIdentifiers = getRowIdentifiers(row)
    if (!canEdit || !columnName || !rowIdentifiers) return
    const edit = toPendingEdit(rowIdentifiers, columnName, row[resultColumn], value)
    if (edit) setPendingEdits(stagePendingCellEdit(pendingEdits, edit))
  }

  /** Stages several changes to one row at once, named by table column — as a row form gives them. */
  const stageRowEdits = (
    rowIdentifiers: Record<string, unknown>,
    current: ResultRow,
    changes: ResultRow
  ) => {
    if (!canEdit) return
    let edits: readonly PendingCellEdit[] = pendingEdits
    for (const [columnName, value] of Object.entries(changes)) {
      const edit = toPendingEdit(rowIdentifiers, columnName, current[columnName], value)
      if (edit) edits = stagePendingCellEdit(edits, edit)
    }
    setPendingEdits(edits)
  }

  /**
   * Shows a row just added to the result's table at the top, so it can be seen and edited
   * straight away — even if the query's own conditions wouldn't select it on a re-run.
   */
  const addRow = (tableId: number, row: ResultRow) => {
    const { result: latest, target: latestTarget } = latestRef.current
    if (!latest?.rows || !latestTarget || latestTarget.table.id !== tableId) return
    const shownRow = Object.fromEntries(
      latestTarget.columns.map(({ name, column }) => [name, row[column]])
    )
    onResultChange({ ...latest, rows: [shownRow, ...latest.rows] })
  }

  /** Drops a row deleted outside the grid, such as a user deleted through Auth. */
  const removeRow = (rowIdentifiers: Record<string, unknown>) => {
    const { result: latest, target: latestTarget } = latestRef.current
    if (!latest?.rows || !latestTarget) return
    onResultChange({
      ...latest,
      rows: latest.rows.filter(
        (row) =>
          !isEqual(
            getResultRowIdentifiers(row, latestTarget.table, latestTarget.columns),
            rowIdentifiers
          )
      ),
    })
  }

  const revertEdit = (edit: PendingCellEdit) =>
    setPendingEdits(pendingEdits.filter((candidate) => candidate !== edit))

  const discardEdits = () => setPendingEdits([])

  const handleSave = () => {
    if (!project || !queryGrant || isSaving || pendingEdits.length === 0) return
    saveEdits(
      {
        projectRef: project.ref,
        connectionString: project.connectionString,
        grant: queryGrant,
        edits: pendingEdits,
        roleImpersonationState: context?.roleImpersonationState ?? roleImpersonationState,
      },
      {
        onSuccess: ({ savedRows, editedRows }, { edits }) => {
          const { result: latest, target: latestTarget } = latestRef.current
          if (!latest) return

          const unconfirmed = editedRows.filter(
            (row) =>
              !savedRows.some(
                (saved) =>
                  saved.table.id === row.table.id &&
                  isEqual(saved.rowIdentifiers, row.rowIdentifiers)
              )
          )
          const isUnconfirmed = (edit: PendingCellEdit) =>
            unconfirmed.some(
              (row) =>
                row.table.id === edit.table.id && isEqual(row.rowIdentifiers, edit.rowIdentifiers)
            )

          onResultChange({
            ...latest,
            rows:
              latest.rows && latestTarget
                ? replaceResultRows({
                    rows: latest.rows,
                    replacements: savedRows,
                    table: latestTarget.table,
                    columns: latestTarget.columns,
                  })
                : latest.rows,
            pendingEdits: (latest.pendingEdits ?? []).filter(
              (edit) => !edits.includes(edit) || isUnconfirmed(edit)
            ),
          })

          if (unconfirmed.length === 0) {
            toast.success('Changes saved')
          } else {
            const count = unconfirmed.length
            toast.warning(
              `${count} edited ${pluralize(count, 'row')} couldn't be read back after saving`,
              {
                description:
                  'They may have been deleted, or your role may not have access to them. Their changes are still pending.',
              }
            )
          }
        },
      }
    )
  }

  return {
    target,
    columns,
    isLoadingTarget: canIdentifyRows && isLoadingTarget,
    canEdit,
    rows: shown.rows,
    isCellEdited: (row: ResultRow, resultColumn: string) =>
      shown.editedColumns.get(row)?.has(resultColumn) ?? false,
    pendingEdits,
    getRowIdentifiers,
    findRow,
    addRow,
    removeRow,
    stageCellEdit,
    stageRowEdits,
    revertEdit,
    discardEdits,
    saveEdits: handleSave,
    isSaving,
    canSave: hasWritePermission && !!queryGrant && pendingEdits.length > 0 && !isSaving,
  }
}

export type QueryResultEditing = ReturnType<typeof useQueryResultEditing>
