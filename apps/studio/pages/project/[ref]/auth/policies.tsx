import type { PostgresPolicy, PostgresTable } from '@supabase/postgres-meta'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { Search } from 'lucide-react'
import { useCallback, useDeferredValue, useMemo, useState } from 'react'

import { useIsInlineEditorEnabled } from 'components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { Policies } from 'components/interfaces/Auth/Policies/Policies'
import { PoliciesDataProvider } from 'components/interfaces/Auth/Policies/PoliciesDataContext'
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
import { useProjectPostgrestConfigQuery } from 'data/config/project-postgrest-config-query'
import { useTablesQuery } from 'data/tables/tables-query'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { useIsProtectedSchema } from 'hooks/useProtectedSchemas'
import { DOCS_URL } from 'lib/constants'
import { parseAsString, useQueryState } from 'nuqs'
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
const getTableFilterState = (
  tables: PostgresTable[],
  policies: PostgresPolicy[],
  searchString?: string
) => {
  const sortedTables = tables.slice().sort((a, b) => a.name.localeCompare(b.name))
  const visibleTableIds = new Set<number>()

  if (!searchString) {
    sortedTables.forEach((table) => visibleTableIds.add(table.id))
    return { tables: sortedTables, visibleTableIds }
  }

  const filter = searchString.toLowerCase()
  const matchingPolicyKeys = new Set(
    policies
      // @ts-ignore Type instantiation is excessively deep and possibly infinite
      .filter((policy: PostgresPolicy) => policy.name.toLowerCase().includes(filter))
      .map((policy) => `${policy.schema}.${policy.table}`)
  )

  sortedTables.forEach((table) => {
    const matches =
      table.name.toLowerCase().includes(filter) ||
      table.id.toString() === filter ||
      matchingPolicyKeys.has(`${table.schema}.${table.name}`)

    if (matches) {
      visibleTableIds.add(table.id)
    }
  })

  return { tables: sortedTables, visibleTableIds }
}

const AuthPoliciesPage: NextPageWithLayout = () => {
  const [schema, setSchema] = useQueryState(
    'schema',
    parseAsString.withDefault('public').withOptions({ history: 'replace' })
  )
  const [searchString, setSearchString] = useQueryState(
    'search',
    parseAsString.withDefault('').withOptions({ history: 'replace', clearOnDefault: true })
  )
  const deferredSearchString = useDeferredValue(searchString)
  const { data: project } = useSelectedProjectQuery()
  const { data: postgrestConfig } = useProjectPostgrestConfigQuery({ projectRef: project?.ref })
  const isInlineEditorEnabled = useIsInlineEditorEnabled()

  const [selectedTable, setSelectedTable] = useState<string>()
  const [showPolicyAiEditor, setShowPolicyAiEditor] = useState(false)
  const [selectedPolicyToEdit, setSelectedPolicyToEdit] = useState<PostgresPolicy>()

  // Local editor panel state
  const [editorPanelOpen, setEditorPanelOpen] = useState(false)

  const { isSchemaLocked } = useIsProtectedSchema({ schema: schema, excludedSchemas: ['realtime'] })

  const {
    data: policies,
    isLoading: isLoadingPolicies,
    isError: isPoliciesError,
    error: policiesError,
  } = useDatabasePoliciesQuery({
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

  const { tables: tablesWithVisibility, visibleTableIds } = useMemo(
    () => getTableFilterState(tables ?? [], policies ?? [], searchString),
    [tables, policies, searchString]
  )
  const exposedSchemas = useMemo(() => {
    if (!postgrestConfig?.db_schema) return []
    return postgrestConfig.db_schema
      .split(',')
      .map((schema) => schema.trim())
      .filter((schema) => schema.length > 0)
  }, [postgrestConfig?.db_schema])
  const { can: canReadPolicies, isSuccess: isPermissionsLoaded } = useAsyncCheckPermissions(
    PermissionAction.TENANT_SQL_ADMIN_READ,
    'policies'
  )

  const handleSelectCreatePolicy = useCallback(
    (table: string) => {
      setSelectedTable(table)
      setSelectedPolicyToEdit(undefined)
      if (isInlineEditorEnabled) {
        setEditorPanelOpen(true)
      } else {
        setShowPolicyAiEditor(true)
      }
    },
    [isInlineEditorEnabled]
  )

  const handleSelectEditPolicy = useCallback(
    (policy: PostgresPolicy) => {
      setSelectedPolicyToEdit(policy)
      setSelectedTable(undefined)
      if (isInlineEditorEnabled) {
        setEditorPanelOpen(true)
      } else {
        setShowPolicyAiEditor(true)
      }
    },
    [isInlineEditorEnabled]
  )

  const handleResetSearch = useCallback(() => setSearchString(''), [setSearchString])

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
              setSearchString(str)
            }}
            icon={<Search size={14} />}
          />
          <SchemaSelector
            className="w-full lg:w-[180px]"
            size="tiny"
            align="end"
            showError={false}
            selectedSchemaName={schema}
            onSelectSchema={(schemaName) => {
              setSchema(schemaName)
              setSearchString('')
            }}
          />
        </div>

        {isLoading && <GenericSkeletonLoader />}

        {isError && <AlertError error={error} subject="Failed to retrieve tables" />}

        {isSuccess && (
          <PoliciesDataProvider
            policies={policies ?? []}
            isPoliciesLoading={isLoadingPolicies}
            isPoliciesError={isPoliciesError}
            policiesError={policiesError ?? undefined}
            exposedSchemas={exposedSchemas}
          >
            <Policies
              search={deferredSearchString}
              schema={schema}
              tables={tablesWithVisibility}
              hasTables={(tables ?? []).length > 0}
              isLocked={isSchemaLocked}
              visibleTableIds={visibleTableIds}
              onSelectCreatePolicy={handleSelectCreatePolicy}
              onSelectEditPolicy={handleSelectEditPolicy}
              onResetSearch={handleResetSearch}
            />
          </PoliciesDataProvider>
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
