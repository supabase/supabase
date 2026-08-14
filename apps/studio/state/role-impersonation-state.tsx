import { ident, literal, safeSql } from '@supabase/pg-meta/src/pg-format'
import { useConstant } from 'common'
import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'
import { proxy, snapshot, subscribe, useSnapshot } from 'valtio'

import { CustomAccessTokenHookDetails } from '../hooks/misc/useCustomAccessTokenHookDetails'
import { executeSql } from '@/data/sql/execute-sql-mutation'
import { useLatest } from '@/hooks/misc/useLatest'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { getPostgrestClaims, ImpersonationRole } from '@/lib/role-impersonation'

type PostgrestClaims = ReturnType<typeof getPostgrestClaims>
type CustomizeAccessToken = (args: {
  schema: string
  functionName: string
  claims: PostgrestClaims
}) => Promise<unknown>

/** Calls the project's customize-access-token hook, shared by the global context and any
 *  per-instance controller so the RPC-calling logic isn't duplicated between them. */
function useCustomizeAccessToken(
  projectRef: string | undefined,
  connectionString: string | null | undefined
): CustomizeAccessToken {
  return useCallback(
    async ({ schema, functionName, claims }) => {
      const event = { user_id: claims.sub, claims, authentication_method: 'password' }

      const result = await executeSql({
        projectRef,
        connectionString,
        sql: safeSql`select ${ident(schema)}.${ident(functionName)}(${literal(JSON.stringify(event))}::jsonb) as event;`,
        queryKey: ['customize-access-token', projectRef],
      })

      return result?.result?.[0]?.event?.claims
    },
    [projectRef, connectionString]
  )
}

/** Computes the claims for a role selection, refining them through the customize-access-token
 *  hook when one is configured. Shared by `createRoleImpersonationState` (global context) and
 *  `useLocalRoleImpersonationState` (per-instance) so both resolve claims identically. */
async function resolveRoleClaims(
  projectRef: string,
  role: ImpersonationRole | undefined,
  customAccessTokenHookDetails: CustomAccessTokenHookDetails | undefined,
  customizeAccessToken: CustomizeAccessToken
): Promise<PostgrestClaims | undefined> {
  let claims = role?.type === 'postgrest' ? getPostgrestClaims(projectRef, role) : undefined

  if (customAccessTokenHookDetails?.type === 'postgres' && claims !== undefined) {
    const { schema, functionName } = customAccessTokenHookDetails
    const updatedClaims = await customizeAccessToken({ schema, functionName, claims })
    // The hook is an arbitrary user-defined Postgres function — its output can't be
    // statically typed, so we trust it wholesale here rather than partially.
    if (updatedClaims) claims = updatedClaims as PostgrestClaims
  }

  return claims
}

export function createRoleImpersonationState(
  projectRef: string,
  customizeAccessTokenRef: { current: CustomizeAccessToken }
) {
  const roleImpersonationState = proxy({
    projectRef,
    role: undefined as ImpersonationRole | undefined,
    claims: undefined as PostgrestClaims | undefined,

    setRole: async (
      role: ImpersonationRole | undefined,
      customAccessTokenHookDetails?: CustomAccessTokenHookDetails
    ) => {
      const claims = await resolveRoleClaims(
        projectRef,
        role,
        customAccessTokenHookDetails,
        customizeAccessTokenRef.current
      )

      roleImpersonationState.role = role
      if (claims) {
        roleImpersonationState.claims = claims
      }
    },
  })

  return roleImpersonationState
}

export type RoleImpersonationState = ReturnType<typeof createRoleImpersonationState>

/**
 * The subset of `RoleImpersonationState` a role-picker UI needs: the current selection, its
 * resolved claims, and the setter. Satisfied by both the shared project-wide context (via
 * `useRoleImpersonationStateSnapshot`) and `useLocalRoleImpersonationState`, so role-picking
 * components can work against either without knowing which one they got.
 */
export type RoleImpersonationController = Pick<RoleImpersonationState, 'role' | 'claims' | 'setRole'>

export const RoleImpersonationStateContext = createContext<RoleImpersonationState>(
  createRoleImpersonationState('', { current: async () => undefined })
)

export const RoleImpersonationStateContextProvider = ({ children }: PropsWithChildren) => {
  const { data: project } = useSelectedProjectQuery()
  const customizeAccessToken = useCustomizeAccessToken(project?.ref, project?.connectionString)
  const customizeAccessTokenRef = useLatest(customizeAccessToken)

  const state = useConstant(() =>
    createRoleImpersonationState(project?.ref ?? '', customizeAccessTokenRef)
  )

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

/**
 * A role impersonation controller scoped to a single component instance instead of the
 * shared project-wide context — for surfaces (e.g. a notebook query cell) that need their
 * own independent "run as" selection rather than sharing the one global impersonation state.
 */
export function useLocalRoleImpersonationState(): RoleImpersonationController {
  const { data: project } = useSelectedProjectQuery()
  const customizeAccessToken = useCustomizeAccessToken(project?.ref, project?.connectionString)
  const customizeAccessTokenRef = useLatest(customizeAccessToken)
  const projectRef = project?.ref ?? ''

  const [role, setRoleValue] = useState<ImpersonationRole | undefined>(undefined)
  const [claims, setClaims] = useState<PostgrestClaims | undefined>(undefined)

  const setRole = useCallback(
    async (
      nextRole: ImpersonationRole | undefined,
      customAccessTokenHookDetails?: CustomAccessTokenHookDetails
    ) => {
      const nextClaims = await resolveRoleClaims(
        projectRef,
        nextRole,
        customAccessTokenHookDetails,
        customizeAccessTokenRef.current
      )

      setRoleValue(nextRole)
      if (nextClaims) setClaims(nextClaims)
    },
    [projectRef, customizeAccessTokenRef]
  )

  return { role, claims, setRole }
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

export const useIsImpersonatingAnon = () => {
  const state = useRoleImpersonationStateSnapshot()
  return state.role?.type === 'postgrest' && state.role.role === 'anon'
}

export const useImpersonatedUser = () => {
  const state = useRoleImpersonationStateSnapshot()
  return state.role?.type === 'postgrest' &&
    state.role.role === 'authenticated' &&
    state.role.userType === 'native'
    ? state.role.user
    : undefined
}

export const useImpersonatedExternalAuth = () => {
  const state = useRoleImpersonationStateSnapshot()
  return state.role?.type === 'postgrest' &&
    state.role.role === 'authenticated' &&
    state.role.userType === 'external' &&
    state.role.externalAuth
    ? state.role.externalAuth.sub
    : undefined
}

export const useImpersonatedAAL = () => {
  const state = useRoleImpersonationStateSnapshot()
  return (
    state.role?.type === 'postgrest' &&
    state.role.role === 'authenticated' &&
    state.role.userType === 'external' &&
    state.role.aal
  )
}
