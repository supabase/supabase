import Link from 'next/link'
import { FC, useState } from 'react'
import { observer } from 'mobx-react-lite'
import * as Tooltip from '@radix-ui/react-tooltip'
import { PostgresRole } from '@supabase/postgres-meta'
import { Button, Input, IconPlus, IconSearch } from 'ui'

import { useParams, useStore } from 'hooks'
import SparkBar from 'components/ui/SparkBar'
import { FormHeader } from 'components/ui/Forms'
import RoleRow from './RoleRow'
import DeleteRoleModal from './DeleteRoleModal'

interface Props {
  onSelectRole: (role: any) => void
}

const RolesList: FC<Props> = ({}) => {
  const { ref } = useParams()
  const { meta } = useStore()

  const [filterString, setFilterString] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'active'>('all')
  const [selectedRoleToDelete, setSelectedRoleToDelete] = useState<any>()

  const roles = meta.roles.list()
  const filteredRoles = (
    filterType === 'active'
      ? meta.roles.list((role: PostgresRole) => role.active_connections > 0)
      : meta.roles.list()
  ).filter((role: PostgresRole) => role.name.includes(filterString))

  const connectionLimit = Math.max(...roles.map((role: PostgresRole) => role.connection_limit))
  const totalActiveConnections = roles
    .map((role: PostgresRole) => role.active_connections)
    .reduce((a, b) => a + b, 0)
  const rolesWithActiveConnections = roles
    .filter((role: PostgresRole) => role.active_connections > 0)
    .sort((a, b) => b.active_connections - a.active_connections)

  return (
    <>
      <div>
        <div className="flex items-center justify-between">
          <FormHeader
            title="Database Roles"
            description="Manage access control to your database through users, groups, and permissions"
          />
        </div>

        <div className="mb-4 -mt-2 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Input
              size="small"
              placeholder="Search for a role"
              icon={<IconSearch size="tiny" />}
              onChange={(event: any) => setFilterString(event.target.value)}
            />
            <div className="flex items-center border border-scale-700 rounded-full w-min h-[34px]">
              <button
                className={[
                  'text-sm w-[100px] h-full text-center rounded-l-full flex items-center justify-center transition',
                  filterType === 'all'
                    ? 'bg-scale-500 text-scale-1200'
                    : 'hover:bg-scale-400 text-scale-1100',
                ].join(' ')}
                onClick={() => setFilterType('all')}
              >
                All roles
              </button>
              <div className="h-full w-[1px] border-r border-scale-700"></div>
              <button
                className={[
                  'text-sm w-[100px] h-full text-center rounded-r-full flex items-center justify-center transition',
                  filterType === 'active'
                    ? 'bg-scale-500 text-scale-1200'
                    : 'hover:bg-scale-400 text-scale-1100',
                ].join(' ')}
                onClick={() => setFilterType('active')}
              >
                Active roles
              </button>
            </div>
          </div>
          <div className="flex items-center space-x-6">
            <Tooltip.Root delayDuration={0}>
              <Tooltip.Trigger>
                <div className="w-42">
                  <SparkBar
                    type="horizontal"
                    max={connectionLimit}
                    value={totalActiveConnections}
                    barClass={
                      totalActiveConnections > 0.9 * connectionLimit
                        ? 'bg-red-800'
                        : totalActiveConnections > 0.75 * connectionLimit
                        ? 'bg-amber-900'
                        : 'bg-green-800'
                    }
                    labelTop={`${totalActiveConnections}/${connectionLimit}`}
                    labelBottom="Active connections"
                  />
                </div>
              </Tooltip.Trigger>
              <Tooltip.Content align="start" side="bottom">
                <Tooltip.Arrow className="radix-tooltip-arrow" />
                <div
                  className={[
                    'rounded bg-scale-100 py-1 px-2 leading-none shadow',
                    'border border-scale-200 space-y-1',
                  ].join(' ')}
                >
                  <p className="text-xs text-scale-1100 pr-2">Connections by roles:</p>
                  {rolesWithActiveConnections.map((role: PostgresRole) => (
                    <div key={role.id} className="text-xs text-scale-1200">
                      {role.name}: {role.active_connections}
                    </div>
                  ))}
                </div>
              </Tooltip.Content>
            </Tooltip.Root>
            <Link href={`/project/${ref}/database/roles/new`}>
              <a>
                <Button type="primary" icon={<IconPlus size="tiny" />}>
                  Add role
                </Button>
              </a>
            </Link>
          </div>
        </div>

        <div>
          {filteredRoles.map((role: PostgresRole, i: number) => (
            <RoleRow key={role.id} role={role} onSelectDelete={setSelectedRoleToDelete} />
          ))}
          {filterString.length > 0 && filteredRoles.length === 0 && (
            <div className="bg-scale-100 dark:bg-scale-300 border border-scale-300 dark:border-scale-500 px-6 py-4 rounded space-y-1">
              <p className="text-sm text-scale-1100">No results found</p>
              <p className="text-sm text-scale-1000">
                Your search for "{filterString}" did not return any results
              </p>
            </div>
          )}
        </div>
      </div>

      <DeleteRoleModal
        role={selectedRoleToDelete}
        visible={selectedRoleToDelete !== undefined}
        onClose={() => setSelectedRoleToDelete(undefined)}
      />
    </>
  )
}

export default observer(RolesList)
