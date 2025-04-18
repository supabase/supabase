import type { PostgresPolicy } from '@supabase/postgres-meta'
import { isEmpty } from 'lodash'
import { HelpCircle } from 'lucide-react'
import { useRouter } from 'next/router'
import { useState } from 'react'
import { toast } from 'sonner'

import { useParams } from 'common'
import PolicyTableRow, {
  PolicyTableRowProps,
} from 'components/interfaces/Auth/Policies/PolicyTableRow'
import ProtectedSchemaWarning from 'components/interfaces/Database/ProtectedSchemaWarning'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import NoSearchResults from 'components/to-be-cleaned/NoSearchResults'
import ProductEmptyState from 'components/to-be-cleaned/ProductEmptyState'
import InformationBox from 'components/ui/InformationBox'
import { useDatabasePolicyDeleteMutation } from 'data/database-policies/database-policy-delete-mutation'
import { useTableUpdateMutation } from 'data/tables/table-update-mutation'
import ConfirmModal from 'ui-patterns/Dialogs/ConfirmDialog'

interface PoliciesProps {
  schema: string
  tables: PolicyTableRowProps['table'][]
  hasTables: boolean
  isLocked: boolean
  onSelectCreatePolicy: (table: string) => void
  onSelectEditPolicy: (policy: PostgresPolicy) => void
}

const Policies = ({
  schema,
  tables,
  hasTables,
  isLocked,
  onSelectCreatePolicy,
  onSelectEditPolicy: onSelectEditPolicyAI,
}: PoliciesProps) => {
  const router = useRouter()
  const { ref } = useParams()
  const { project } = useProjectContext()

  const [selectedTableToToggleRLS, setSelectedTableToToggleRLS] = useState<{
    id: number
    schema: string
    name: string
    rls_enabled: boolean
  }>()
  const [selectedPolicyToDelete, setSelectedPolicyToDelete] = useState<any>({})

  const { mutate: updateTable } = useTableUpdateMutation({
    onError: (error) => {
      toast.error(`Failed to toggle RLS: ${error.message}`)
    },
    onSettled: () => {
      closeConfirmModal()
    },
  })
  const { mutate: deleteDatabasePolicy } = useDatabasePolicyDeleteMutation({
    onSuccess: () => {
      toast.success('Successfully deleted policy!')
    },
    onSettled: () => {
      closeConfirmModal()
    },
  })

  const closeConfirmModal = () => {
    setSelectedPolicyToDelete({})
    setSelectedTableToToggleRLS(undefined)
  }

  const onSelectToggleRLS = (table: {
    id: number
    schema: string
    name: string
    rls_enabled: boolean
  }) => {
    setSelectedTableToToggleRLS(table)
  }

  const onSelectEditPolicy = (policy: any) => {
    onSelectEditPolicyAI(policy)
  }

  const onSelectDeletePolicy = (policy: any) => {
    setSelectedPolicyToDelete(policy)
  }

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
      id: payload.id,
      schema: selectedTableToToggleRLS.schema,
      payload: payload,
    })
  }

  const onDeletePolicy = async () => {
    if (!project) return console.error('Project is required')
    deleteDatabasePolicy({
      projectRef: project.ref,
      connectionString: project.connectionString,
      id: selectedPolicyToDelete.id,
    })
  }

  if (tables.length === 0) {
    return (
      <div className="flex-grow flex items-center justify-center">
        <ProductEmptyState
          size="large"
          title="Row-Level Security (RLS) Policies"
          ctaButtonLabel="Create a table"
          infoButtonLabel="What is RLS?"
          infoButtonUrl="https://supabase.com/docs/guides/auth/row-level-security"
          onClickCta={() => router.push(`/project/${ref}/editor`)}
        >
          <div className="space-y-4">
            <InformationBox
              title="What are policies?"
              icon={<HelpCircle size={14} strokeWidth={2} />}
              description={
                <div className="space-y-2">
                  <p className="text-sm">
                    Policies restrict, on a per-user basis, which rows can be returned by normal
                    queries, or inserted, updated, or deleted by data modification commands.
                  </p>
                  <p className="text-sm">
                    This is also known as Row-Level Security (RLS). Each policy is attached to a
                    table, and the policy is executed each time its accessed.
                  </p>
                </div>
              }
            />
            <p className="text-sm text-foreground-light">
              Create a table in this schema first before creating a policy.
            </p>
          </div>
        </ProductEmptyState>
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-col gap-y-4 pb-4">
        {isLocked && <ProtectedSchemaWarning schema={schema} entity="policies" />}
        {tables.length > 0 ? (
          tables.map((table) => (
            <section key={table.id}>
              <PolicyTableRow
                table={table}
                isLocked={schema === 'realtime' ? true : isLocked}
                onSelectToggleRLS={onSelectToggleRLS}
                onSelectCreatePolicy={() => onSelectCreatePolicy(table.name)}
                onSelectEditPolicy={onSelectEditPolicy}
                onSelectDeletePolicy={onSelectDeletePolicy}
              />
            </section>
          ))
        ) : hasTables ? (
          <NoSearchResults />
        ) : null}
      </div>

      <ConfirmModal
        danger
        visible={!isEmpty(selectedPolicyToDelete)}
        title="Confirm to delete policy"
        description={`This is permanent! Are you sure you want to delete the policy "${selectedPolicyToDelete.name}"`}
        buttonLabel="Delete"
        buttonLoadingLabel="Deleting"
        onSelectCancel={closeConfirmModal}
        onSelectConfirm={onDeletePolicy}
      />

      <ConfirmModal
        danger={selectedTableToToggleRLS?.rls_enabled}
        visible={selectedTableToToggleRLS !== undefined}
        title={`Confirm to ${
          selectedTableToToggleRLS?.rls_enabled ? 'disable' : 'enable'
        } Row Level Security`}
        description={`Are you sure you want to ${
          selectedTableToToggleRLS?.rls_enabled ? 'disable' : 'enable'
        } Row Level Security for the table "${selectedTableToToggleRLS?.name}"?`}
        buttonLabel="Confirm"
        buttonLoadingLabel="Saving"
        onSelectCancel={closeConfirmModal}
        onSelectConfirm={onToggleRLS}
      />
    </>
  )
}

export default Policies
