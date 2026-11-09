export type FunctionExecutePrivileges = {
  anon: boolean
  authenticated: boolean
  serviceRole: boolean
}

export type FunctionPublicAccessKind = 'anyone' | 'signed-in' | 'service-role-only' | 'none'

export const getFunctionExecutePrivileges = (fn: {
  anon_execute?: boolean
  authenticated_execute?: boolean
  service_role_execute?: boolean
}): FunctionExecutePrivileges => ({
  anon: fn.anon_execute === true,
  authenticated: fn.authenticated_execute === true,
  serviceRole: fn.service_role_execute === true,
})

export const getFunctionPublicAccessKind = (
  privileges: FunctionExecutePrivileges
): FunctionPublicAccessKind => {
  if (privileges.anon) return 'anyone'
  if (privileges.authenticated) return 'signed-in'
  if (privileges.serviceRole) return 'service-role-only'
  return 'none'
}

export const isFunctionCallableByAnyone = (privileges: FunctionExecutePrivileges): boolean =>
  privileges.anon

export const canRevokePublicFunctionAccess = (privileges: FunctionExecutePrivileges): boolean =>
  privileges.anon || privileges.authenticated
