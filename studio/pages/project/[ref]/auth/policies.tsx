import React, { useState, PropsWithChildren, FC } from 'react'
import { isEmpty } from 'lodash'
import { Button, IconSearch, Input } from '@supabase/ui'
import { observer } from 'mobx-react-lite'
import { checkPermissions, useStore } from 'hooks'
import { AuthLayout } from 'components/layouts'
import { NextPageWithLayout } from 'types'
import { PolicyEditorModal, PolicyTableRow } from 'components/interfaces/Auth/Policies'
import { PostgresRole } from '@supabase/postgres-meta'
import { PostgresTable, PostgresPolicy } from '@supabase/postgres-meta'

import ConfirmModal from 'components/ui/Dialogs/ConfirmDialog'
import NoTableState from 'components/ui/States/NoTableState'
import NoSearchResults from 'components/to-be-cleaned/NoSearchResults'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import NoPermission from 'components/ui/NoPermission'

/**
 * Filter tables by table name and policy name
 *
 * @param tables list of table
 * @param policies list of policy
 * @param searchString filter keywords
 *
 * @returns list of table
 */
const onFilterTables = (
  tables: PostgresTable[],
  policies: PostgresPolicy[],
  searchString?: string
) => {
  if (!searchString) {
    return tables.slice().sort((a: PostgresTable, b: PostgresTable) => a.name.localeCompare(b.name))
  } else {
    const filter = searchString.toLowerCase()
    const findSearchString = (s: string) => s.toLowerCase().includes(filter)
    // @ts-ignore Type instantiation is excessively deep and possibly infinite
    const filteredPolicies = policies.filter((p: PostgresPolicy) => findSearchString(p.name))
    return tables
      .slice()
      .filter((x: PostgresTable) => {
        const searchTableName = findSearchString(x.name)
        if (searchTableName) return true
        const searchPolicyName = filteredPolicies.some((p: PostgresPolicy) => p.table === x.name)
        return searchPolicyName
      })
      .sort((a: PostgresTable, b: PostgresTable) => a.name.localeCompare(b.name))
  }
}

const AuthPoliciesPage: NextPageWithLayout = () => {
  const { meta } = useStore()
  const [policiesFilter, setPoliciesFilter] = useState<string | undefined>(undefined)
  const publicTables = meta.tables.list((table: { schema: string }) => table.schema === 'public')
  const policies = meta.policies.list()
  const filteredTables = onFilterTables(publicTables, policies, policiesFilter)

  const canReadPolicies = checkPermissions(PermissionAction.TENANT_SQL_ADMIN_READ, 'policies')

  if (!canReadPolicies) {
    return <NoPermission isFullPage resourceText="view this project's RLS policies" />
  }

  return (
    <>
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <Input
            size="small"
            placeholder="Filter tables and policies"
            className="block w-64 text-sm placeholder-gray-400"
            value={policiesFilter}
            onChange={(e) => setPoliciesFilter(e.target.value)}
            icon={<IconSearch size="tiny" />}
          />
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
    <div className="p-4 h-full">{page}</div>
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
              onSelectToggleRLS={onSelectToggleRLS}
              onSelectCreatePolicy={onSelectCreatePolicy}
              onSelectEditPolicy={onSelectEditPolicy}
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
