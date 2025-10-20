import type { PostgresPolicy, PostgresTable } from '@supabase/postgres-meta'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { Search } from 'lucide-react'
import { useState } from 'react'

import { useIsInlineEditorEnabled } from 'components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { Policies } from 'components/interfaces/Auth/Policies/Policies'
import { getGeneralPolicyTemplates } from 'components/interfaces/Auth/Policies/PolicyEditorModal/PolicyEditorModal.constants'
import { PolicyEditorPanel } from 'components/interfaces/Auth/Policies/PolicyEditorPanel'
import { generatePolicyUpdateSQL } from 'components/interfaces/Auth/Policies/PolicyTableRow/PolicyTableRow.utils'
import AuthLayout from 'components/layouts/AuthLayout/AuthLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { PageLayout } from 'components/layouts/PageLayout/PageLayout'
import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'
import AlertError from 'components/ui/AlertError'
import { DocsButton } from 'components/ui/DocsButton'
import NoPermission from 'components/ui/NoPermission'
import SchemaSelector from 'components/ui/SchemaSelector'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { editorPanelState } from 'state/editor-panel-state'
import { SIDEBAR_KEYS, sidebarManagerState } from 'state/sidebar-manager-state'
import { useDatabasePoliciesQuery } from 'data/database-policies/database-policies-query'
import { useTablesQuery } from 'data/tables/tables-query'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { useUrlState } from 'hooks/ui/useUrlState'
import { useIsProtectedSchema } from 'hooks/useProtectedSchemas'
import { DOCS_URL } from 'lib/constants'
import type { NextPageWithLayout } from 'types'
import { Input } from 'ui-patterns/DataInputs/Input'

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
  const { data: project } = useSelectedProjectQuery()
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
  const { can: canReadPolicies, isSuccess: isPermissionsLoaded } = useAsyncCheckPermissions(
    PermissionAction.TENANT_SQL_ADMIN_READ,
    'policies'
  )

  if (isPermissionsLoaded && !canReadPolicies) {
    return <NoPermission isFullPage resourceText="view this project's RLS policies" />
  }

  return (
    <ScaffoldContainer size="large">
      <ScaffoldSection isFullWidth>
        <div className="mb-4 flex flex-row gap-2 justify-between">
          <Input
            size="tiny"
            placeholder="Filter tables and policies"
            className="block w-full lg:w-52"
            containerClassName="[&>div>svg]:-mt-0.5"
            value={searchString || ''}
            onChange={(e) => {
              const str = e.target.value
              setParams({ ...params, search: str === '' ? undefined : str })
            }}
            icon={<Search size={14} />}
          />
          <SchemaSelector
            className="w-full lg:w-[180px]"
            size="tiny"
            align="end"
            showError={false}
            selectedSchemaName={schema}
            onSelectSchema={(schema) => {
              setParams({ ...params, search: undefined, schema })
            }}
          />
        </div>

        {isLoading && <GenericSkeletonLoader />}

        {isError && <AlertError error={error} subject="Failed to retrieve tables" />}

        {isSuccess && (
          <Policies
            search={searchString}
            schema={schema}
            tables={filteredTables}
            hasTables={tables.length > 0}
            isLocked={isSchemaLocked}
            onSelectCreatePolicy={(table: string) => {
              setSelectedTable(table)
              setSelectedPolicyToEdit(undefined)
              if (isInlineEditorEnabled) {
                editorPanelState.configure({
                  sql: `create policy "replace_with_policy_name"\n  on ${schema}.${table}\n  for select\n  to authenticated\n  using (\n    true  -- Write your policy condition here\n);`,
                  label: `Create new RLS policy on "${table}"`,
                  prompt: `Create and name a entirely new RLS policy for the "${table}" table in the ${schema} schema. The policy should...`,
                })
                editorPanelState.setHandlers({
                  onRunSuccess: () => {
                    setSelectedPolicyToEdit(undefined)
                    setSelectedTable(undefined)
                  },
                })
                sidebarManagerState.openSidebar(SIDEBAR_KEYS.EDITOR_PANEL)
              } else {
                setShowPolicyAiEditor(true)
              }
            }}
            onSelectEditPolicy={(policy) => {
              setSelectedPolicyToEdit(policy)
              setSelectedTable(undefined)
              if (isInlineEditorEnabled) {
                editorPanelState.configure({
                  sql: generatePolicyUpdateSQL(policy),
                  label: 'RLS policies are just SQL statements that you can alter',
                  prompt: `Update the policy with name "${policy.name}" in the ${policy.schema} schema on the ${policy.table} table. It should...`,
                  templates: getGeneralPolicyTemplates(policy.schema, policy.table).map(
                    (template) => ({
                      name: template.templateName,
                      description: template.description,
                      content: template.statement,
                    })
                  ),
                })
                editorPanelState.setHandlers({
                  onRunSuccess: () => {
                    setSelectedPolicyToEdit(undefined)
                    setSelectedTable(undefined)
                  },
                })
                sidebarManagerState.openSidebar(SIDEBAR_KEYS.EDITOR_PANEL)
              } else {
                setShowPolicyAiEditor(true)
              }
            }}
            onResetSearch={() => setParams({ ...params, search: undefined })}
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
      </ScaffoldSection>
    </ScaffoldContainer>
  )
}

AuthPoliciesPage.getLayout = (page) => (
  <DefaultLayout>
    <AuthLayout>
      <PageLayout
        title="Policies"
        subtitle="Manage Row Level Security policies for your tables"
        secondaryActions={
          <DocsButton href={`${DOCS_URL}/learn/auth-deep-dive/auth-row-level-security`} />
        }
        size="large"
      >
        {page}
      </PageLayout>
    </AuthLayout>
  </DefaultLayout>
)

export default AuthPoliciesPage
