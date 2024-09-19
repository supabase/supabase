import * as Tooltip from '@radix-ui/react-tooltip'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { partition, sortBy } from 'lodash'
import { Plus, Search, X } from 'lucide-react'
import { useState } from 'react'

import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import NoSearchResults from 'components/ui/NoSearchResults'
import SparkBar from 'components/ui/SparkBar'
import { useDatabaseRolesQuery } from 'data/database-roles/database-roles-query'
import { useMaxConnectionsQuery } from 'data/database/max-connections-query'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { Badge, Button, Input } from 'ui'
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
    filterType === 'active' ? roles.filter((role) => role.activeConnections > 0) : roles
  ).filter((role) => role.name.includes(filterString))
  const [supabaseRoles, otherRoles] = partition(filteredRoles, (role) =>
    SUPABASE_ROLES.includes(role.name as SUPABASE_ROLE)
  )

  const totalActiveConnections = roles
    .map((role) => role.activeConnections)
    .reduce((a, b) => a + b, 0)
  // order the roles with active connections by number of connections, most connections first
  const rolesWithActiveConnections = sortBy(
    roles.filter((role) => role.activeConnections > 0),
    (r) => -r.activeConnections
  )

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center space-x-4">
          <Input
            size="small"
            placeholder="Search for a role"
            icon={<Search size={12} />}
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
                  <X size={12} strokeWidth={2} />
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
                      ? 'bg-foreground'
                      : totalActiveConnections > 0.9 * maxConnectionLimit
                        ? 'bg-destructive'
                        : totalActiveConnections > 0.75 * maxConnectionLimit
                          ? 'bg-warning'
                          : undefined
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
                    {role.name}: {role.activeConnections}
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
                icon={<Plus size={12} />}
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
        {supabaseRoles.length > 0 && (
          <div>
            <div className="bg-surface-100 border border-default px-6 py-3 rounded-t flex items-center space-x-4">
              <p className="text-sm text-foreground-light">Roles managed by Supabase</p>
              <Badge variant="brand">Protected</Badge>
            </div>

            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => <RoleRowSkeleton key={i} index={i} />)
              : supabaseRoles.map((role) => (
                  <RoleRow
                    disabled
                    key={role.id}
                    role={role}
                    onSelectDelete={setSelectedRoleToDelete}
                  />
                ))}
          </div>
        )}

        {otherRoles.length > 0 && (
          <div>
            <div className="bg-surface-100 border border-default px-6 py-3 rounded-t">
              <p className="text-sm text-foreground-light">Other database roles</p>
            </div>

            {isLoading
              ? Array.from({ length: 3 }).map((_, i) => <RoleRowSkeleton key={i} index={i} />)
              : otherRoles.map((role) => (
                  <RoleRow
                    key={role.id}
                    disabled={!canUpdateRoles}
                    role={role}
                    onSelectDelete={setSelectedRoleToDelete}
                  />
                ))}
          </div>
        )}
      </div>

      {filterString.length > 0 && filteredRoles.length === 0 && (
        <NoSearchResults searchString={filterString} onResetFilter={() => setFilterString('')} />
      )}

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
