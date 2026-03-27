'use client'

import { keepPreviousData, useQueryClient } from '@tanstack/react-query'
import { useTableFilter } from 'components/grid/hooks/useTableFilter'
import { useTableSort } from 'components/grid/hooks/useTableSort'
import { validateMsSqlSorting } from 'components/grid/MsSqlValidation'
import { reapplyOptimisticUpdates } from 'components/grid/utils/queueOperationUtils'
import { useIsQueueOperationsEnabled } from 'components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { isMsSqlForeignTable } from 'data/table-editor/table-editor-types'
import { useTableRowsQuery } from 'data/table-rows/table-rows-query'
import { tableRowKeys } from 'data/table-rows/keys'
import { useProjectDetailQuery } from 'data/projects/project-detail-query'
import type { RoleImpersonationState } from 'lib/role-impersonation'
import { EMPTY_ARR } from 'lib/void'
import { useEffect, useMemo } from 'react'
import { useRoleImpersonationStateSnapshot } from 'state/role-impersonation-state'
import { useTableEditorStateSnapshot } from 'state/table-editor'
import type { QueuedOperation } from 'state/table-editor-operation-queue.types'
import { useTableEditorTableStateSnapshot } from 'state/table-editor-table'

import { DataTableRenderer } from '@/components/v2/DataTableRenderer'
import { buildDataTableColumnsFromSupaTable } from '@/components/v2/DataTableRenderer/buildColumnsFromSupaTable'

export function V2TableDataGrid({
  projectRef,
  tableId,
}: {
  projectRef?: string
  tableId?: number
}) {
  const isQueueOperationsEnabled = useIsQueueOperationsEnabled()
  const queryClient = useQueryClient()
  const { data: project } = useProjectDetailQuery(
    { ref: projectRef },
    { enabled: Boolean(projectRef) }
  )
  const tableEditorSnap = useTableEditorStateSnapshot()
  const snap = useTableEditorTableStateSnapshot()
  const preflightCheck = !tableEditorSnap.tablesToIgnorePreflightCheck.includes(tableId ?? -1)

  const { filters } = useTableFilter()
  const { sorts, onApplySorts } = useTableSort()

  const roleImpersonationState = useRoleImpersonationStateSnapshot()

  const msSqlWarning = isMsSqlForeignTable(snap.originalTable)
    ? validateMsSqlSorting({ filters, sorts, table: snap.originalTable })
    : { warning: null }
  const tableQueriesEnabled = msSqlWarning.warning === null

  const rowsQueryEnabled =
    Boolean(
      projectRef &&
        project?.connectionString &&
        tableId !== undefined &&
        !Number.isNaN(tableId)
    ) && tableQueriesEnabled

  const {
    data,
    error,
    isSuccess,
    isError,
    isLoading: isRowsLoading,
    dataUpdatedAt,
  } = useTableRowsQuery(
    {
      projectRef,
      connectionString: project?.connectionString,
      tableId,
      sorts,
      filters,
      page: snap.page,
      preflightCheck,
      limit: tableEditorSnap.rowsPerPage,
      roleImpersonationState: roleImpersonationState as RoleImpersonationState,
    },
    {
      placeholderData: keepPreviousData,
      enabled: rowsQueryEnabled,
      retry: (_failureCount, err: unknown) => {
        const message =
          err && typeof err === 'object' && 'message' in err ? String(err.message) : ''
        const doesNotExistError = message.includes('does not exist')
        if (doesNotExistError) onApplySorts([])
        return false
      },
    }
  )

  const isSaving = tableEditorSnap.operationQueue.status === 'saving'
  // Re-run when row data updates so optimistic queue edits stay in sync (matches SupabaseGrid).
  // biome-ignore lint/correctness/useExhaustiveDependencies: dataUpdatedAt is intentional
  useEffect(() => {
    if (
      isSuccess &&
      projectRef &&
      tableId &&
      isQueueOperationsEnabled &&
      tableEditorSnap.hasPendingOperations &&
      !isSaving
    ) {
      reapplyOptimisticUpdates({
        queryClient,
        projectRef,
        tableId,
        operations: tableEditorSnap.operationQueue.operations as readonly QueuedOperation[],
      })
    }
  }, [
    isSuccess,
    dataUpdatedAt,
    projectRef,
    tableId,
    isQueueOperationsEnabled,
    tableEditorSnap.hasPendingOperations,
    tableEditorSnap.operationQueue.operations,
    queryClient,
    isSaving,
  ])

  const rows = data?.rows ?? EMPTY_ARR

  const columns = useMemo(() => buildDataTableColumnsFromSupaTable(snap.table), [snap.table])

  // Stable unique keys per page: positional `idx` from table-rows-query (must not be overwritten by a column named idx)
  const rowKeyFn = useMemo(
    () => (row: Record<string, unknown>) => `${snap.page}-${String(row.idx ?? '')}`,
    [snap.page]
  )

  const gridError =
    isError && error
      ? error instanceof Error
        ? error
        : new Error(typeof error === 'string' ? error : 'Failed to load rows')
      : null

  return (
    <>
      {msSqlWarning.warning !== null && <msSqlWarning.Component />}
      <DataTableRenderer<Record<string, unknown>>
        className="min-h-0 flex-1"
        hideToolbar
        columns={columns}
        rows={rows as Record<string, unknown>[]}
        rowKey={rowKeyFn}
        isLoading={rowsQueryEnabled && isRowsLoading}
        error={gridError}
        emptyState={{
          title: 'No rows',
          description: 'This page returned no rows for the current filters and sort.',
        }}
        onRetry={() => {
          void queryClient.invalidateQueries({
            queryKey: tableRowKeys.tableRowsAndCount(projectRef, tableId),
          })
        }}
      />
    </>
  )
}
