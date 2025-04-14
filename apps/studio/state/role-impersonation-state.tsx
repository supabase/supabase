import { PropsWithChildren, createContext, useCallback, useContext, useEffect } from 'react'
import { proxy, snapshot, subscribe, useSnapshot } from 'valtio'

import { useConstant } from 'common'
import useLatest from 'hooks/misc/useLatest'
import { getPostgrestClaims, ImpersonationRole } from 'lib/role-impersonation'

export function createRoleImpersonationState(projectRef: string) {
  const roleImpersonationState = proxy({
    projectRef,
    role: undefined as ImpersonationRole | undefined,
    claims: undefined as ReturnType<typeof getPostgrestClaims> | undefined,

    setRole: (role: ImpersonationRole | undefined) => {
      roleImpersonationState.role = role

      if (role?.type === 'postgrest') {
        roleImpersonationState.claims = getPostgrestClaims(projectRef, role)
      }
    },
  })

  return roleImpersonationState
}

export type RoleImpersonationState = ReturnType<typeof createRoleImpersonationState>

export const RoleImpersonationStateContext = createContext<RoleImpersonationState>(
  createRoleImpersonationState('')
)

export const RoleImpersonationStateContextProvider = ({
  projectRef,
  children,
}: PropsWithChildren<{ projectRef?: string }>) => {
  const state = useConstant(() => createRoleImpersonationState(projectRef ?? ''))

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

export function useGetImpersonatedRoleState() {
  const roleImpersonationState = useContext(RoleImpersonationStateContext)

  return useCallback(
    // [Alaister]: typeof roleImpersonationState is needed to avoid readonly type errors everywhere
    () => snapshot(roleImpersonationState) as typeof roleImpersonationState,
    [roleImpersonationState]
  )
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
