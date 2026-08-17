import { DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger } from 'ui'

import { RoleImpersonationSelectorInterface } from '@/components/interfaces/RoleImpersonationSelector'
import {
  useRoleImpersonationStateSnapshot,
  type RoleImpersonationController,
} from '@/state/role-impersonation-state'

const SERVICE_ROLE_LABEL = 'postgres'

type RunAsSubMenuProps =
  | {
      controlled?: false
    }
  | {
      controlled: true
      state: RoleImpersonationController
    }

export const RunAsSubMenu = (props: RunAsSubMenuProps) => {
  const globalState = useRoleImpersonationStateSnapshot() as unknown as RoleImpersonationController
  const state = props.controlled ? props.state : globalState
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
        <RoleImpersonationSelectorInterface
          orientation="vertical"
          header="Run SQL query as a role"
          serviceRoleLabel={SERVICE_ROLE_LABEL}
          state={state}
        />
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  )
}
