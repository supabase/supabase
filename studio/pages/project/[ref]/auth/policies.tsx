import React, { useState, PropsWithChildren, FC } from 'react'
import { isEmpty } from 'lodash'
import { Button, IconSearch, Input } from '@supabase/ui'
import { observer } from 'mobx-react-lite'
import { useStore } from 'hooks'
import { AuthLayout } from 'components/layouts'
import { NextPageWithLayout } from 'types'
import { PolicyEditorModal, PolicyTableRow } from 'components/interfaces/Authentication/Policies'
import { PostgresRole } from '@supabase/postgres-meta'

import ConfirmModal from 'components/ui/Dialogs/ConfirmDialog'
import NoTableState from 'components/ui/States/NoTableState'
import NoSearchResults from 'components/to-be-cleaned/NoSearchResults'

const AuthPoliciesLayout = ({ children }: PropsWithChildren<{}>) => {
  return <div className="p-4">{children}</div>
}

const onFilterTables = (
  tables: {
    name: string
    policies: {
      name: string
    }[]
  }[],
  keywords?: string
) => {
  if (!keywords) return tables.slice().sort((a: any, b: any) => a.name.localeCompare(b.name))
  else {
    let filter = keywords.toLowerCase()
    let stringSearch = (s: string) => s.toLowerCase().indexOf(filter) != -1
    return tables
      .slice()
      .filter((x: any) => {
        let searchTableName = stringSearch(x.name)
        let searchPolicyName = x.policies.some((p: any) => stringSearch(p.name))
        return searchTableName || searchPolicyName
      })
      .sort((a: any, b: any) => a.name.localeCompare(b.name))
  }
}

const AuthPoliciesPage: NextPageWithLayout = () => {
  const { meta } = useStore()
  const [policiesFilter, setPoliciesFilter] = useState<string | undefined>(undefined)
  const publicTables = meta.tables.list((table: { schema: string }) => table.schema === 'public')
  const filteredTables = onFilterTables(publicTables, policiesFilter)

  return (
    <>
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <div>
            <Input
              size="small"
              placeholder="Filter tables"
              className="block w-full text-sm placeholder-gray-400"
              value={policiesFilter}
              onChange={(e) => setPoliciesFilter(e.target.value)}
              icon={<IconSearch size="tiny" />}
            />
          </div>
          <Button type="link">
            <a
              target="_blank"
              href="https://supabase.com/docs/learn/auth-deep-dive/auth-row-level-security"
            >
              What is RLS?
            </a>
          </Button>
        </div>
      </div>
      <div>
        <AuthPoliciesTables hasPublicTables={publicTables.length > 0} tables={filteredTables} />
      </div>
    </>
  )
}

AuthPoliciesPage.getLayout = (page) => (
  <AuthLayout title="Auth">
    <AuthPoliciesLayout>{page}</AuthPoliciesLayout>
  </AuthLayout>
)

export default observer(AuthPoliciesPage)

interface AuthPoliciesTablesProps {
  hasPublicTables: boolean
  tables: any[]
}
const AuthPoliciesTables: FC<AuthPoliciesTablesProps> = observer(({ tables, hasPublicTables }) => {
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
    <div>
      {tables.length > 0 ? (
        tables.map((table: any) => (
          <section key={table.id}>
            <PolicyTableRow
              table={table}
              // @ts-ignore
              onSelectToggleRLS={onSelectToggleRLS}
              // @ts-ignore
              onSelectCreatePolicy={onSelectCreatePolicy}
              // @ts-ignore
              onSelectEditPolicy={onSelectEditPolicy}
              // @ts-ignore
              onSelectDeletePolicy={onSelectDeletePolicy}
            />
          </section>
        ))
      ) : hasPublicTables ? (
        <NoSearchResults />
      ) : (
        <NoTableState message="A public schema table is required before you can create a row-level security policy" />
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
    </div>
  )
})
