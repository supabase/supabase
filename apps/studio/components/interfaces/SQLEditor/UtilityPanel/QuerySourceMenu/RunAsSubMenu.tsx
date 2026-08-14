import { DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger } from 'ui'

import { RoleImpersonationSelectorInterface } from '@/components/interfaces/RoleImpersonationSelector'
import {
  type RoleImpersonationController,
  useRoleImpersonationStateSnapshot,
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

const orientation = 'vertical'
const header = 'Run SQL query as a role'

export const RunAsSubMenu = (props: RunAsSubMenuProps) => {
  // valtio's Snapshot<> type is deep-readonly (incl. nested arrays), which isn't
  // structurally assignable to RoleImpersonationController's plain array fields — same
  // rationale as the cast in useGetImpersonatedRoleState.
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
          orientation={orientation}
          header={header}
          serviceRoleLabel={SERVICE_ROLE_LABEL}
          state={state}
        />
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  )
}
