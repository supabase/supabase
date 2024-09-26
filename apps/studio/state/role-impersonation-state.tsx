import { PropsWithChildren, createContext, useCallback, useContext, useEffect } from 'react'
import { proxy, snapshot, subscribe, useSnapshot } from 'valtio'

import { useConstant } from 'common'
import useLatest from 'hooks/misc/useLatest'
import { ImpersonationRole } from 'lib/role-impersonation'

export function createRoleImpersonationState() {
  const roleImpersonationState = proxy({
    role: undefined as ImpersonationRole | undefined,
    setRole: (role: ImpersonationRole | undefined) => {
      roleImpersonationState.role = role
    },
  })

  return roleImpersonationState
}

export type RoleImpersonationState = ReturnType<typeof createRoleImpersonationState>

export const RoleImpersonationStateContext = createContext<RoleImpersonationState>(
  createRoleImpersonationState()
)

export const RoleImpersonationStateContextProvider = ({ children }: PropsWithChildren) => {
  const state = useConstant(createRoleImpersonationState)

  return (
    <RoleImpersonationStateContext.Provider value={state}>
      {children}
    </RoleImpersonationStateContext.Provider>
  )
}

export function useRoleImpersonationStateSnapshot(options?: Parameters<typeof useSnapshot>[1]) {
  const roleImpersonationState = useContext(RoleImpersonationStateContext)

  return useSnapshot(roleImpersonationState, options)
}

export function useGetImpersonatedRole() {
  const roleImpersonationState = useContext(RoleImpersonationStateContext)

  return useCallback(() => snapshot(roleImpersonationState).role, [roleImpersonationState])
}

export function useSubscribeToImpersonatedRole(
  onChange: (role: ImpersonationRole | undefined) => void
) {
  const roleImpersonationState = useContext(RoleImpersonationStateContext)
  const onChangeRef = useLatest(onChange)

  useEffect(() => {
    return subscribe(roleImpersonationState, () => {
      onChangeRef.current(snapshot(roleImpersonationState).role)
    })
  }, [roleImpersonationState])
}

export function isRoleImpersonationEnabled(impersonationRole?: ImpersonationRole) {
  return impersonationRole?.type === 'postgrest'
}

export function useIsRoleImpersonationEnabled() {
  return isRoleImpersonationEnabled(useRoleImpersonationStateSnapshot().role)
}
