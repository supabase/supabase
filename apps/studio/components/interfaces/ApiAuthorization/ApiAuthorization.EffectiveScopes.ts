import type { OAuthScope } from '@supabase/shared-types/out/constants'

import type { ApiAuthorizationPreflightResponse } from '@/data/api-authorization/api-authorization-preflight-query'

export type EffectiveScopes =
  /** The user's role covers every requested scope. */
  | { _tag: 'full'; scopes: OAuthScope[] }
  /** Only `granted` is stored; approval must send `partial: true`. */
  | { _tag: 'partial'; granted: OAuthScope[]; denied: OAuthScope[]; roleName: string }
  /** The user's role can't authorize the app; `missing` is empty when the API doesn't list scopes. */
  | { _tag: 'blocked'; roleName: string; missing: OAuthScope[] }

interface ResolveEffectiveScopesParameters {
  requested: OAuthScope[]
  allowPartialGrants: boolean
  preflight: ApiAuthorizationPreflightResponse
}

export function resolveEffectiveScopes({
  requested,
  allowPartialGrants,
  preflight,
}: ResolveEffectiveScopesParameters): EffectiveScopes {
  const failure = preflight.validation_failure
  if (failure === null) return { _tag: 'full', scopes: requested }

  if (failure.scope_target === 'organization') {
    return { _tag: 'blocked', roleName: failure.role.name, missing: [] }
  }

  const failures =
    failure.scope_target === 'all_projects'
      ? [failure]
      : failure.failures.map(({ role, failed_scopes }) => ({ role, failed_scopes }))
  const failedScopes = new Set(failures.flatMap(({ failed_scopes }) => failed_scopes))
  const roleName = [...new Set(failures.map(({ role }) => role.name))].join(', ')

  const granted = requested.filter((scope) => !failedScopes.has(scope))
  const denied = requested.filter((scope) => failedScopes.has(scope))

  // Backend rejects partial grants that would store no scopes
  if (!allowPartialGrants || granted.length === 0) {
    return { _tag: 'blocked', roleName, missing: denied }
  }

  return { _tag: 'partial', granted, denied, roleName }
}
