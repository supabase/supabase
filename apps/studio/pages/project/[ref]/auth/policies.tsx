import type { PostgresPolicy, PostgresTable } from '@supabase/postgres-meta'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { Search, X } from 'lucide-react'
import { parseAsBoolean, parseAsString, useQueryState } from 'nuqs'
import { useCallback, useDeferredValue, useMemo, useState } from 'react'
import { toast } from 'sonner'

import { useIsInlineEditorEnabled } from 'components/interfaces/Account/Preferences/InlineEditorSettings'
import { Policies } from 'components/interfaces/Auth/Policies/Policies'
import { PoliciesDataProvider } from 'components/interfaces/Auth/Policies/PoliciesDataContext'
import { getGeneralPolicyTemplates } from 'components/interfaces/Auth/Policies/PolicyEditorModal/PolicyEditorModal.constants'
import { PolicyEditorPanel } from 'components/interfaces/Auth/Policies/PolicyEditorPanel'
import { generatePolicyUpdateSQL } from 'components/interfaces/Auth/Policies/PolicyTableRow/PolicyTableRow.utils'
import AuthLayout from 'components/layouts/AuthLayout/AuthLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { SIDEBAR_KEYS } from 'components/layouts/ProjectLayout/LayoutSidebar/LayoutSidebarProvider'
import AlertError from 'components/ui/AlertError'
import { DocsButton } from 'components/ui/DocsButton'
import NoPermission from 'components/ui/NoPermission'
import SchemaSelector from 'components/ui/SchemaSelector'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useProjectPostgrestConfigQuery } from 'data/config/project-postgrest-config-query'
import { useDatabasePoliciesQuery } from 'data/database-policies/database-policies-query'
import { useTablesQuery } from 'data/tables/tables-query'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useQueryStateWithSelect } from 'hooks/misc/useQueryStateWithSelect'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { useIsProtectedSchema } from 'hooks/useProtectedSchemas'
import { DOCS_URL } from 'lib/constants'
import { useEditorPanelStateSnapshot } from 'state/editor-panel-state'
import { useSidebarManagerSnapshot } from 'state/sidebar-manager-state'
import type { NextPageWithLayout } from 'types'
import { Button } from 'ui'
import { Input } from 'ui-patterns/DataInputs/Input'
import { PageContainer } from 'ui-patterns/PageContainer'
import {
  PageHeader,
  PageHeaderAside,
  PageHeaderDescription,
  PageHeaderMeta,
  PageHeaderSummary,
  PageHeaderTitle,
} from 'ui-patterns/PageHeader'
import { PageSection, PageSectionContent } from 'ui-patterns/PageSection'

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
  const { openSidebar } = useSidebarManagerSnapshot()
  const {
    setValue: setEditorPanelValue,
    setTemplates: setEditorPanelTemplates,
    setInitialPrompt: setEditorPanelInitialPrompt,
  } = useEditorPanelStateSnapshot()

  const [selectedTable, setSelectedTable] = useState<string>()
  const [showCreatePolicy, setShowCreatePolicy] = useQueryState(
    'new',
    parseAsBoolean.withDefault(false).withOptions({ history: 'push', clearOnDefault: true })
  )

  const { isSchemaLocked } = useIsProtectedSchema({ schema: schema, excludedSchemas: ['realtime'] })

  const {
    data: policies,
    isPending: isLoadingPolicies,
    isError: isPoliciesError,
    error: policiesError,
  } = useDatabasePoliciesQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const { setValue: setSelectedPolicyIdToEdit, value: selectedPolicyIdToEdit } =
    useQueryStateWithSelect({
      urlKey: 'edit',
      select: (id: string) =>
        id ? policies?.find((policy) => policy.id.toString() === id) : undefined,
      enabled: !!policies,
      onError: () => toast.error(`Policy not found`),
    })

  const {
    data: tables,
    isPending: isLoading,
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
      setSelectedPolicyIdToEdit(null)
      setShowCreatePolicy(true)

      if (isInlineEditorEnabled) {
        const defaultSql = `create policy "replace_with_policy_name"
  on ${schema}.${table}
  for select
  to authenticated
  using (
    true  -- Write your policy condition here
);`

        setEditorPanelInitialPrompt('Create a new RLS policy that...')
        setEditorPanelValue(defaultSql)
        setEditorPanelTemplates([])
        openSidebar(SIDEBAR_KEYS.EDITOR_PANEL)
      } else {
        setShowCreatePolicy(true)
      }
    },
    [isInlineEditorEnabled, openSidebar, schema]
  )

  const handleSelectEditPolicy = useCallback(
    (policy: PostgresPolicy) => {
      setSelectedTable(undefined)

      if (isInlineEditorEnabled) {
        setEditorPanelInitialPrompt(`Update the RLS policy with name "${policy.name}" that...`)
        setEditorPanelValue(generatePolicyUpdateSQL(policy))
        const templates = getGeneralPolicyTemplates(policy.schema, policy.table).map(
          (template) => ({
            name: template.templateName,
            description: template.description,
            content: template.statement,
          })
        )
        setEditorPanelTemplates(templates)
        openSidebar(SIDEBAR_KEYS.EDITOR_PANEL)
      } else {
        setSelectedPolicyIdToEdit(policy.id.toString())
      }
    },
    [isInlineEditorEnabled, openSidebar]
  )

  const handleResetSearch = useCallback(() => setSearchString(''), [setSearchString])

  const isUpdatingPolicy = !!selectedPolicyIdToEdit

  if (isPermissionsLoaded && !canReadPolicies) {
    return <NoPermission isFullPage resourceText="view this project's RLS policies" />
  }

  return (
    <>
      <PageHeader size="large">
        <PageHeaderMeta>
          <PageHeaderSummary>
            <PageHeaderTitle>Policies</PageHeaderTitle>
            <PageHeaderDescription>
              Manage Row Level Security policies for your tables
            </PageHeaderDescription>
          </PageHeaderSummary>
          <PageHeaderAside>
            <DocsButton href={`${DOCS_URL}/learn/auth-deep-dive/auth-row-level-security`} />
          </PageHeaderAside>
        </PageHeaderMeta>
      </PageHeader>
      <PageContainer size="large">
        <PageSection>
          <PageSectionContent>
            <div className="mb-4 flex flex-row gap-x-2">
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
                actions={
                  searchString ? (
                    <Button
                      size="tiny"
                      type="text"
                      className="p-0 h-5 w-5"
                      icon={<X />}
                      onClick={() => setSearchString('')}
                    />
                  ) : null
                }
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
              visible={showCreatePolicy || isUpdatingPolicy}
              schema={schema}
              searchString={searchString}
              selectedTable={isUpdatingPolicy ? undefined : selectedTable}
              selectedPolicy={isUpdatingPolicy ? selectedPolicyIdToEdit : undefined}
              onSelectCancel={() => {
                setSelectedTable(undefined)
                if (isUpdatingPolicy) {
                  setSelectedPolicyIdToEdit(null)
                } else {
                  setShowCreatePolicy(false)
                }
              }}
              authContext="database"
            />
          </PageSectionContent>
        </PageSection>
      </PageContainer>
    </>
  )
}

AuthPoliciesPage.getLayout = (page) => (
  <DefaultLayout>
    <AuthLayout>{page}</AuthLayout>
  </DefaultLayout>
)

export default AuthPoliciesPage
