import { useState } from 'react'
import { Button, PopoverContent_Shadcn_, PopoverTrigger_Shadcn_, Popover_Shadcn_ } from 'ui'

import { useRoleImpersonationStateSnapshot } from 'state/role-impersonation-state'
import { getDisplayName } from '../Auth/Users/UserListItem.utils'
import RoleImpersonationSelector from './RoleImpersonationSelector'

const RoleImpersonationPopover = () => {
  const state = useRoleImpersonationStateSnapshot()
  const isImpersonatingRole = state.role !== undefined

  const [isOpen, setIsOpen] = useState(false)

  return (
    <Popover_Shadcn_ open={isOpen} onOpenChange={setIsOpen} modal={false}>
      <PopoverTrigger_Shadcn_ asChild>
        <Button size="tiny" type={isImpersonatingRole ? 'warning' : 'outline'}>
          <div className="flex items-center gap-2">
            {state.role?.type === 'postgrest' && state.role.role === 'authenticated'
              ? `Impersonating ${getDisplayName(
                  state.role.user,
                  state.role.user.email || state.role.user.phone || state.role.user.id || 'Unknown'
                )}`
              : 'Impersonate User'}
          </div>
        </Button>
      </PopoverTrigger_Shadcn_>
      <PopoverContent_Shadcn_ className="p-0 w-64" side="bottom" align="start">
        <RoleImpersonationSelector />
      </PopoverContent_Shadcn_>
    </Popover_Shadcn_>
  )
}

export default RoleImpersonationPopover
