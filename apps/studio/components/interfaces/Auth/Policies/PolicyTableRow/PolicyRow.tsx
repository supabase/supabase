import type { PostgresPolicy } from '@supabase/postgres-meta'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { noop } from 'lodash'

import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import Panel from 'components/ui/Panel'
import { useAuthConfigQuery } from 'data/auth/auth-config-query'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { Edit, MoreVertical, Trash } from 'lucide-react'
import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Tooltip_Shadcn_,
  TooltipContent_Shadcn_,
  TooltipTrigger_Shadcn_,
} from 'ui'
import { DropdownMenuItemTooltip } from 'components/ui/DropdownMenuItemTooltip'

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
        <div className="flex items-center gap-x-1 ml-[60px]">
          <div className="text-foreground-lighter text-sm">
            Applied to:
            {policy.roles.slice(0, 3).map((role, i) => (
              <code key={`policy-${role}-${i}`} className="text-foreground-light text-xs">
                {role}
              </code>
            ))}{' '}
            role
          </div>
          {policy.roles.length > 3 && (
            <Tooltip_Shadcn_>
              <TooltipTrigger_Shadcn_ asChild>
                <code key="policy-etc" className="text-foreground-light text-xs">
                  + {policy.roles.length - 3} more roles
                </code>
              </TooltipTrigger_Shadcn_>
              <TooltipContent_Shadcn_ side="bottom" align="center">
                {policy.roles.slice(3).join(', ')}
              </TooltipContent_Shadcn_>
            </Tooltip_Shadcn_>
          )}
        </div>
      </div>
      <div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="default" className="px-1.5" icon={<MoreVertical />} />
          </DropdownMenuTrigger>
          <DropdownMenuContent side="bottom" align="end" className="w-40">
            <DropdownMenuItem className="gap-x-2" onClick={() => onSelectEditPolicy(policy)}>
              <Edit size={14} />
              <p>Edit policy</p>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItemTooltip
              className="gap-x-2"
              disabled={!canUpdatePolicies}
              onClick={() => onSelectDeletePolicy(policy)}
              tooltip={{
                content: {
                  side: 'left',
                  text: 'You need additional permissions to delete policies',
                },
              }}
            >
              <Trash size={14} />
              <p>Delete policy</p>
            </DropdownMenuItemTooltip>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </Panel.Content>
  )
}

export default PolicyRow
