import { useState, useEffect } from 'react'
import { Button, IconSearch, Input, IconExternalLink } from 'ui'
import { observer } from 'mobx-react-lite'
import { PostgresTable, PostgresPolicy } from '@supabase/postgres-meta'
import { PermissionAction } from '@supabase/shared-types/out/constants'

import { NextPageWithLayout } from 'types'
import { checkPermissions, useParams, useStore } from 'hooks'
import { AuthLayout } from 'components/layouts'
import { Policies } from 'components/interfaces/Auth/Policies'
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
  const { meta } = useStore()
  const { search } = useParams()
  const [policiesFilter, setPoliciesFilter] = useState<string>('')

  useEffect(() => {
    if (search) setPoliciesFilter(search)
  }, [search])

  const publicTables = meta.tables.list((table: { schema: string }) => table.schema === 'public')
  const policies = meta.policies.list()
  const filteredTables = onFilterTables(publicTables, policies, policiesFilter)

  const canReadPolicies = checkPermissions(PermissionAction.TENANT_SQL_ADMIN_READ, 'policies')

  if (!canReadPolicies) {
    return <NoPermission isFullPage resourceText="view this project's RLS policies" />
  }

  return (
    <div className="flex flex-col h-full">
      {(publicTables || []).length > 0 && (
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
            <Button type="link" icon={<IconExternalLink size={14} strokeWidth={1.5} />}>
              <a
                target="_blank"
                href="https://supabase.com/docs/learn/auth-deep-dive/auth-row-level-security"
              >
                What is RLS?
              </a>
            </Button>
          </div>
        </div>
      )}
      <Policies hasPublicTables={publicTables.length > 0} tables={filteredTables} />
    </div>
  )
}

AuthPoliciesPage.getLayout = (page) => (
  <AuthLayout title="Auth">
    <div className="h-full p-4">{page}</div>
  </AuthLayout>
)

export default observer(AuthPoliciesPage)
