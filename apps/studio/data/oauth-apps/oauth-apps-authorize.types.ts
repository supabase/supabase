import type { OAuthAppsAuthorizeApproveResponse } from './oauth-apps-authorize-approve-mutation'

export type ProjectRoleFailure = {
  projectRef: string
  projectName: string
  userRole: string
  missingScopes: string[]
}

export type AuthorizeResult =
  | { status: 'success'; data: OAuthAppsAuthorizeApproveResponse }
  | { status: 'role_validation_failed'; failures: ProjectRoleFailure[] }
  | { status: 'error'; code: string; message: string }

export const isAuthorizeSuccess = (
  result: AuthorizeResult
): result is Extract<AuthorizeResult, { status: 'success' }> => result.status === 'success'

export const isRoleValidationFailure = (
  result: AuthorizeResult
): result is Extract<AuthorizeResult, { status: 'role_validation_failed' }> =>
  result.status === 'role_validation_failed'

export const isAuthorizeError = (
  result: AuthorizeResult
): result is Extract<AuthorizeResult, { status: 'error' }> => result.status === 'error'
