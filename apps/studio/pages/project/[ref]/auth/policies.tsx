import type { PostgresPolicy, PostgresTable } from '@supabase/postgres-meta'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { partition } from 'lodash'
import { ExternalLink, Search } from 'lucide-react'
import { useState } from 'react'

import { useIsRLSAIAssistantEnabled } from 'components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { AIPolicyEditorPanel } from 'components/interfaces/Auth/Policies/AIPolicyEditorPanel'
import Policies from 'components/interfaces/Auth/Policies/Policies'
import AuthLayout from 'components/layouts/AuthLayout/AuthLayout'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import AlertError from 'components/ui/AlertError'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import NoPermission from 'components/ui/NoPermission'
import SchemaSelector from 'components/ui/SchemaSelector'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useDatabasePoliciesQuery } from 'data/database-policies/database-policies-query'
import { useSchemasQuery } from 'data/database/schemas-query'
import { useTablesQuery } from 'data/tables/tables-query'
import { useCheckPermissions, usePermissionsLoaded } from 'hooks/misc/useCheckPermissions'
import { useUrlState } from 'hooks/ui/useUrlState'
import { EXCLUDED_SCHEMAS } from 'lib/constants/schemas'
import type { NextPageWithLayout } from 'types'
import { Button, Input } from 'ui'

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
  const isAiAssistantEnabled = useIsRLSAIAssistantEnabled()

  const [selectedTable, setSelectedTable] = useState<string>()
  const [showPolicyAiEditor, setShowPolicyAiEditor] = useState(false)
  const [selectedPolicyToEdit, setSelectedPolicyToEdit] = useState<PostgresPolicy>()

  const { data: schemas } = useSchemasQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const [protectedSchemas] = partition(
    schemas,
    (schema) => schema?.name !== 'realtime' && EXCLUDED_SCHEMAS.includes(schema?.name ?? '')
  )
  const selectedSchema = schemas?.find((s) => s.name === schema)
  const isLocked = protectedSchemas.some((s) => s.id === selectedSchema?.id)

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
  const canCreatePolicies = useCheckPermissions(PermissionAction.TENANT_SQL_ADMIN_WRITE, 'policies')
  const isPermissionsLoaded = usePermissionsLoaded()
  const schemaHasNoTables = (tables ?? []).length === 0

  if (isPermissionsLoaded && !canReadPolicies) {
    return <NoPermission isFullPage resourceText="view this project's RLS policies" />
  }

  return (
    <div className="flex flex-col h-full">
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <SchemaSelector
              className="w-[260px]"
              size="small"
              showError={false}
              selectedSchemaName={schema}
              onSelectSchema={(schema) => {
                setParams({ ...params, search: undefined, schema })
              }}
            />
            <Input
              size="small"
              placeholder="Filter tables and policies"
              className="block w-64 text-sm placeholder-border-muted"
              value={searchString || ''}
              onChange={(e) => {
                const str = e.target.value
                setParams({ ...params, search: str === '' ? undefined : str })
              }}
              icon={<Search size={14} />}
            />
          </div>
          <div className="flex items-center gap-x-2">
            <Button type="default" icon={<ExternalLink strokeWidth={1.5} />} asChild>
              <a
                target="_blank"
                rel="noreferrer"
                href="https://supabase.com/docs/learn/auth-deep-dive/auth-row-level-security"
              >
                Documentation
              </a>
            </Button>

            {isAiAssistantEnabled && (
              <ButtonTooltip
                type="primary"
                disabled={!canCreatePolicies || schemaHasNoTables}
                onClick={() => setShowPolicyAiEditor(true)}
                tooltip={{
                  content: {
                    side: 'bottom',
                    text: !canCreatePolicies
                      ? 'You need additional permissions to create RLS policies'
                      : schemaHasNoTables
                        ? `No table in schema ${schema} to create policies on`
                        : undefined,
                  },
                }}
              >
                Create a new policy
              </ButtonTooltip>
            )}
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
          isLocked={isLocked}
          onSelectCreatePolicy={(table: string) => {
            setShowPolicyAiEditor(true)
            setSelectedTable(table)
          }}
          onSelectEditPolicy={(policy) => {
            setSelectedPolicyToEdit(policy)
            setShowPolicyAiEditor(true)
          }}
        />
      )}

      <AIPolicyEditorPanel
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
  <AuthLayout title="Auth">
    <div className="h-full p-4">{page}</div>
  </AuthLayout>
)

export default AuthPoliciesPage
