import { useState, FC } from 'react'
import { isEmpty } from 'lodash'
import { IconHelpCircle } from 'ui'
import { useRouter } from 'next/router'
import { observer } from 'mobx-react-lite'
import { useParams, useStore } from 'hooks'
import { PolicyEditorModal, PolicyTableRow } from 'components/interfaces/Auth/Policies'
import type { PostgresRole, PostgresTable } from '@supabase/postgres-meta'

import ConfirmModal from 'components/ui/Dialogs/ConfirmDialog'
import NoSearchResults from 'components/to-be-cleaned/NoSearchResults'
import ProductEmptyState from 'components/to-be-cleaned/ProductEmptyState'
import InformationBox from 'components/ui/InformationBox'

interface Props {
  tables: PostgresTable[]
  hasTables: boolean
  isLocked: boolean
}

const Policies: FC<Props> = ({ tables, hasTables, isLocked }) => {
  const router = useRouter()
  const { ref } = useParams()

  const { ui, meta } = useStore()
  const roles = meta.roles.list((role: PostgresRole) => !meta.roles.systemRoles.includes(role.name))

  const [selectedSchemaAndTable, setSelectedSchemaAndTable] = useState<any>({})
  const [selectedTableToToggleRLS, setSelectedTableToToggleRLS] = useState<any>({})
  const [selectedPolicyToEdit, setSelectedPolicyToEdit] = useState<any>({})
  const [selectedPolicyToDelete, setSelectedPolicyToDelete] = useState<any>({})

  const closePolicyEditorModal = () => {
    setSelectedPolicyToEdit({})
    setSelectedSchemaAndTable({})
  }

  const closeConfirmModal = () => {
    setSelectedPolicyToDelete({})
    setSelectedTableToToggleRLS({})
  }

  const onSelectToggleRLS = (table: any) => {
    setSelectedTableToToggleRLS(table)
  }

  const onSelectCreatePolicy = (table: any) => {
    setSelectedSchemaAndTable({ schema: table.schema, table: table.name })
  }

  const onSelectEditPolicy = (policy: any) => {
    setSelectedPolicyToEdit(policy)
    setSelectedSchemaAndTable({ schema: policy.schema, table: policy.table })
  }

  const onSelectDeletePolicy = (policy: any) => {
    setSelectedPolicyToDelete(policy)
  }

  const onSavePolicySuccess = async () => {
    ui.setNotification({ category: 'success', message: 'Policy successfully saved!' })
    closePolicyEditorModal()
  }

  // Methods that involve some API
  const onToggleRLS = async () => {
    const payload = {
      id: selectedTableToToggleRLS.id,
      rls_enabled: !selectedTableToToggleRLS.rls_enabled,
    }

    const res: any = await meta.tables.update(payload.id, payload)
    if (res.error) {
      ui.setNotification({
        category: 'error',
        message: `Failed to toggle RLS: ${res.error.message}`,
      })
    }
    closeConfirmModal()
  }

  const onCreatePolicy = async (payload: any) => {
    const res = await meta.policies.create(payload)
    if (res.error) {
      ui.setNotification({
        category: 'error',
        message: `Error adding policy: ${res.error.message}`,
      })
      return true
    }
    return false
  }

  const onUpdatePolicy = async (payload: any) => {
    const res = await meta.policies.update(payload.id, payload)
    if (res.error) {
      ui.setNotification({
        category: 'error',
        message: `Error updating policy: ${res.error.message}`,
      })
      return true
    }
    return false
  }

  const onDeletePolicy = async () => {
    const res = await meta.policies.del(selectedPolicyToDelete.id)
    if (typeof res !== 'boolean' && res.error) {
      ui.setNotification({
        category: 'error',
        message: `Error deleting policy: ${res.error.message}`,
      })
    } else {
      ui.setNotification({ category: 'success', message: 'Successfully deleted policy!' })
    }
    closeConfirmModal()
  }

  return (
    <>
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
      ) : (
        <div className="flex-grow">
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
              <p className="text-sm text-scale-1100">
                Create a table in this schema first before creating a policy.
              </p>
            </div>
          </ProductEmptyState>
        </div>
      )}

      <PolicyEditorModal
        visible={!isEmpty(selectedSchemaAndTable)}
        roles={roles}
        schema={selectedSchemaAndTable.schema}
        table={selectedSchemaAndTable.table}
        selectedPolicyToEdit={selectedPolicyToEdit}
        onSelectCancel={closePolicyEditorModal}
        // @ts-ignore
        onCreatePolicy={onCreatePolicy}
        // @ts-ignore
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
        title={`Confirm to ${selectedTableToToggleRLS.rls_enabled ? 'disable' : 'enable'} RLS`}
        description={`Are you sure you want to ${
          selectedTableToToggleRLS.rls_enabled ? 'disable' : 'enable'
        } row level security for the table "${selectedTableToToggleRLS.name}"?`}
        buttonLabel="Confirm"
        buttonLoadingLabel="Saving"
        onSelectCancel={closeConfirmModal}
        onSelectConfirm={onToggleRLS}
      />
    </>
  )
}

export default observer(Policies)
