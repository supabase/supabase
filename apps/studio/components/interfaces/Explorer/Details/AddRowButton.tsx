import { PlusIcon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from 'ui'
import { z } from 'zod'

import { RowEditor } from '@/components/interfaces/TableGridEditor/SidePanelEditor/RowEditor/RowEditor'
import { DiscardChangesConfirmationDialog } from '@/components/ui-patterns/Dialogs/DiscardChangesConfirmationDialog'
import type { QueryRelation } from '@/data/sql/query-relations-query'
import { useTableRowCreateMutation } from '@/data/table-rows/table-row-create-mutation'
import { getTableQuery, type RetrieveTableResult } from '@/data/tables/table-retrieve-query'
import { FGA_PERMISSIONS, useAsyncCheckPermissionsV2 } from '@/hooks/misc/useCheckPermissionsV2'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { useConfirmOnClose } from '@/hooks/ui/useConfirmOnClose'
import { useIsProtectedSchema } from '@/hooks/useProtectedSchemas'

const configurationSchema = z.object({ createMore: z.boolean().optional() })

/**
 * Adds a row to a table with the Table Editor's row form, written straight away. Shown only
 * where the user could write the row themselves: a table they can change, outside the
 * schemas Supabase manages.
 */
export const AddRowButton = ({
  relation,
  onRowAdded,
}: {
  relation: QueryRelation
  /** Receives the row as it was stored, so a surface showing the table can show it too. */
  onRowAdded?: (row: Record<string, unknown>) => void
}) => {
  const { data: project } = useSelectedProjectQuery()
  const { isSchemaLocked } = useIsProtectedSchema({ schema: relation.schema })
  const { can: canWriteDatabase } = useAsyncCheckPermissionsV2(
    FGA_PERMISSIONS.PROJECT.DATABASE_WRITE
  )
  const [isOpen, setIsOpen] = useState(false)
  const [isDirty, setIsDirty] = useState(false)

  // The row form needs the full table definition, so it's only fetched once asked for.
  const [table, setTable] = useState<RetrieveTableResult>()
  const [isLoadingTable, setIsLoadingTable] = useState(false)
  const handleOpen = async () => {
    if (!project) return
    setIsLoadingTable(true)
    try {
      setTable(
        await getTableQuery({
          projectRef: project.ref,
          connectionString: project.connectionString,
          schema: relation.schema,
          name: relation.name,
        })
      )
      setIsOpen(true)
    } catch (error) {
      toast.error(
        `Failed to load ${relation.name}: ${error instanceof Error ? error.message : String(error)}`
      )
    } finally {
      setIsLoadingTable(false)
    }
  }
  const { mutateAsync: createRow } = useTableRowCreateMutation()

  const handleClose = () => {
    setIsOpen(false)
    setIsDirty(false)
  }
  const { confirmOnClose, modalProps } = useConfirmOnClose({
    checkIsDirty: () => isDirty,
    onClose: handleClose,
  })

  if (!canWriteDatabase || isSchemaLocked) return null

  return (
    <>
      <Button
        variant="default"
        size="tiny"
        icon={<PlusIcon size={14} />}
        loading={isLoadingTable}
        onClick={handleOpen}
      >
        Add row
      </Button>
      {isOpen && table && (
        <RowEditor
          visible
          selectedTable={table}
          applyButtonLabel="Save"
          closePanel={confirmOnClose}
          updateEditorDirty={() => setIsDirty(true)}
          saveChanges={async (payload, _isNewRecord, configuration, resolve) => {
            if (!project) return resolve()
            try {
              const result = await createRow({
                projectRef: project.ref,
                connectionString: project.connectionString,
                table: { id: table.id, name: table.name, schema: table.schema },
                payload,
                enumArrayColumns: (table.columns ?? [])
                  .filter(
                    (column) =>
                      column.enums.length > 0 && column.data_type.toLowerCase() === 'array'
                  )
                  .map(({ name }) => name),
                returning: true,
                telemetryMethod: 'explorer',
              })
              const [row] = z.array(z.record(z.unknown())).catch([]).parse(result)
              if (row) onRowAdded?.(row)
              toast.success(`Row added to ${relation.name}`)
              resolve()
              setIsDirty(false)
              if (!configurationSchema.catch({}).parse(configuration).createMore) handleClose()
            } catch {
              // The mutation shows its error; keep the form so the input can be fixed.
              resolve()
            }
          }}
        />
      )}
      <DiscardChangesConfirmationDialog {...modalProps} />
    </>
  )
}
