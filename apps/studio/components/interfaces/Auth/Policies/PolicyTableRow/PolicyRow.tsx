import type { PostgresPolicy } from '@supabase/postgres-meta'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { noop } from 'lodash'
import { Edit, MoreVertical, Trash } from 'lucide-react'

import { DropdownMenuItemTooltip } from 'components/ui/DropdownMenuItemTooltip'
import { useAuthConfigQuery } from 'data/auth/auth-config-query'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { useAiAssistantStateSnapshot } from 'state/ai-assistant-state'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  TableCell,
  TableRow,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'
import { generatePolicyUpdateSQL } from './PolicyTableRow.utils'

interface PolicyRowProps {
  policy: PostgresPolicy
  onSelectEditPolicy: (policy: PostgresPolicy) => void
  onSelectDeletePolicy: (policy: PostgresPolicy) => void
  isLocked?: boolean
}

export const PolicyRow = ({
  policy,
  isLocked: isLockedDefault = false,
  onSelectEditPolicy = noop,
  onSelectDeletePolicy = noop,
}: PolicyRowProps) => {
  const aiSnap = useAiAssistantStateSnapshot()
  const { can: canUpdatePolicies } = useAsyncCheckPermissions(
    PermissionAction.TENANT_SQL_ADMIN_WRITE,
    'policies'
  )

  const { data: project } = useSelectedProjectQuery()
  const { data: authConfig } = useAuthConfigQuery({ projectRef: project?.ref })

  // override islocked for Realtime messages table
  const isLocked =
    policy.schema === 'realtime' && policy.table === 'messages' ? false : isLockedDefault

  // TODO(km): Simple check for roles that allow authenticated access.
  // In the future, we'll use splinter to return proper warnings for policies that allow anonymous user access.
  const appliesToAnonymousUsers =
    authConfig?.EXTERNAL_ANONYMOUS_USERS_ENABLED &&
    (policy.roles.includes('authenticated') || policy.roles.includes('public'))

  const displayedRoles = (() => {
    const rolesWithAnonymous = appliesToAnonymousUsers
      ? [...policy.roles, 'anonymous sign-ins']
      : policy.roles
    return rolesWithAnonymous
  })()

  return (
    <TableRow>
      <TableCell className="w-[40%] truncate">
        <div className="flex items-center gap-x-2 min-w-0">
          <Button
            type="text"
            className="text-foreground text-sm p-0 hover:bg-transparent w-full truncate justify-start"
            onClick={() => onSelectEditPolicy(policy)}
          >
            {policy.name}
          </Button>
        </div>
      </TableCell>
      <TableCell className="w-[20%] truncate">
        <code className="text-foreground-light text-xs">{policy.command}</code>
      </TableCell>
      <TableCell className="w-[30%] truncate">
        <div className="flex items-center gap-x-1">
          <div className="text-foreground-lighter text-sm truncate">
            {displayedRoles.slice(0, 2).map((role, i) => (
              <span key={`policy-${role}-${i}`}>
                <code className="text-foreground-light text-xs">{role}</code>
                {i < Math.min(displayedRoles.length, 2) - 1 ? ', ' : ' '}
              </span>
            ))}
          </div>
          {displayedRoles.length > 2 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <code key="policy-etc" className="text-foreground-light text-xs">
                    + {displayedRoles.length - 2} more
                  </code>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" align="center">
                {displayedRoles.join(', ')}
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </TableCell>
      <TableCell className="w-0 text-right whitespace-nowrap">
        {!isLocked && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="default" className="px-1.5" icon={<MoreVertical />} />
            </DropdownMenuTrigger>
            <DropdownMenuContent side="bottom" align="end" className="w-52">
              <DropdownMenuItem className="gap-x-2" onClick={() => onSelectEditPolicy(policy)}>
                <Edit size={14} />
                <p>Edit policy</p>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="space-x-2"
                onClick={() => {
                  const sql = generatePolicyUpdateSQL(policy)
                  aiSnap.newChat({
                    name: `Update policy ${policy.name}`,
                    open: true,
                    sqlSnippets: [sql],
                    initialInput: `Update the policy with name \"${policy.name}\" in the ${policy.schema} schema on the ${policy.table} table. It should...`,
                    suggestions: {
                      title: `I can help you make a change to the policy \"${policy.name}\" in the ${policy.schema} schema on the ${policy.table} table, here are a few example prompts to get you started:`,
                      prompts: [
                        {
                          label: 'Improve Policy',
                          description: 'Tell me how I can improve this policy...',
                        },
                        {
                          label: 'Duplicate Policy',
                          description: 'Duplicate this policy for another table...',
                        },
                        {
                          label: 'Add Conditions',
                          description: 'Add extra conditions to this policy...',
                        },
                      ],
                    },
                  })
                }}
              >
                <Edit size={14} />
                <p>Edit policy with Assistant</p>
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
        )}
      </TableCell>
    </TableRow>
  )
}
