import { PostgresPolicy, PostgresTable } from '@supabase/postgres-meta'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import { partition } from 'lodash'
import { observer } from 'mobx-react-lite'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Button, IconExternalLink, IconSearch, Input } from 'ui'

import { Policies } from 'components/interfaces/Auth/Policies'
import RLSTestSidePanel from 'components/interfaces/Auth/Policies/RLSTestSidePanel/RLSTestSidePanel'
import { AuthLayout } from 'components/layouts'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import AlertError from 'components/ui/AlertError'
import NoPermission from 'components/ui/NoPermission'
import SchemaSelector from 'components/ui/SchemaSelector'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useSchemasQuery } from 'data/database/schemas-query'
import { useTablesQuery } from 'data/tables/tables-query'
import { useCheckPermissions, useStore } from 'hooks'
import { EXCLUDED_SCHEMAS } from 'lib/constants/schemas'
import { useTableEditorStateSnapshot } from 'state/table-editor'
import { NextPageWithLayout } from 'types'

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
  const { project } = useProjectContext()
  const snap = useTableEditorStateSnapshot()
  const { meta } = useStore()
  const { search } = useParams()
  const [showRlsTester, setShowRlsTester] = useState(false)
  const [searchString, setSearchString] = useState<string>('')

  useEffect(() => {
    if (search) setSearchString(search)
  }, [search])

  const { data: schemas } = useSchemasQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const [protectedSchemas] = partition(schemas, (schema) =>
    EXCLUDED_SCHEMAS.includes(schema?.name ?? '')
  )
  const schema = schemas?.find((schema) => schema.name === snap.selectedSchemaName)
  const isLocked = protectedSchemas.some((s) => s.id === schema?.id)

  const policies = meta.policies.list()

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

  const filteredTables = onFilterTables(tables ?? [], policies, searchString)
  const canReadPolicies = useCheckPermissions(PermissionAction.TENANT_SQL_ADMIN_READ, 'policies')

  if (!canReadPolicies) {
    return <NoPermission isFullPage resourceText="view this project's RLS policies" />
  }

  return (
    <div className="flex flex-col h-full">
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <SchemaSelector
              className="w-[260px]"
              size="small"
              showError={false}
              selectedSchemaName={snap.selectedSchemaName}
              onSelectSchema={snap.setSelectedSchemaName}
            />
            <Input
              size="small"
              placeholder="Filter tables and policies"
              className="block w-64 text-sm placeholder-gray-400"
              value={searchString}
              onChange={(e) => setSearchString(e.target.value)}
              icon={<IconSearch size="tiny" />}
            />
          </div>

          <div className="flex items-center gap-2">
            <Button type="default" onClick={() => setShowRlsTester(true)}>
              Test RLS policies
            </Button>
            <Link
              passHref
              href="https://supabase.com/docs/learn/auth-deep-dive/auth-row-level-security"
            >
              <Button
                asChild
                type="default"
                icon={<IconExternalLink size={14} strokeWidth={1.5} />}
              >
                <a target="_blank" rel="noreferrer">
                  What is RLS?
                </a>
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {isLoading && <GenericSkeletonLoader />}
      {isError && <AlertError error={error} subject="Failed to retrieve tables" />}
      {isSuccess && (
        <Policies tables={filteredTables} hasTables={tables.length > 0} isLocked={isLocked} />
      )}

      <RLSTestSidePanel visible={showRlsTester} onClose={() => setShowRlsTester(false)} />
    </div>
  )
}

AuthPoliciesPage.getLayout = (page) => (
  <AuthLayout title="Auth">
    <div className="h-full p-4">{page}</div>
  </AuthLayout>
)

export default observer(AuthPoliciesPage)
