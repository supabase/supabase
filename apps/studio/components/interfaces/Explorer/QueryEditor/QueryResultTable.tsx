import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

import type { QueryResult } from '../types'
import { QueryResultRowEditor } from './QueryResultRowEditor'
import { DataGridResults } from '@/components/ui/DataGridResults'
import { queryResultTableQueryOptions } from '@/data/sql/query-result-table-query'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { useLatest } from '@/hooks/misc/useLatest'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { useIsProtectedSchema } from '@/hooks/useProtectedSchemas'
import { getResultRowIdentifiers, updateResultRows } from '@/lib/query-result-editing'

export const QueryResultTable = ({
  result,
  canEditRows,
  onResultChange,
}: {
  result: QueryResult
  canEditRows: boolean
  onResultChange: (result: QueryResult) => void
}) => {
  const { data: project } = useSelectedProjectQuery()
  const { can: canEditTables } = useAsyncCheckPermissions(
    PermissionAction.TENANT_SQL_ADMIN_WRITE,
    'tables'
  )
  const { can: canEditColumns } = useAsyncCheckPermissions(
    PermissionAction.TENANT_SQL_ADMIN_WRITE,
    'columns'
  )
  const context = result.editingContext
  const isPrimaryDatabase =
    context?.databaseIdentifier === undefined || context.databaseIdentifier === project?.ref
  const canInspectResult =
    canEditRows &&
    (canEditTables || canEditColumns) &&
    result.source === 'database' &&
    !!context &&
    context.projectRef === project?.ref &&
    isPrimaryDatabase
  const { data: target, isLoading: isLoadingTarget } = useQuery({
    ...queryResultTableQueryOptions({
      projectRef: project?.ref,
      connectionString: project?.connectionString,
      sql: result.sql,
      roleImpersonationState: context?.roleImpersonationState,
    }),
    enabled: canInspectResult && !!result.sql,
  })
  const { isSchemaLocked } = useIsProtectedSchema({ schema: target?.table.schema ?? '' })
  const canEdit = canInspectResult && !!target && !isSchemaLocked
  const [selection, setSelection] = useState<{
    result: QueryResult
    row: Record<string, unknown>
  }>()
  const resultRef = useLatest(result)
  const selectedRow = selection?.result === result ? selection.row : undefined
  const identifiers =
    target && selectedRow
      ? getResultRowIdentifiers(selectedRow, target.table, target.columns)
      : null

  return (
    <>
      <DataGridResults
        rows={result.rows ?? []}
        reserveRowActions={result.source === 'database'}
        isLoadingRowActions={canInspectResult && isLoadingTarget}
        onEditRow={canEdit ? (row) => setSelection({ result, row }) : undefined}
        canEditRow={
          target ? (row) => !!getResultRowIdentifiers(row, target.table, target.columns) : undefined
        }
      />
      {canEdit && target && selectedRow && identifiers && project && (
        <QueryResultRowEditor
          projectRef={project.ref}
          connectionString={project.connectionString}
          table={target.table}
          identifiers={identifiers}
          roleImpersonationState={context?.roleImpersonationState}
          onClose={() => setSelection(undefined)}
          onSave={(updated) => {
            // A new run may have finished while this mutation was in flight.
            if (resultRef.current === result) {
              onResultChange({
                ...result,
                rows: updateResultRows({
                  rows: result.rows ?? [],
                  original: selectedRow,
                  updated,
                  columns: target.columns,
                  table: target.table,
                }),
              })
            }
            setSelection(undefined)
          }}
        />
      )}
    </>
  )
}
