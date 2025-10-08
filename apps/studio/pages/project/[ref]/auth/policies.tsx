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
import { EditorPanel } from 'components/ui/EditorPanel/EditorPanel'
import NoPermission from 'components/ui/NoPermission'
import SchemaSelector from 'components/ui/SchemaSelector'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
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

  // Local editor panel state
  const [editorPanelOpen, setEditorPanelOpen] = useState(false)

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
                setEditorPanelOpen(true)
              } else {
                setShowPolicyAiEditor(true)
              }
            }}
            onSelectEditPolicy={(policy) => {
              setSelectedPolicyToEdit(policy)
              setSelectedTable(undefined)
              if (isInlineEditorEnabled) {
                setEditorPanelOpen(true)
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

        <EditorPanel
          open={editorPanelOpen}
          onClose={() => {
            setEditorPanelOpen(false)
            setSelectedPolicyToEdit(undefined)
            setSelectedTable(undefined)
          }}
          onRunSuccess={() => {
            setEditorPanelOpen(false)
            setSelectedPolicyToEdit(undefined)
            setSelectedTable(undefined)
          }}
          initialValue={
            selectedPolicyToEdit
              ? generatePolicyUpdateSQL(selectedPolicyToEdit)
              : selectedTable
                ? `create policy "replace_with_policy_name"\n  on ${schema}.${selectedTable}\n  for select\n  to authenticated\n  using (\n    true  -- Write your policy condition here\n);`
                : ''
          }
          label={
            selectedPolicyToEdit
              ? 'RLS policies are just SQL statements that you can alter'
              : selectedTable
                ? `Create new RLS policy on "${selectedTable}"`
                : ''
          }
          initialPrompt={
            selectedPolicyToEdit
              ? `Update the policy with name "${selectedPolicyToEdit.name}" in the ${selectedPolicyToEdit.schema} schema on the ${selectedPolicyToEdit.table} table. It should...`
              : selectedTable
                ? `Create and name a entirely new RLS policy for the "${selectedTable}" table in the ${schema} schema. The policy should...`
                : ''
          }
          templates={
            selectedPolicyToEdit
              ? getGeneralPolicyTemplates(
                  selectedPolicyToEdit.schema,
                  selectedPolicyToEdit.table
                ).map((template) => ({
                  name: template.templateName,
                  description: template.description,
                  content: template.statement,
                }))
              : []
          }
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
