import type { OAuthOrganizationRole, OAuthScopeLevel } from '@/data/oauth-apps/types'

// Role capability is binary for now: a "Read-only" role can't satisfy write scopes, and every
// other role (Developer, Owner, ...) is assumed to satisfy whatever the app requests.
export function isScopeGroupOverRole(
  level: OAuthScopeLevel,
  role: OAuthOrganizationRole['role']
): boolean {
  return role === 'Read-only' && level !== 'read'
}
