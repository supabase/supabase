import { DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger } from 'ui'

import { RoleImpersonationSelector } from '@/components/interfaces/RoleImpersonationSelector'
import { useRoleImpersonationStateSnapshot } from '@/state/role-impersonation-state'

const SERVICE_ROLE_LABEL = 'postgres'

export const RunAsSubMenu = () => {
  const state = useRoleImpersonationStateSnapshot()
  const currentRole = state.role?.role ?? SERVICE_ROLE_LABEL

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
        <div className="flex flex-col">
          <span>Run as</span>
          <span className="text-foreground-lighter text-xs">{currentRole}</span>
        </div>
      </DropdownMenuSubTrigger>
      {/* Stops propagation so the authenticated-user search input isn't swallowed by the
      dropdown's typeahead. */}
      <DropdownMenuSubContent className="w-80 p-0" onKeyDown={(e) => e.stopPropagation()}>
        <RoleImpersonationSelector
          header="Run SQL query as a role"
          serviceRoleLabel={SERVICE_ROLE_LABEL}
          orientation="vertical"
        />
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  )
}
