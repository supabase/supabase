import type { PostgresPolicy, PostgresTable } from '@supabase/postgres-meta'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { partition } from 'lodash'
import { useEffect, useState } from 'react'

import { useParams } from 'common'
import { useIsRLSAIAssistantEnabled } from 'components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { Policies } from 'components/interfaces/Auth/Policies'
import { AIPolicyEditorPanel } from 'components/interfaces/Auth/Policies/AIPolicyEditorPanel'
import { AuthLayout } from 'components/layouts'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import AlertError from 'components/ui/AlertError'
import NoPermission from 'components/ui/NoPermission'
import SchemaSelector from 'components/ui/SchemaSelector'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useDatabasePoliciesQuery } from 'data/database-policies/database-policies-query'
import { useSchemasQuery } from 'data/database/schemas-query'
import { useTablesQuery } from 'data/tables/tables-query'
import { useCheckPermissions, usePermissionsLoaded } from 'hooks'
import { EXCLUDED_SCHEMAS } from 'lib/constants/schemas'
import { useTableEditorStateSnapshot } from 'state/table-editor'
import type { NextPageWithLayout } from 'types'
import {
  Button,
  IconExternalLink,
  IconSearch,
  Input,
  TooltipContent_Shadcn_,
  TooltipTrigger_Shadcn_,
  Tooltip_Shadcn_,
} from 'ui'

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
  const { search, schema } = useParams()
  const { project } = useProjectContext()
  const snap = useTableEditorStateSnapshot()
  const [searchString, setSearchString] = useState<string>('')

  const [showPolicyAiEditor, setShowPolicyAiEditor] = useState(false)
  const [selectedPolicyToEdit, setSelectedPolicyToEdit] = useState<PostgresPolicy>()
  const isAiAssistantEnabled = useIsRLSAIAssistantEnabled()

  useEffect(() => {
    if (search) setSearchString(search)
  }, [search])

  useEffect(() => {
    if (schema) snap.setSelectedSchemaName(schema)
  }, [schema])

  const { data: schemas } = useSchemasQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const [protectedSchemas] = partition(schemas, (schema) =>
    EXCLUDED_SCHEMAS.includes(schema?.name ?? '')
  )
  const selectedSchema = schemas?.find((schema) => schema.name === snap.selectedSchemaName)
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
    schema: snap.selectedSchemaName,
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
              selectedSchemaName={snap.selectedSchemaName}
              onSelectSchema={(schema: string) => {
                snap.setSelectedSchemaName(schema)
                setSearchString('')
              }}
            />
            <Input
              size="small"
              placeholder="Filter tables and policies"
              className="block w-64 text-sm placeholder-border-muted"
              value={searchString}
              onChange={(e) => setSearchString(e.target.value)}
              icon={<IconSearch size="tiny" />}
            />
          </div>
          <div className="flex items-center gap-x-2">
            <Button type="default" icon={<IconExternalLink size={14} strokeWidth={1.5} />} asChild>
              <a
                target="_blank"
                rel="noreferrer"
                href="https://supabase.com/docs/learn/auth-deep-dive/auth-row-level-security"
              >
                Documentation
              </a>
            </Button>

            <Tooltip_Shadcn_>
              <TooltipTrigger_Shadcn_ asChild>
                <Button
                  type="primary"
                  disabled={!canCreatePolicies || schemaHasNoTables}
                  onClick={() => setShowPolicyAiEditor(true)}
                >
                  Create a new policy
                </Button>
              </TooltipTrigger_Shadcn_>
              {(!canCreatePolicies || schemaHasNoTables) && (
                <TooltipContent_Shadcn_ side="bottom">
                  {!canCreatePolicies
                    ? 'You need additional permissions to create RLS policies'
                    : schemaHasNoTables
                      ? `No table in schema ${snap.selectedSchemaName} to create policies on`
                      : null}
                </TooltipContent_Shadcn_>
              )}
            </Tooltip_Shadcn_>
          </div>
        </div>
      </div>

      {isLoading && <GenericSkeletonLoader />}

      {isError && <AlertError error={error} subject="Failed to retrieve tables" />}

      {isSuccess && (
        <Policies
          tables={filteredTables}
          hasTables={tables.length > 0}
          isLocked={isLocked}
          onSelectEditPolicy={(policy) => {
            setSelectedPolicyToEdit(policy)
            setShowPolicyAiEditor(true)
          }}
        />
      )}

      <AIPolicyEditorPanel
        visible={showPolicyAiEditor}
        searchString={searchString}
        selectedPolicy={selectedPolicyToEdit}
        onSelectCancel={() => {
          setShowPolicyAiEditor(false)
          setSelectedPolicyToEdit(undefined)
        }}
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
