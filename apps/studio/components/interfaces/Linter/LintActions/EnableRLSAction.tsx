import { useState } from 'react'
import { toast } from 'sonner'

import { LintActionArgs } from 'components/interfaces/Linter/Linter.constants'
import { useTableUpdateMutation } from 'data/tables/table-update-mutation'
import { useTablesQuery } from 'data/tables/tables-query'
import { Button } from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'

const EnableRLSAction = ({ projectRef, connectionString, metadata }: LintActionArgs) => {
  const [isConfirmVisible, setIsConfirmVisible] = useState(false)

  const tableSchema = (metadata as { schema?: string })?.schema
  const tableName = (metadata as { name?: string })?.name

  // Query tables to find the table ID
  const { data: table } = useTablesQuery(
    {
      projectRef,
      connectionString,
      schema: tableSchema,
      includeColumns: false,
    },
    {
      enabled: !!projectRef && !!tableSchema && !!tableName,
      select: (tables) => {
        // Find the table by name
        return tables.find((table) => table.name === tableName)
      },
    }
  )

  const { mutate: updateTable, isLoading: isExecuting } = useTableUpdateMutation({
    onSuccess: () => {
      toast.success('Enable RLS successful')
      setIsConfirmVisible(false)
    },
    onError: (error) => {
      const message = error?.message || 'Failed to enable RLS'
      toast.error(message)
    },
  })

  const handleEnableRLS = () => {
    if (!projectRef) {
      toast.error('Project ref is required')
      return
    }

    if (!tableSchema || !tableName) {
      toast.error('Table information is required to enable RLS')
      return
    }

    if (!table?.id) {
      toast.error('Table ID not found')
      return
    }

    updateTable({
      projectRef,
      connectionString,
      id: table.id,
      name: tableName,
      schema: tableSchema,
      payload: {
        id: table.id,
        rls_enabled: true,
      },
    })
  }

  const title = tableName
    ? `Enable Row Level Security for ${tableName}?`
    : 'Enable Row Level Security for this table?'
  const description =
    tableSchema && tableName
      ? `Are you sure you want to enable Row Level Security for "${tableSchema}.${tableName}"?`
      : 'Are you sure you want to enable Row Level Security for this table?'

  return (
    <div>
      <Button type="primary" loading={isExecuting} onClick={() => setIsConfirmVisible(true)}>
        Enable RLS
      </Button>
      <ConfirmationModal
        visible={isConfirmVisible}
        loading={isExecuting}
        title={title}
        description={description}
        confirmLabel="Enable"
        onCancel={() => setIsConfirmVisible(false)}
        onConfirm={handleEnableRLS}
      />
    </div>
  )
}

export default EnableRLSAction
