import { FC } from 'react'
import * as Tooltip from '@radix-ui/react-tooltip'
import { Button, Dropdown, IconEdit, IconTrash, IconMoreVertical } from '@supabase/ui'
import { PostgresPolicy } from '@supabase/postgres-meta'
import { PermissionAction } from '@supabase/shared-types/out/constants'

import { checkPermissions } from 'hooks'
import Panel from 'components/ui/Panel'

interface Props {
  policy: PostgresPolicy
  onSelectEditPolicy: (policy: PostgresPolicy) => void
  onSelectDeletePolicy: (policy: PostgresPolicy) => void
}

const PolicyRow: FC<Props> = ({
  policy,
  onSelectEditPolicy = () => {},
  onSelectDeletePolicy = () => {},
}) => {
  const canUpdatePolicies = checkPermissions(PermissionAction.TENANT_SQL_ADMIN_WRITE, 'policies')

  return (
    <Panel.Content
      className={[
        'border-panel-border-light dark:border-panel-border-dark flex',
        'w-full space-x-4 border-b py-4 lg:items-center',
      ].join(' ')}
    >
      <div className="flex grow flex-col truncate space-y-1">
        <div className="flex items-center space-x-4">
          <p className="text-scale-1000 font-mono text-xs">{policy.command}</p>
          <p className="text-scale-1200 max-w-xs truncate text-sm">{policy.name}</p>
        </div>
        <div className="flex items-center space-x-2">
          <p className="text-scale-1000 text-sm">Applied to:</p>
          {policy.roles.map((role) => (
            <code className="text-scale-1000 text-xs">{role}</code>
          ))}
        </div>
      </div>
      <div>
        {canUpdatePolicies ? (
          <Dropdown
            side="bottom"
            align="end"
            size="small"
            overlay={
              <>
                <Dropdown.Item
                  icon={<IconEdit size={14} />}
                  onClick={() => onSelectEditPolicy(policy)}
                >
                  Edit
                </Dropdown.Item>
                <Dropdown.Seperator />
                <Dropdown.Item
                  icon={<IconTrash size={14} />}
                  onClick={() => onSelectDeletePolicy(policy)}
                >
                  Delete
                </Dropdown.Item>
              </>
            }
          >
            <Button
              type="default"
              style={{ paddingLeft: 4, paddingRight: 4 }}
              icon={<IconMoreVertical />}
            />
          </Dropdown>
        ) : (
          <Tooltip.Root delayDuration={0}>
            <Tooltip.Trigger>
              <Button
                disabled
                type="default"
                style={{ paddingLeft: 4, paddingRight: 4 }}
                icon={<IconMoreVertical />}
              />
            </Tooltip.Trigger>
            {!canUpdatePolicies && (
              <Tooltip.Content side="left">
                <Tooltip.Arrow className="radix-tooltip-arrow" />
                <div
                  className={[
                    'bg-scale-100 rounded py-1 px-2 leading-none shadow',
                    'border-scale-200 border',
                  ].join(' ')}
                >
                  <span className="text-scale-1200 text-xs">
                    You need additional permissions to edit RLS policies
                  </span>
                </div>
              </Tooltip.Content>
            )}
          </Tooltip.Root>
        )}
      </div>
    </Panel.Content>
  )
}

export default PolicyRow
