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
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { Button, Card, CardContent } from 'ui'
import ConfirmModal from 'ui-patterns/Dialogs/ConfirmDialog'

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

  const [selectedPolicyToDelete, setSelectedPolicyToDelete] = useState<any>({})

  const { mutate: deleteDatabasePolicy } = useDatabasePolicyDeleteMutation({
    onSuccess: () => {
      toast.success('Successfully deleted policy!')
    },
    onSettled: () => {
      closeDeleteModal()
    },
  })

  const closeDeleteModal = useCallback(() => {
    setSelectedPolicyToDelete({})
  }, [])

  const onSelectEditPolicy = useCallback(
    (policy: PostgresPolicy) => {
      onSelectEditPolicyAI(policy)
    },
    [onSelectEditPolicyAI]
  )

  const onSelectDeletePolicy = useCallback((policy: PostgresPolicy) => {
    setSelectedPolicyToDelete(policy)
  }, [])

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
                <section key={table.id} hidden={!isVisible} aria-hidden={!isVisible}>
                  <PolicyTableRow
                    table={table}
                    isLocked={schema === 'realtime' ? true : isLocked}
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

      <ConfirmModal
        danger
        visible={!isEmpty(selectedPolicyToDelete)}
        title="Confirm to delete policy"
        description={`This is permanent! Are you sure you want to delete the policy "${selectedPolicyToDelete.name}"`}
        buttonLabel="Delete"
        buttonLoadingLabel="Deleting"
        onSelectCancel={closeDeleteModal}
        onSelectConfirm={onDeletePolicy}
      />
    </>
  )
}
