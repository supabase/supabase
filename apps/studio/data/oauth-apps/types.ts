import { OAuthAppsAuthorizeRequestData } from './oauth-apps-authorize-request-query'

export type OAuthScope = NonNullable<OAuthAppsAuthorizeRequestData['scopes']>[number]

export type OAuthValidationRole = {
  name: 'owner' | 'administrator' | 'developer' | 'read-only' | 'no-access'
}

export type OAuthScopeValidationResult =
  | {
      scope_target: 'organization'
      role: OAuthValidationRole
    }
  | {
      scope_target: 'all_projects'
      role: OAuthValidationRole
      failed_scopes: string[]
    }
  | {
      scope_target: 'projects'
      failures: Array<{
        ref: string
        role: OAuthValidationRole
        failed_scopes: string[]
      }>
    }

type OAuthAppsAuthorizeRoleValidationFailure = {
  status: 'error'
  error_code: 'role_validation_failed'
  message: string
  validation: OAuthScopeValidationResult
}

// fetch rejects with a OAuthRoleValidationException
export function isOAuthRoleValidationError(
  err: unknown
): err is OAuthAppsAuthorizeRoleValidationFailure {
  return (
    typeof err === 'object' &&
    err !== null &&
    'error_code' in err &&
    err.error_code === 'role_validation_failed'
  )
}
