import * as Tooltip from '@radix-ui/react-tooltip'
import type { PostgresPolicy } from '@supabase/postgres-meta'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { noop } from 'lodash'
import { Button, Dropdown, IconEdit, IconMoreVertical, IconTrash, ScrollArea } from 'ui'

import Panel from 'components/ui/Panel'
import { useCheckPermissions } from 'hooks'

interface PolicyRowProps {
  policy: PostgresPolicy
  onSelectEditPolicy: (policy: PostgresPolicy) => void
  onSelectDeletePolicy: (policy: PostgresPolicy) => void
}

const PolicyRow = ({
  policy,
  onSelectEditPolicy = noop,
  onSelectDeletePolicy = noop,
}: PolicyRowProps) => {
  const canUpdatePolicies = useCheckPermissions(PermissionAction.TENANT_SQL_ADMIN_WRITE, 'policies')

  return (
    <Panel.Content
      className={[
        'flex border-panel-border-light dark:border-panel-border-dark',
        'w-full space-x-4 border-b py-4 lg:items-center',
      ].join(' ')}
    >
      <div className="flex grow flex-col space-y-1">
        <div className="flex items-center space-x-4">
          <p className="font-mono text-xs text-scale-1000">{policy.command}</p>
          <p className="text-sm text-scale-1200">{policy.name}</p>
        </div>
        <div className="flex items-center space-x-2">
          <p className="text-scale-1000 text-sm">Applied to:</p>
          {policy.roles.slice(0, 3).map((role, i) => (
            <code key={`policy-${role}-${i}`} className="text-scale-1000 text-xs">
              {role}
            </code>
          ))}
          <Tooltip.Root delayDuration={0}>
            <Tooltip.Trigger>
              {policy.roles.length > 3 && (
                <code key={`policy-etc`} className="text-scale-1000 text-xs">
                  + {policy.roles.length - 3} more roles
                </code>
              )}
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Content side="bottom">
                <Tooltip.Arrow className="radix-tooltip-arrow" />
                <div
                  className={[
                    'rounded bg-scale-100 py-1 px-2 leading-none shadow',
                    'border border-scale-200 max-w-[220px] text-center',
                  ].join(' ')}
                >
                  <span className="text-xs text-scale-1200">
                    {policy.roles.slice(3).join(', ')}
                  </span>
                </div>
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>
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
                <Dropdown.Separator />
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
              <Tooltip.Portal>
                <Tooltip.Content side="left">
                  <Tooltip.Arrow className="radix-tooltip-arrow" />
                  <div
                    className={[
                      'rounded bg-scale-100 py-1 px-2 leading-none shadow',
                      'border border-scale-200',
                    ].join(' ')}
                  >
                    <span className="text-xs text-scale-1200">
                      You need additional permissions to edit RLS policies
                    </span>
                  </div>
                </Tooltip.Content>
              </Tooltip.Portal>
            )}
          </Tooltip.Root>
        )}
      </div>
    </Panel.Content>
  )
}

export default PolicyRow
