import { isEmpty } from 'lodash'
import React, { createContext, useContext, useState, useEffect } from 'react'
import { Button, IconSearch, Input } from '@supabase/ui'
import { observer, useLocalObservable } from 'mobx-react-lite'

import { withAuth, useStore } from 'hooks'
import { AuthLayout } from 'components/layouts'
import ConfirmModal from 'components/ui/Dialogs/ConfirmDialog'
import NoTableState from 'components/ui/States/NoTableState'
import { PolicyEditorModal, PolicyTableRow } from 'components/interfaces/Authentication/Policies'

import NoSearchResults from 'components/to-be-cleaned/NoSearchResults'

const PageContext = createContext(null)

const AuthPoliciesPage = ({}) => {
  const PageState: any = useLocalObservable(() => ({
    meta: null,
    project: null,
    policiesFilter: '',
    selectedTableId: null,
    tables: [],
    tablesLoading: true,
    get filteredTables() {
      if (!PageState.policiesFilter)
        return PageState.tables.slice().sort((a: any, b: any) => a.name.localeCompare(b.name))
      else {
        let filter = PageState.policiesFilter.toLowerCase()
        let stringSearch = (s: string) => s.toLowerCase().indexOf(filter) != -1
        return PageState.tables
          .slice()
          .filter((x: any) => {
            let searchTableName = stringSearch(x.name)
            let searchPolicyName = x.policies.some((p: any) => stringSearch(p.name))
            return searchTableName || searchPolicyName
          })
          .sort((a: any, b: any) => a.name.localeCompare(b.name))
      }
    },
    get selectedTable() {
      if (!PageState.selectedTableId) return null
      for (let i = 0; i < PageState.tables.length; i++) {
        const element: any = PageState.tables[i]
        if (element.id == PageState.selectedTableId) return element
      }
    },
    onTableUpdated(table: any) {
      for (let i = 0; i < PageState.tables.length; i++) {
        let el: any = PageState.tables[i]
        if (el.id == table.id) {
          PageState.tables[i] = { ...el, ...table }
        }
      }
    },
  }))

  const { meta, ui } = useStore()
  PageState.meta = meta as any
  PageState.project = ui.selectedProject as any

  return (
    <PageContext.Provider value={PageState}>
      <AuthLayout title="Auth">
        <div className="p-4">
          <AuthPolicies />
        </div>
      </AuthLayout>
    </PageContext.Provider>
  )
}
export default withAuth(observer(AuthPoliciesPage))

const AuthPolicies = observer(() => {
  const PageState: any = useContext(PageContext)

  const { meta } = useStore()
  const tables = meta.tables.list((table: any) => table.schema === 'public')

  useEffect(() => {
    PageState.tablesLoading = false
    PageState.tables = tables.sort((a: any, b: any) => a.name.localeCompare(b.name))
  }, [])

  return (
    <>
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <div>
            <Input
              size="small"
              placeholder="Filter tables"
              className="block w-full text-sm placeholder-gray-400"
              value={PageState.policiesFilter}
              onChange={(e) => (PageState.policiesFilter = e.target.value)}
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
        <AuthPoliciesTables />
      </div>
    </>
  )
})

const AuthPoliciesTables = observer(() => {
  const { ui, meta } = useStore()
  const PageState: any = useContext(PageContext)

  const roles = meta.roles.list()

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
    await refreshTables()
    closePolicyEditorModal()
  }

  // Methods that involve some API

  const refreshTables = async () => {
    await meta.tables.load()
    const res: any = meta.tables.list((table: any) => table.schema === 'public')
    if (!res.error) PageState.tables.replace(res)
  }

  const onToggleRLS = async () => {
    const payload = {
      id: selectedTableToToggleRLS.id,
      rls_enabled: !selectedTableToToggleRLS.rls_enabled,
    }

    const res: any = await meta.tables.update(payload.id, payload)
    // const url = `${API_URL}/database/${router.query.ref}/tables?id=${payload.id}`
    // const res = await patch(url, payload)
    if (res.error) {
      ui.setNotification({
        category: 'error',
        message: `Failed to toggle RLS: ${res.error.message}`,
      })
    } else {
      PageState.onTableUpdated(res)
    }
    closeConfirmModal()
  }

  const onCreatePolicy = async (payload: any) => {
    const res = await PageState.meta.policies.create(payload)
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
    const res = await PageState.meta.policies.update(payload.id, payload)
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
    const res = await PageState.meta.policies.del(selectedPolicyToDelete.id)
    if (res.error) {
      ui.setNotification({
        category: 'error',
        message: `Error deleting policy: ${res.error.message}`,
      })
    } else {
      ui.setNotification({ category: 'success', message: 'Successfully deleted policy!' })
    }
    await refreshTables()
    closeConfirmModal()
  }

  return (
    <div>
      {PageState.filteredTables.length > 0 ? (
        PageState.filteredTables.map((table: any) => (
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
      ) : PageState.tables.length > 0 ? (
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
