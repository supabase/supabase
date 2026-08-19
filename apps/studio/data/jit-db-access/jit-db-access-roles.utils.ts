export type TemporaryAccessRoleGrant = {
  role: string
  expires_at?: number
}

const MILLISECONDS_THRESHOLD = 1e12

function toExpirySeconds(expiresAt: number) {
  return expiresAt > MILLISECONDS_THRESHOLD ? expiresAt / 1000 : expiresAt
}

export function isTemporaryAccessRoleExpired(
  expiresAt: number | undefined,
  nowSeconds: number
): boolean {
  if (!expiresAt) return false
  return toExpirySeconds(expiresAt) <= nowSeconds
}

export function getNextTemporaryAccessExpirySeconds(
  grants: { user_roles?: TemporaryAccessRoleGrant[] } | undefined,
  nowSeconds: number
): number | undefined {
  if (!grants?.user_roles?.length) return

  let next: number | undefined
  for (const grant of grants.user_roles) {
    if (!grant.role || grant.expires_at == null) continue
    const expiresSeconds = toExpirySeconds(grant.expires_at)
    if (expiresSeconds <= nowSeconds) continue
    if (next == null || expiresSeconds < next) next = expiresSeconds
  }
  return next
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
