import { PostgresTable } from '@supabase/postgres-meta'
import { useTableUpdateMutation } from 'data/tables/table-update-mutation'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'

interface ToggleRLSButtonProps {
  table?: PostgresTable
  isRLSEnabled?: boolean
  onSuccess?: (value: boolean) => void
}

export const ToggleRLSButton = ({
  table,
  isRLSEnabled = false,
  onSuccess,
}: ToggleRLSButtonProps) => {
  const { data: project } = useSelectedProjectQuery()
  const [showConfirmation, setShowConfirmation] = useState(false)

  const action = isRLSEnabled ? 'Disable' : 'Enable'

  const { mutate: updateTable, isPending } = useTableUpdateMutation()

  const onConfirm = () => {
    if (!project) return console.error('Project is required')
    if (!table) return console.error('Table is missing')

    updateTable(
      {
        id: table.id,
        projectRef: project?.ref,
        connectionString: project?.connectionString,
        schema: table.schema,
        name: table.name,
        payload: { rls_enabled: !isRLSEnabled },
      },
      {
        onSuccess: () => {
          toast.success(`Row Level Security has been ${action.toLowerCase()} for this table.`)
          onSuccess?.(!isRLSEnabled)
          setShowConfirmation(false)
        },
        onError: (error) => {
          toast.error(`Failed to ${action.toLowerCase()} RLS: ${error.message}`)
        },
      }
    )
  }

  return (
    <>
      <Button type="default" className="w-min" onClick={() => setShowConfirmation(true)}>
        {action} RLS
      </Button>
      <ConfirmationModal
        visible={showConfirmation}
        loading={isPending}
        title={`Confirm to ${action.toLowerCase()} Row Level Security`}
        description={`Are you sure you want to ${action.toLowerCase()} Row Level Security for this table?`}
        confirmLabel={`${action} RLS`}
        onCancel={() => setShowConfirmation(false)}
        onConfirm={onConfirm}
      />
    </>
  )
}
