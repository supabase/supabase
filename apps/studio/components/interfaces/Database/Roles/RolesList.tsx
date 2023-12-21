import * as Tooltip from '@radix-ui/react-tooltip'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { partition, sortBy } from 'lodash'
import { useState } from 'react'
import { Badge, Button, IconPlus, IconSearch, IconX, Input } from 'ui'

import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { FormHeader } from 'components/ui/Forms'
import NoSearchResults from 'components/ui/NoSearchResults'
import SparkBar from 'components/ui/SparkBar'
import { useDatabaseRolesQuery } from 'data/database-roles/database-roles-query'
import { useMaxConnectionsQuery } from 'data/database/max-connections-query'
import { useCheckPermissions } from 'hooks'
import CreateRolePanel from './CreateRolePanel'
import DeleteRoleModal from './DeleteRoleModal'
import RoleRow from './RoleRow'
import RoleRowSkeleton from './RoleRowSkeleton'
import { SUPABASE_ROLES } from './Roles.constants'

type SUPABASE_ROLE = (typeof SUPABASE_ROLES)[number]

const RolesList = () => {
  const { project } = useProjectContext()

  const [filterString, setFilterString] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'active'>('all')
  const [isCreatingRole, setIsCreatingRole] = useState(false)
  const [selectedRoleToDelete, setSelectedRoleToDelete] = useState<any>()

  const canUpdateRoles = useCheckPermissions(PermissionAction.TENANT_SQL_ADMIN_WRITE, 'roles')

  const { data: maxConnData } = useMaxConnectionsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const maxConnectionLimit = maxConnData?.maxConnections

  const { data, isLoading } = useDatabaseRolesQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const roles = sortBy(data ?? [], (r) => r.name.toLocaleLowerCase())

  const filteredRoles = (
    filterType === 'active' ? roles.filter((role) => role.active_connections > 0) : roles
  ).filter((role) => role.name.includes(filterString))
  const [supabaseRoles, otherRoles] = partition(filteredRoles, (role) =>
    SUPABASE_ROLES.includes(role.name as SUPABASE_ROLE)
  )

  const totalActiveConnections = roles
    .map((role) => role.active_connections)
    .reduce((a, b) => a + b, 0)
  // order the roles with active connections by number of connections, most connections first
  const rolesWithActiveConnections = sortBy(
    roles.filter((role) => role.active_connections > 0),
    (r) => -r.active_connections
  )

  return (
    <>
      <div>
        <div className="flex items-center justify-between">
          <FormHeader
            title="Database Roles"
            description="Manage access control to your database through users, groups, and permissions"
          />
        </div>

        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Input
              size="small"
              placeholder="Search for a role"
              icon={<IconSearch size="tiny" />}
              value={filterString}
              onChange={(event: any) => setFilterString(event.target.value)}
              actions={
                filterString && (
                  <Button
                    size="tiny"
                    type="text"
                    onClick={() => setFilterString('')}
                    className="px-1 mr-1"
                  >
                    <IconX size={12} strokeWidth={2} />
                  </Button>
                )
              }
            />
            <div className="flex items-center border border-strong rounded-full w-min h-[34px]">
              <button
                className={[
                  'text-xs w-[90px] h-full text-center rounded-l-full flex items-center justify-center transition',
                  filterType === 'all'
                    ? 'bg-overlay-hover text-foreground'
                    : 'hover:bg-surface-200 text-foreground-light',
                ].join(' ')}
                onClick={() => setFilterType('all')}
              >
                All roles
              </button>
              <div className="h-full w-[1px] border-r border-strong"></div>
              <button
                className={[
                  'text-xs w-[90px] h-full text-center rounded-r-full flex items-center justify-center transition',
                  filterType === 'active'
                    ? 'bg-overlay-hover text-foreground'
                    : 'hover:bg-surface-200 text-foreground-light',
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
                    // if the maxConnectionLimit is undefined, set totalActiveConnections so that
                    // the width of the bar is set to 100%
                    max={maxConnectionLimit || totalActiveConnections}
                    value={totalActiveConnections}
                    barClass={
                      maxConnectionLimit === 0 || maxConnectionLimit === undefined
                        ? 'bg-control'
                        : totalActiveConnections > 0.9 * maxConnectionLimit
                        ? 'bg-red-800'
                        : totalActiveConnections > 0.75 * maxConnectionLimit
                        ? 'bg-amber-900'
                        : 'bg-green-800'
                    }
                    labelTop={
                      Number.isInteger(maxConnectionLimit)
                        ? `${totalActiveConnections}/${maxConnectionLimit}`
                        : `${totalActiveConnections}`
                    }
                    labelBottom="Active connections"
                  />
                </div>
              </Tooltip.Trigger>
              <Tooltip.Content align="start" side="bottom">
                <Tooltip.Arrow className="radix-tooltip-arrow" />
                <div
                  className={[
                    'rounded bg-alternative py-1 px-2 leading-none shadow',
                    'border border-background space-y-1',
                  ].join(' ')}
                >
                  <p className="text-xs text-foreground-light pr-2">Connections by roles:</p>
                  {rolesWithActiveConnections.map((role) => (
                    <div key={role.id} className="text-xs text-foreground">
                      {role.name}: {role.active_connections}
                    </div>
                  ))}
                </div>
              </Tooltip.Content>
            </Tooltip.Root>
            <Tooltip.Root delayDuration={0}>
              <Tooltip.Trigger asChild>
                <Button
                  type="primary"
                  disabled={!canUpdateRoles}
                  icon={<IconPlus size="tiny" />}
                  onClick={() => setIsCreatingRole(true)}
                >
                  Add role
                </Button>
              </Tooltip.Trigger>
              {!canUpdateRoles && (
                <Tooltip.Content align="start" side="bottom">
                  <Tooltip.Arrow className="radix-tooltip-arrow" />
                  <div
                    className={[
                      'rounded bg-alternative py-1 px-2 leading-none shadow',
                      'border border-background text-xs',
                    ].join(' ')}
                  >
                    You need additional permissions to add a new role
                  </div>
                </Tooltip.Content>
              )}
            </Tooltip.Root>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <div className="bg-surface-100 border border-default px-6 py-3 rounded-t flex items-center space-x-4">
              <p className="text-sm text-foreground-light">Roles managed by Supabase</p>
              <Badge color="green">Protected</Badge>
            </div>

            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => <RoleRowSkeleton key={i} index={i} />)
              : supabaseRoles.map((role, i: number) => (
                  <RoleRow
                    disabled
                    key={role.id}
                    role={role}
                    onSelectDelete={setSelectedRoleToDelete}
                  />
                ))}
          </div>

          <div>
            <div className="bg-surface-100 border border-default px-6 py-3 rounded-t">
              <p className="text-sm text-foreground-light">Other database roles</p>
            </div>

            {isLoading
              ? Array.from({ length: 3 }).map((_, i) => <RoleRowSkeleton key={i} index={i} />)
              : otherRoles.map((role, i: number) => (
                  <RoleRow
                    key={role.id}
                    disabled={!canUpdateRoles}
                    role={role}
                    onSelectDelete={setSelectedRoleToDelete}
                  />
                ))}
          </div>
        </div>

        {filterString.length > 0 && filteredRoles.length === 0 && (
          <NoSearchResults searchString={filterString} onResetFilter={() => setFilterString('')} />
        )}
      </div>

      <CreateRolePanel visible={isCreatingRole} onClose={() => setIsCreatingRole(false)} />

      <DeleteRoleModal
        role={selectedRoleToDelete}
        visible={selectedRoleToDelete !== undefined}
        onClose={() => setSelectedRoleToDelete(undefined)}
      />
    </>
  )
}

export default RolesList
