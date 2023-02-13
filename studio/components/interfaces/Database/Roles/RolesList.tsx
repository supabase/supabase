import { FC } from 'react'
import { observer } from 'mobx-react-lite'
import * as Tooltip from '@radix-ui/react-tooltip'
import { PostgresRole } from '@supabase/postgres-meta'
import { Button, IconPlus } from 'ui'

import { useStore } from 'hooks'
import SparkBar from 'components/ui/SparkBar'
import { FormHeader } from 'components/ui/Forms'
import RoleRow from './RoleRow'

interface Props {
  onSelectRole: (role: any) => void
}

const RolesList: FC<Props> = ({ onSelectRole = () => {} }) => {
  const { meta } = useStore()
  const roles = meta.roles.list()

  const connectionLimit = Math.max(...roles.map((role: PostgresRole) => role.connection_limit))
  const totalActiveConnections = roles
    .map((role: PostgresRole) => role.active_connections)
    .reduce((a, b) => a + b, 0)
  const rolesWithActiveConnections = roles
    .filter((role: PostgresRole) => role.active_connections > 0)
    .sort((a, b) => b.active_connections - a.active_connections)

  return (
    <div>
      <div className="flex items-center justify-between">
        <FormHeader
          title="Database Roles"
          description="Manage access control to your database through users, groups, and permissions"
        />
        <div className="flex items-center mb-6 space-x-6">
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
          <Button type="primary" icon={<IconPlus size="tiny" />}>
            Add role
          </Button>
        </div>
      </div>

      <div>
        {roles.map((role: PostgresRole, i: number) => (
          <RoleRow key={role.id} role={role} />
        ))}
      </div>
    </div>
  )
}

export default observer(RolesList)
