import type { PostgresPolicy } from '@supabase/postgres-meta'
import { isEmpty } from 'lodash'
import Link from 'next/link'
import { useCallback, useState } from 'react'
import { toast } from 'sonner'

import { useParams } from 'common'
import {
  PolicyTableRow,
  PolicyTableRowProps,
} from 'components/interfaces/Auth/Policies/PolicyTableRow'
import { ProtectedSchemaWarning } from 'components/interfaces/Database/ProtectedSchemaWarning'
import { NoSearchResults } from 'components/ui/NoSearchResults'
import { useDatabasePolicyDeleteMutation } from 'data/database-policies/database-policy-delete-mutation'
import { useTableUpdateMutation } from 'data/tables/table-update-mutation'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { Button, Card, CardContent } from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'

interface PoliciesProps {
  search?: string
  schema: string
  tables: PolicyTableRowProps['table'][]
  hasTables: boolean
  isLocked: boolean
  visibleTableIds: Set<number>
  onSelectCreatePolicy: (table: string) => void
  onSelectEditPolicy: (policy: PostgresPolicy) => void
  onResetSearch?: () => void
}

export const Policies = ({
  search,
  schema,
  tables,
  hasTables,
  isLocked,
  visibleTableIds,
  onSelectCreatePolicy,
  onSelectEditPolicy: onSelectEditPolicyAI,
  onResetSearch,
}: PoliciesProps) => {
  const { ref } = useParams()
  const { data: project } = useSelectedProjectQuery()

  const [selectedTableToToggleRLS, setSelectedTableToToggleRLS] = useState<{
    id: number
    schema: string
    name: string
    rls_enabled: boolean
  }>()
  const [selectedPolicyToDelete, setSelectedPolicyToDelete] = useState<any>({})

  const { mutate: updateTable, isPending: isUpdatingTable } = useTableUpdateMutation({
    onError: (error) => {
      toast.error(`Failed to toggle RLS: ${error.message}`)
    },
    onSettled: () => {
      closeConfirmModal()
    },
  })

  const { mutate: deleteDatabasePolicy, isPending: isDeletingPolicy } =
    useDatabasePolicyDeleteMutation({
      onSuccess: () => {
        toast.success('Successfully deleted policy!')
      },
      onSettled: () => {
        closeConfirmModal()
      },
    })

  const closeConfirmModal = useCallback(() => {
    setSelectedPolicyToDelete({})
    setSelectedTableToToggleRLS(undefined)
  }, [])

  const onSelectToggleRLS = useCallback(
    (table: { id: number; schema: string; name: string; rls_enabled: boolean }) => {
      setSelectedTableToToggleRLS(table)
    },
    []
  )

  const onSelectEditPolicy = useCallback(
    (policy: PostgresPolicy) => {
      onSelectEditPolicyAI(policy)
    },
    [onSelectEditPolicyAI]
  )

  const onSelectDeletePolicy = useCallback((policy: PostgresPolicy) => {
    setSelectedPolicyToDelete(policy)
  }, [])

  // Methods that involve some API
  const onToggleRLS = async () => {
    if (!selectedTableToToggleRLS) return console.error('Table is required')

    const payload = {
      id: selectedTableToToggleRLS.id,
      rls_enabled: !selectedTableToToggleRLS.rls_enabled,
    }

    updateTable({
      projectRef: project?.ref!,
      connectionString: project?.connectionString,
      id: selectedTableToToggleRLS.id,
      name: selectedTableToToggleRLS.name,
      schema: selectedTableToToggleRLS.schema,
      payload: payload,
    })
  }

  const onDeletePolicy = async () => {
    if (!project) return console.error('Project is required')
    deleteDatabasePolicy({
      projectRef: project.ref,
      connectionString: project.connectionString,
      originalPolicy: selectedPolicyToDelete,
    })
  }

  const handleCreatePolicy = useCallback(
    (tableData: PolicyTableRowProps['table']) => {
      onSelectCreatePolicy(tableData.name)
    },
    [onSelectCreatePolicy]
  )

  if (!hasTables) {
    return (
      <Card className="w-full bg-transparent">
        <CardContent className="flex flex-col items-center justify-center p-8">
          <h2 className="heading-default">No tables to create policies for</h2>

          <p className="text-sm text-foreground-light text-center mb-4">
            RLS Policies control per-user access to table rows. Create a table in this schema first
            before creating a policy.
          </p>
          <Button asChild type="default">
            <Link href={`/project/${ref}/editor`}>Create a table</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <div className="flex flex-col gap-y-4 pb-4">
        {isLocked && <ProtectedSchemaWarning schema={schema} entity="policies" />}
        {tables.length > 0 ? (
          <>
            {tables.map((table) => {
              const isVisible = visibleTableIds.has(table.id)
              return (
                <section
                  key={table.id}
                  hidden={!isVisible}
                  aria-hidden={!isVisible}
                  data-testid={`policy-table-${table.name}`}
                >
                  <PolicyTableRow
                    table={table}
                    isLocked={schema === 'realtime' ? true : isLocked}
                    onSelectToggleRLS={onSelectToggleRLS}
                    onSelectCreatePolicy={handleCreatePolicy}
                    onSelectEditPolicy={onSelectEditPolicy}
                    onSelectDeletePolicy={onSelectDeletePolicy}
                  />
                </section>
              )
            })}
            {!!search && visibleTableIds.size === 0 && (
              <NoSearchResults searchString={search ?? ''} onResetFilter={onResetSearch} />
            )}
          </>
        ) : hasTables ? (
          <NoSearchResults searchString={search ?? ''} onResetFilter={onResetSearch} />
        ) : null}
      </div>

      <ConfirmationModal
        visible={!isEmpty(selectedPolicyToDelete)}
        variant="destructive"
        title="Delete policy"
        description={`Are you sure you want to delete the policy “${selectedPolicyToDelete.name}”? This action cannot be undone.`}
        confirmLabel="Delete"
        confirmLabelLoading="Deleting"
        loading={isDeletingPolicy}
        onCancel={closeConfirmModal}
        onConfirm={onDeletePolicy}
      />

      <ConfirmationModal
        visible={selectedTableToToggleRLS !== undefined}
        variant={selectedTableToToggleRLS?.rls_enabled ? 'destructive' : 'default'}
        title={`${selectedTableToToggleRLS?.rls_enabled ? 'Disable' : 'Enable'} Row Level Security`}
        description={`Are you sure you want to ${
          selectedTableToToggleRLS?.rls_enabled ? 'disable' : 'enable'
        } Row Level Security (RLS) for the table “${selectedTableToToggleRLS?.name}”?`}
        confirmLabel={`${selectedTableToToggleRLS?.rls_enabled ? 'Disable' : 'Enable'} RLS`}
        confirmLabelLoading={`${selectedTableToToggleRLS?.rls_enabled ? 'Disabling' : 'Enabling'} RLS`}
        loading={isUpdatingTable}
        onCancel={closeConfirmModal}
        onConfirm={onToggleRLS}
      />
    </>
  )
}
