import { useState } from 'react'
import { Button, PopoverContent_Shadcn_, PopoverTrigger_Shadcn_, Popover_Shadcn_, cn } from 'ui'

import type { User } from 'data/auth/users-query'
import { ChevronDown, User as IconUser } from 'lucide-react'
import { useRoleImpersonationStateSnapshot } from 'state/role-impersonation-state'
import RoleImpersonationSelector from './RoleImpersonationSelector'
import { getAvatarUrl, getDisplayName } from '../Auth/Users/Users.utils'

export interface RoleImpersonationPopoverProps {
  serviceRoleLabel?: string
  variant?: 'regular' | 'connected-on-right' | 'connected-on-left' | 'connected-on-both'
  align?: 'center' | 'start' | 'end'
}

const RoleImpersonationPopover = ({
  serviceRoleLabel,
  variant = 'regular',
  align = 'end',
}: RoleImpersonationPopoverProps) => {
  const state = useRoleImpersonationStateSnapshot()

  const [isOpen, setIsOpen] = useState(false)

  const currentRole = state.role?.role ?? serviceRoleLabel ?? 'service role'

  return (
    <Popover_Shadcn_ open={isOpen} onOpenChange={setIsOpen} modal={false}>
      <PopoverTrigger_Shadcn_ asChild>
        <Button
          size="tiny"
          type="default"
          className={cn(
            'h-[26px] pr-3 gap-0',
            variant === 'connected-on-right' && 'rounded-r-none border-r-0',
            variant === 'connected-on-left' && 'rounded-l-none border-l-0',
            variant === 'connected-on-both' && 'rounded-none border-x-0'
          )}
        >
          <div className="flex items-center gap-1">
            <span className="text-foreground-muted">role</span>
            <span>{currentRole}</span>
            {state.role?.type === 'postgrest' && state.role.role === 'authenticated' && (
              <>
                <UserRoleButtonSection user={state.role.user} />
                <span className="text-xs text-foreground-lighter font-light">
                  {state.role.aal === 'aal2' ? 'AAL2' : 'AAL1'}
                </span>
              </>
            )}
            <ChevronDown className="text-muted" strokeWidth={1} size={12} />
          </div>
        </Button>
      </PopoverTrigger_Shadcn_>
      <PopoverContent_Shadcn_ className="p-0 w-full overflow-hidden" side="bottom" align={align}>
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
    <div className="flex gap-1 items-center pl-0.5 pr-1.5 h-[21px] bg-surface-200 rounded-full overflow-hidden">
      {avatarUrl ? (
        <img className="rounded-full w-[18px] h-[18px]" src={avatarUrl} alt={displayName} />
      ) : (
        <div className="rounded-full w-[18px] h-[18px] bg-surface-100 border flex items-center justify-center text-light">
          <IconUser size={12} strokeWidth={2} />
        </div>
      )}
      <span className="truncate max-w-[84px]">{displayName}</span>
    </div>
  )
}
