import type { PostgresPolicy, PostgresTable } from '@supabase/postgres-meta'
import { useParams } from 'common/hooks'
import { PolicyEditorModal, PolicyTableRow } from 'components/interfaces/Auth/Policies'
import { isEmpty } from 'lodash'
import { useRouter } from 'next/router'
import { useCallback, useState } from 'react'
import toast from 'react-hot-toast'
import { IconHelpCircle } from 'ui'

import { useIsRLSAIAssistantEnabled } from 'components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import ProtectedSchemaWarning from 'components/interfaces/Database/ProtectedSchemaWarning'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import NoSearchResults from 'components/to-be-cleaned/NoSearchResults'
import ProductEmptyState from 'components/to-be-cleaned/ProductEmptyState'
import InformationBox from 'components/ui/InformationBox'
import { useDatabasePolicyCreateMutation } from 'data/database-policies/database-policy-create-mutation'
import { useDatabasePolicyDeleteMutation } from 'data/database-policies/database-policy-delete-mutation'
import { useDatabasePolicyUpdateMutation } from 'data/database-policies/database-policy-update-mutation'
import { useTableUpdateMutation } from 'data/tables/table-update-mutation'
import { useTableEditorStateSnapshot } from 'state/table-editor'
import ConfirmModal from 'ui-patterns/Dialogs/ConfirmDialog'

interface PoliciesProps {
  tables: PostgresTable[]
  hasTables: boolean
  isLocked: boolean
  onSelectEditPolicy: (policy: PostgresPolicy) => void
}

const Policies = ({
  tables,
  hasTables,
  isLocked,
  onSelectEditPolicy: onSelectEditPolicyAI,
}: PoliciesProps) => {
  const router = useRouter()
  const { ref } = useParams()
  const { project } = useProjectContext()
  const snap = useTableEditorStateSnapshot()

  const isAiAssistantEnabled = useIsRLSAIAssistantEnabled()

  const [selectedSchemaAndTable, setSelectedSchemaAndTable] = useState<any>({})
  const [selectedTableToToggleRLS, setSelectedTableToToggleRLS] = useState<any>({})
  const [RLSEditorWithAIShown, showRLSEditorWithAI] = useState(false)
  const [selectedPolicyToEdit, setSelectedPolicyToEdit] = useState<PostgresPolicy | {}>({})
  const [selectedPolicyToDelete, setSelectedPolicyToDelete] = useState<any>({})

  const { mutateAsync: createDatabasePolicy } = useDatabasePolicyCreateMutation()
  const { mutateAsync: updateDatabasePolicy } = useDatabasePolicyUpdateMutation()
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

  const closePolicyEditorModal = useCallback(() => {
    setSelectedPolicyToEdit({})
    setSelectedSchemaAndTable({})
    if (RLSEditorWithAIShown) {
      showRLSEditorWithAI(false)
    }
  }, [RLSEditorWithAIShown])

  const closeConfirmModal = () => {
    setSelectedPolicyToDelete({})
    setSelectedTableToToggleRLS({})
  }

  const onSelectToggleRLS = (table: PostgresTable) => {
    setSelectedTableToToggleRLS(table)
  }

  const onSelectCreatePolicy = (table: any) => {
    setSelectedSchemaAndTable({ schema: table.schema, table: table.name })
  }

  const onSelectEditPolicy = (policy: any) => {
    if (isAiAssistantEnabled) {
      onSelectEditPolicyAI(policy)
    } else {
      setSelectedPolicyToEdit(policy)
      setSelectedSchemaAndTable({ schema: policy.schema, table: policy.table })
    }
  }

  const onSelectDeletePolicy = (policy: any) => {
    setSelectedPolicyToDelete(policy)
  }

  const onSavePolicySuccess = useCallback(async () => {
    toast.success('Policy successfully saved!')
    closePolicyEditorModal()
  }, [closePolicyEditorModal])

  // Methods that involve some API
  const onToggleRLS = async () => {
    const payload = {
      id: selectedTableToToggleRLS.id,
      rls_enabled: !selectedTableToToggleRLS.rls_enabled,
    }

    updateTable({
      projectRef: project?.ref!,
      connectionString: project?.connectionString,
      id: payload.id,
      schema: (selectedTableToToggleRLS as PostgresTable).schema,
      payload: payload,
    })
  }

  const onCreatePolicy = useCallback(
    async (payload: any) => {
      if (!project) {
        console.error('Project is required')
        return true
      }

      try {
        await createDatabasePolicy({
          projectRef: project.ref,
          connectionString: project.connectionString,
          payload,
        })
        return false
      } catch (error) {
        return true
      }
    },
    [project]
  )

  const onUpdatePolicy = async (payload: any) => {
    if (!project) {
      console.error('Project is required')
      return true
    }

    try {
      await updateDatabasePolicy({
        projectRef: project.ref,
        connectionString: project.connectionString,
        id: payload.id,
        payload,
      })
      return false
    } catch (error) {
      return true
    }
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
              icon={<IconHelpCircle strokeWidth={2} />}
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
        {isLocked && <ProtectedSchemaWarning schema={snap.selectedSchemaName} entity="policies" />}
        {tables.length > 0 ? (
          tables.map((table: any) => (
            <section key={table.id}>
              <PolicyTableRow
                table={table}
                isLocked={isLocked}
                onSelectToggleRLS={onSelectToggleRLS}
                onSelectCreatePolicy={onSelectCreatePolicy}
                onSelectEditPolicy={onSelectEditPolicy}
                onSelectDeletePolicy={onSelectDeletePolicy}
              />
            </section>
          ))
        ) : hasTables ? (
          <NoSearchResults />
        ) : null}
      </div>

      <PolicyEditorModal
        showAssistantPreview
        visible={!isEmpty(selectedSchemaAndTable)}
        schema={selectedSchemaAndTable.schema}
        table={selectedSchemaAndTable.table}
        selectedPolicyToEdit={selectedPolicyToEdit}
        onSelectCancel={closePolicyEditorModal}
        onCreatePolicy={onCreatePolicy}
        onUpdatePolicy={onUpdatePolicy}
        onSaveSuccess={onSavePolicySuccess}
      />

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
        danger={selectedTableToToggleRLS.rls_enabled}
        visible={!isEmpty(selectedTableToToggleRLS)}
        title={`Confirm to ${
          selectedTableToToggleRLS.rls_enabled ? 'disable' : 'enable'
        } Row Level Security`}
        description={`Are you sure you want to ${
          selectedTableToToggleRLS.rls_enabled ? 'disable' : 'enable'
        } Row Level Security for the table "${selectedTableToToggleRLS.name}"?`}
        buttonLabel="Confirm"
        buttonLoadingLabel="Saving"
        onSelectCancel={closeConfirmModal}
        onSelectConfirm={onToggleRLS}
      />
    </>
  )
}

export default Policies
