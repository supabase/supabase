import { proxy, snapshot, useSnapshot } from 'valtio'
import { ImpersonationRole } from 'lib/role-impersonation'

export const roleImpersonationState = proxy({
  role: undefined as ImpersonationRole | undefined,
  setRole: (role: ImpersonationRole | undefined) => {
    roleImpersonationState.role = role
  },
})

export const getRoleImpersonationStateSnapshot = () => snapshot(roleImpersonationState)

export const useRoleImpersonationStateSnapshot = (options?: Parameters<typeof useSnapshot>[1]) =>
  useSnapshot(roleImpersonationState, options)

export function getImpersonatedRole() {
  return getRoleImpersonationStateSnapshot().role
}
