export type TemporaryAccessRoleGrant = {
  role: string
  expires_at?: number
}

const MILLISECONDS_THRESHOLD = 1e12

export function isTemporaryAccessRoleExpired(
  expiresAt: number | undefined,
  nowSeconds: number
): boolean {
  if (!expiresAt) return false
  const expiresSeconds = expiresAt > MILLISECONDS_THRESHOLD ? expiresAt / 1000 : expiresAt
  return expiresSeconds <= nowSeconds
}

export function getActiveTemporaryAccessRoles(
  grants: { user_roles?: TemporaryAccessRoleGrant[] } | undefined,
  nowSeconds: number
): string[] {
  if (!grants?.user_roles?.length) return []

  const roles = grants.user_roles
    .filter((grant) => grant.role && !isTemporaryAccessRoleExpired(grant.expires_at, nowSeconds))
    .map((grant) => grant.role)

  return [...new Set(roles)]
}
