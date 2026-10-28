import type { PGTable } from '@supabase/pg-meta'
import { useQuery } from '@tanstack/react-query'
import { isEqual } from 'lodash'
import { useState } from 'react'
import { z } from 'zod'

import {
  RowEditor,
  type RowEditorProps,
} from '@/components/interfaces/TableGridEditor/SidePanelEditor/RowEditor/RowEditor'
import { DiscardChangesConfirmationDialog } from '@/components/ui-patterns/Dialogs/DiscardChangesConfirmationDialog'
import { queryResultRowQueryOptions } from '@/data/sql/query-result-table-query'
import { useConfirmOnClose } from '@/hooks/ui/useConfirmOnClose'
import type { PendingCellEdit } from '@/lib/query-result-editing'
import type { RoleImpersonationState } from '@/lib/role-impersonation'

/**
 * Edits every column of one result row in a sheet, including columns the query didn't
 * select. Changes are queued with the result's other pending edits rather than written, so
 * the row's staged values are shown on top of what the database holds.
 */
export const QueryResultRowEditor = ({
  projectRef,
  connectionString,
  table,
  identifiers,
  pendingEdits,
  roleImpersonationState,
  onClose,
  onStage,
}: {
  projectRef: string
  connectionString?: string | null
  table: PGTable
  identifiers: Record<string, unknown>
  pendingEdits: readonly PendingCellEdit[]
  roleImpersonationState?: RoleImpersonationState
  onClose: () => void
  /** Receives the row as the sheet showed it and the columns that changed. */
  onStage: (row: Record<string, unknown>, changes: Record<string, unknown>) => void
}) => {
  const [isDirty, setIsDirty] = useState(false)
  const {
    data: storedRow,
    isPending,
    isFetching,
    error,
  } = useQuery({
    ...queryResultRowQueryOptions({
      projectRef,
      connectionString,
      table: { schema: table.schema, name: table.name },
      identifiers,
      roleImpersonationState,
    }),
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    gcTime: 0,
  })
  const { confirmOnClose, modalProps } = useConfirmOnClose({
    checkIsDirty: () => isDirty,
    onClose,
  })

  const rowEdits = pendingEdits.filter(
    (edit) => edit.table.id === table.id && isEqual(edit.rowIdentifiers, identifiers)
  )
  const row = storedRow
    ? {
        ...storedRow,
        ...Object.fromEntries(rowEdits.map(({ columnName, newValue }) => [columnName, newValue])),
      }
    : undefined

  let loadState: RowEditorProps['loadState']
  if (error) loadState = { status: 'error', error }
  else if (isPending || isFetching) loadState = { status: 'loading' }

  return (
    <>
      <RowEditor
        visible
        loadState={loadState}
        selectedTable={table}
        row={row}
        applyButtonLabel="Queue changes"
        roleImpersonationState={roleImpersonationState ?? { role: undefined, claims: undefined }}
        closePanel={confirmOnClose}
        updateEditorDirty={() => setIsDirty(true)}
        saveChanges={(payload, _isNewRecord, _configuration, resolve) => {
          const changes = z.record(z.unknown()).safeParse(payload)
          if (row && changes.success && Object.keys(changes.data).length > 0) {
            onStage(row, changes.data)
          } else {
            onClose()
          }
          resolve()
        }}
      />
      <DiscardChangesConfirmationDialog {...modalProps} />
    </>
  )
}
