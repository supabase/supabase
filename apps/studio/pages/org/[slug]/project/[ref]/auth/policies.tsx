import type { PostgresPolicy, PostgresTable } from '@supabase/postgres-meta'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { Search } from 'lucide-react'
import { useState } from 'react'

import { useIsInlineEditorEnabled } from 'components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import Policies from 'components/interfaces/Auth/Policies/Policies'
import { getGeneralPolicyTemplates } from 'components/interfaces/Auth/Policies/PolicyEditorModal/PolicyEditorModal.constants'
import { PolicyEditorPanel } from 'components/interfaces/Auth/Policies/PolicyEditorPanel'
import { generatePolicyUpdateSQL } from 'components/interfaces/Auth/Policies/PolicyTableRow/PolicyTableRow.utils'
import AuthLayout from 'components/layouts/AuthLayout/AuthLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import AlertError from 'components/ui/AlertError'
import { DocsButton } from 'components/ui/DocsButton'
import NoPermission from 'components/ui/NoPermission'
import SchemaSelector from 'components/ui/SchemaSelector'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useDatabasePoliciesQuery } from 'data/database-policies/database-policies-query'
import { useTablesQuery } from 'data/tables/tables-query'
import { useCheckPermissions, usePermissionsLoaded } from 'hooks/misc/useCheckPermissions'
import { useUrlState } from 'hooks/ui/useUrlState'
import { useIsProtectedSchema } from 'hooks/useProtectedSchemas'
import { useAppStateSnapshot } from 'state/app-state'
import type { NextPageWithLayout } from 'types'
import { Input } from 'ui'

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
        return (
          x.name.toLowerCase().includes(filter) ||
          x.id.toString() === filter ||
          filteredPolicies.some((p: PostgresPolicy) => p.table === x.name)
        )
      })
      .sort((a: PostgresTable, b: PostgresTable) => a.name.localeCompare(b.name))
  }
}

const AuthPoliciesPage: NextPageWithLayout = () => {
  const [params, setParams] = useUrlState<{
    schema?: string
    search?: string
  }>()
  const { schema = 'public', search: searchString = '' } = params
  const { project } = useProjectContext()
  const { setEditorPanel } = useAppStateSnapshot()
  const isInlineEditorEnabled = useIsInlineEditorEnabled()

  const [selectedTable, setSelectedTable] = useState<string>()
  const [showPolicyAiEditor, setShowPolicyAiEditor] = useState(false)
  const [selectedPolicyToEdit, setSelectedPolicyToEdit] = useState<PostgresPolicy>()

  const { isSchemaLocked } = useIsProtectedSchema({ schema: schema, excludedSchemas: ['realtime'] })

  const { data: policies } = useDatabasePoliciesQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const {
    data: tables,
    isLoading,
    isSuccess,
    isError,
    error,
  } = useTablesQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
    schema: schema,
  })

  const filteredTables = onFilterTables(tables ?? [], policies ?? [], searchString)
  const canReadPolicies = useCheckPermissions(PermissionAction.TENANT_SQL_ADMIN_READ, 'policies')
  const isPermissionsLoaded = usePermissionsLoaded()

  if (isPermissionsLoaded && !canReadPolicies) {
    return <NoPermission isFullPage resourceText="view this project's RLS policies" />
  }

  return (
    <div className="flex flex-col h-full">
      <div className="mb-4">
        <div className="w-full flex flex-col lg:flex-row items-center justify-between gap-2">
          <SchemaSelector
            className="w-full lg:w-[180px]"
            size="tiny"
            showError={false}
            selectedSchemaName={schema}
            onSelectSchema={(schema) => {
              setParams({ ...params, search: undefined, schema })
            }}
          />
          <div className="w-full flex-grow flex items-center justify-between gap-2 lg:gap-4">
            <Input
              size="tiny"
              placeholder="Filter tables and policies"
              className="block w-full lg:w-52"
              value={searchString || ''}
              onChange={(e) => {
                const str = e.target.value
                setParams({ ...params, search: str === '' ? undefined : str })
              }}
              icon={<Search size={14} />}
            />
            <DocsButton href="https://supabase.com/docs/learn/auth-deep-dive/auth-row-level-security" />
          </div>
        </div>
      </div>

      {isLoading && <GenericSkeletonLoader />}

      {isError && <AlertError error={error} subject="Failed to retrieve tables" />}

      {isSuccess && (
        <Policies
          schema={schema}
          tables={filteredTables}
          hasTables={tables.length > 0}
          isLocked={isSchemaLocked}
          onSelectCreatePolicy={(table: string) => {
            if (isInlineEditorEnabled) {
              setEditorPanel({
                open: true,
                initialValue: `create policy "replace_with_policy_name"
  on ${schema}.${table}
  for select
  to authenticated
  using (
    true  -- Write your policy condition here
);`,
                label: `Create new RLS policy on "${table}"`,
                saveLabel: 'Create policy',
                initialPrompt: `Create and name a entirely new RLS policy for the "${table}" table in the ${schema} schema. The policy should...`,
              })
            } else {
              setSelectedTable(table)
              setShowPolicyAiEditor(true)
            }
          }}
          onSelectEditPolicy={(policy) => {
            if (isInlineEditorEnabled) {
              const sql = generatePolicyUpdateSQL(policy)
              const templates = getGeneralPolicyTemplates(policy.schema, policy.table)
              setEditorPanel({
                open: true,
                initialValue: sql,
                label: `Edit policy "${policy.name}"`,
                saveLabel: 'Update policy',
                templates: templates.map((template) => ({
                  name: template.templateName,
                  description: template.description,
                  content: template.statement,
                })),
                initialPrompt: `Update the policy with name "${policy.name}" in the ${policy.schema} schema on the ${policy.table} table. It should...`,
              })
            } else {
              setSelectedPolicyToEdit(policy)
              setShowPolicyAiEditor(true)
            }
          }}
        />
      )}

      <PolicyEditorPanel
        visible={showPolicyAiEditor}
        schema={schema}
        searchString={searchString}
        selectedTable={selectedTable}
        selectedPolicy={selectedPolicyToEdit}
        onSelectCancel={() => {
          setSelectedTable(undefined)
          setShowPolicyAiEditor(false)
          setSelectedPolicyToEdit(undefined)
        }}
        authContext="database"
      />
    </div>
  )
}

AuthPoliciesPage.getLayout = (page) => (
  <DefaultLayout>
    <AuthLayout>
      <div className="h-full p-4">{page}</div>
    </AuthLayout>
  </DefaultLayout>
)

export default AuthPoliciesPage
