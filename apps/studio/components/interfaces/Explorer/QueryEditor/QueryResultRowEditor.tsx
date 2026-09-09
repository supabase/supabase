import type { PGTable } from '@supabase/pg-meta'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'
import { z } from 'zod'

import {
  RowEditor,
  type RowEditorProps,
} from '@/components/interfaces/TableGridEditor/SidePanelEditor/RowEditor/RowEditor'
import { DiscardChangesConfirmationDialog } from '@/components/ui-patterns/Dialogs/DiscardChangesConfirmationDialog'
import { queryResultRowQueryOptions } from '@/data/sql/query-result-table-query'
import { useTableRowUpdateMutation } from '@/data/table-rows/table-row-update-mutation'
import { useConfirmOnClose } from '@/hooks/ui/useConfirmOnClose'
import type { RoleImpersonationState } from '@/lib/role-impersonation'

export const QueryResultRowEditor = ({
  projectRef,
  connectionString,
  table,
  identifiers,
  roleImpersonationState,
  onClose,
  onSave,
}: {
  projectRef: string
  connectionString?: string | null
  table: PGTable
  identifiers: Record<string, unknown>
  roleImpersonationState?: RoleImpersonationState
  onClose: () => void
  onSave: (row: Record<string, unknown>) => void
}) => {
  const [isDirty, setIsDirty] = useState(false)
  const {
    data: row,
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
  const { mutateAsync: updateRow, isPending: isSaving } = useTableRowUpdateMutation()
  const { confirmOnClose, modalProps } = useConfirmOnClose({
    checkIsDirty: () => isDirty,
    onClose,
  })
  const handleClose = () => {
    if (!isSaving) confirmOnClose()
  }

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
        applyButtonLabel="Save"
        roleImpersonationState={roleImpersonationState ?? { role: undefined, claims: undefined }}
        closePanel={handleClose}
        updateEditorDirty={() => setIsDirty(true)}
        saveChanges={async (payload, _isNewRecord, _configuration, resolve) => {
          try {
            const changes = z.record(z.unknown()).parse(payload)
            if (Object.keys(changes).length === 0) {
              onClose()
              return
            }
            const updated = await updateRow({
              projectRef,
              connectionString,
              table,
              payload: changes,
              configuration: { identifiers },
              enumArrayColumns: (table.columns ?? [])
                .filter(
                  (column) => column.enums.length > 0 && column.data_type.toLowerCase() === 'array'
                )
                .map(({ name }) => name),
              returning: true,
              roleImpersonationState,
            })
            const [savedRow] = z.array(z.record(z.unknown())).parse(updated)
            if (!savedRow) {
              toast.error(
                'No row was updated. It may have been deleted or your role may not have permission to update it.'
              )
              return
            }
            toast.success('Row updated')
            onSave(savedRow)
          } catch (error) {
            if (error instanceof z.ZodError) {
              toast.error('Unable to read the updated row. Run the query again.')
            }
            // The mutation displays its error; preserve the sheet and unsaved input for retry.
          } finally {
            resolve()
          }
        }}
      />
      <DiscardChangesConfirmationDialog {...modalProps} />
    </>
  )
}
