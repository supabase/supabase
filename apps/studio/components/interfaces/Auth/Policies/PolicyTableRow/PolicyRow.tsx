import * as Tooltip from '@radix-ui/react-tooltip'
import type { PostgresPolicy } from '@supabase/postgres-meta'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { noop } from 'lodash'

import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import Panel from 'components/ui/Panel'
import { useAuthConfigQuery } from 'data/auth/auth-config-query'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  IconEdit,
  IconMoreVertical,
  IconTrash,
} from 'ui'

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

  const { project } = useProjectContext()
  const { data: authConfig } = useAuthConfigQuery({ projectRef: project?.ref })

  // TODO(km): Simple check for roles that allow authenticated access.
  // In the future, we'll use splinter to return proper warnings for policies that allow anonymous user access.
  const appliesToAnonymousUsers =
    authConfig?.EXTERNAL_ANONYMOUS_USERS_ENABLED &&
    (policy.roles.includes('authenticated') || policy.roles.includes('public'))

  return (
    <Panel.Content
      className={['flex border-overlay', 'w-full space-x-4 border-b py-4 lg:items-center'].join(
        ' '
      )}
    >
      <div className="flex grow flex-col space-y-1">
        <div className="flex items-center space-x-4">
          <p className="font-mono text-xs text-foreground-light">{policy.command}</p>
          <p className="text-sm text-foreground">{policy.name}</p>
          {appliesToAnonymousUsers ? (
            <Badge color="yellow">Applies to anonymous users</Badge>
          ) : null}
        </div>
        <div className="flex items-center space-x-2">
          <p className="text-foreground-light text-sm">Applied to:</p>
          {policy.roles.slice(0, 3).map((role, i) => (
            <code key={`policy-${role}-${i}`} className="text-foreground-light text-xs">
              {role}
            </code>
          ))}
          <Tooltip.Root delayDuration={0}>
            <Tooltip.Trigger>
              {policy.roles.length > 3 && (
                <code key={`policy-etc`} className="text-foreground-light text-xs">
                  + {policy.roles.length - 3} more roles
                </code>
              )}
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Content side="bottom">
                <Tooltip.Arrow className="radix-tooltip-arrow" />
                <div
                  className={[
                    'rounded bg-alternative py-1 px-2 leading-none shadow',
                    'border border-background max-w-[220px] text-center',
                  ].join(' ')}
                >
                  <span className="text-xs text-foreground">
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="default"
                style={{ paddingLeft: 4, paddingRight: 4 }}
                icon={<IconMoreVertical />}
              />
            </DropdownMenuTrigger>
            <DropdownMenuContent side="bottom" align="end" className="w-40">
              <DropdownMenuItem className="space-x-2" onClick={() => onSelectEditPolicy(policy)}>
                <IconEdit size={14} />
                <p>Edit policy</p>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="space-x-2" onClick={() => onSelectDeletePolicy(policy)}>
                <IconTrash size={14} />
                <p>Delete policy</p>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Tooltip.Root delayDuration={0}>
            <Tooltip.Trigger asChild>
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
                      'rounded bg-alternative py-1 px-2 leading-none shadow',
                      'border border-background',
                    ].join(' ')}
                  >
                    <span className="text-xs text-foreground">
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
