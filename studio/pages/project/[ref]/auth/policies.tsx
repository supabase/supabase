import { useState, useEffect } from 'react'
import { partition } from 'lodash'
import { Button, Listbox, IconSearch, Input, IconExternalLink, IconLock } from 'ui'
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
  const [selectedSchema, setSelectedSchema] = useState<string>('public')
  const [searchString, setSearchString] = useState<string>('')

  useEffect(() => {
    if (search) setSearchString(search)
  }, [search])

  const schemas = meta.schemas.list()
  const [protectedSchemas, openSchemas] = partition(schemas, (schema) =>
    meta.excludedSchemas.includes(schema?.name ?? '')
  )
  // @ts-ignore
  const schema = schemas.find((schema) => schema.name === selectedSchema)
  const isLocked = protectedSchemas.some((s) => s.id === schema?.id)

  const policies = meta.policies.list()

  const tables = meta.tables.list((table: { schema: string }) => table.schema === selectedSchema)
  const filteredTables = onFilterTables(tables, policies, searchString)

  const canReadPolicies = checkPermissions(PermissionAction.TENANT_SQL_ADMIN_READ, 'policies')

  if (!canReadPolicies) {
    return <NoPermission isFullPage resourceText="view this project's RLS policies" />
  }

  return (
    <div className="flex flex-col h-full">
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-[230px]">
              <Listbox
                size="small"
                value={selectedSchema}
                onChange={(schema: string) => {
                  setSelectedSchema(schema)
                  setSearchString('')
                }}
                icon={isLocked && <IconLock size={14} strokeWidth={2} />}
              >
                <Listbox.Option
                  disabled
                  key="normal-schemas"
                  value="normal-schemas"
                  label="Schemas"
                >
                  <p className="text-sm">Schemas</p>
                </Listbox.Option>
                {/* @ts-ignore */}
                {openSchemas.map((schema) => (
                  <Listbox.Option
                    key={schema.id}
                    value={schema.name}
                    label={schema.name}
                    addOnBefore={() => <span className="text-scale-900">schema</span>}
                  >
                    <span className="text-scale-1200 text-sm">{schema.name}</span>
                  </Listbox.Option>
                ))}
                <Listbox.Option
                  disabled
                  key="protected-schemas"
                  value="protected-schemas"
                  label="Protected schemas"
                >
                  <p className="text-sm">Protected schemas</p>
                </Listbox.Option>
                {protectedSchemas.map((schema) => (
                  <Listbox.Option
                    key={schema.id}
                    value={schema.name}
                    label={schema.name}
                    addOnBefore={() => <span className="text-scale-900">schema</span>}
                  >
                    <span className="text-scale-1200 text-sm">{schema.name}</span>
                  </Listbox.Option>
                ))}
              </Listbox>
            </div>
            <Input
              size="small"
              placeholder="Filter tables and policies"
              className="block w-64 text-sm placeholder-gray-400"
              value={searchString}
              onChange={(e) => setSearchString(e.target.value)}
              icon={<IconSearch size="tiny" />}
            />
          </div>
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
      <Policies tables={filteredTables} hasTables={tables.length > 0} isLocked={isLocked} />
    </div>
  )
}

AuthPoliciesPage.getLayout = (page) => (
  <AuthLayout title="Auth">
    <div className="h-full p-4">{page}</div>
  </AuthLayout>
)

export default observer(AuthPoliciesPage)
