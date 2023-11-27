import { useState } from 'react'
import {
  Button,
  IconChevronDown,
  IconUser,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  Popover_Shadcn_,
  cn,
} from 'ui'

import { User } from 'data/auth/users-query'
import { useRoleImpersonationStateSnapshot } from 'state/role-impersonation-state'
import { getAvatarUrl, getDisplayName } from '../Auth/Users/UserListItem.utils'
import RoleImpersonationSelector from './RoleImpersonationSelector'

export interface RoleImpersonationPopoverProps {
  serviceRoleLabel?: string
  variant?: 'regular' | 'connected-on-right'
}

const RoleImpersonationPopover = ({
  serviceRoleLabel,
  variant = 'regular',
}: RoleImpersonationPopoverProps) => {
  const state = useRoleImpersonationStateSnapshot()

  const [isOpen, setIsOpen] = useState(false)

  const currentRole = state.role?.role ?? serviceRoleLabel ?? 'service role'

  return (
    <Popover_Shadcn_ open={isOpen} onOpenChange={setIsOpen} modal={false}>
      <PopoverTrigger_Shadcn_ asChild>
        <Button
          size="tiny"
          type="outline"
          iconRight={<IconChevronDown />}
          className={cn(variant === 'connected-on-right' && 'rounded-r-none border-r-0')}
        >
          <div className="flex items-center gap-1">
            <span className="text-foreground-light">role:</span>
            <span>{currentRole}</span>

            {state.role?.type === 'postgrest' && state.role.role === 'authenticated' && (
              <UserRoleButtonSection user={state.role.user} />
            )}
          </div>
        </Button>
      </PopoverTrigger_Shadcn_>
      <PopoverContent_Shadcn_
        className="p-5 w-full overflow-hidden bg-background"
        side="bottom"
        align="end"
      >
        <RoleImpersonationSelector serviceRoleLabel={serviceRoleLabel} />
      </PopoverContent_Shadcn_>
    </Popover_Shadcn_>
  )
}

export default RoleImpersonationPopover

const UserRoleButtonSection = ({ user }: { user: User }) => {
  const avatarUrl = getAvatarUrl(user)
  const displayName = getDisplayName(user, user.email ?? user.phone ?? user.id ?? 'Unknown')

  return (
    <div className="flex gap-1 pr-1.5 bg-background-surface-300 rounded-full overflow-hidden">
      {avatarUrl ? (
        <img className="rounded-full w-4 h-4" src={avatarUrl} alt={displayName} />
      ) : (
        <div className="rounded-full w-4 h-4 bg-foreground-lighter flex items-center justify-center text-background">
          <IconUser size={12} strokeWidth={2} />
        </div>
      )}
      <span className="truncate max-w-[84px]">{displayName}</span>
    </div>
  )
}
