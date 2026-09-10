export type OAuthScope = string

export type OrganizationRole = 'owner' | 'administrator' | 'developer' | 'read_only'

export type OAuthScopeLevel = 'read' | 'write' | 'read_write'

export type OAuthScopeGroup = {
  name: string
  level: OAuthScopeLevel
  scopes: OAuthScope[]
}

export type OAuthGrantKind = 'organization_bound' | 'user_bound' | 'compatibility'

export type OAuthProjectSelectionMode = 'off' | 'optional' | 'required'

export type OAuthOrganizationRole = {
  slug: string
  name: string
  default_role: OrganizationRole
}

export type OAuthAppsAuthorizeOrganizationProject = {
  ref: string
  name: string
  role: OrganizationRole
}

export type OAuthAppGrantConfig = {
  bind_to_authorizing_user: boolean
  project_selection: OAuthProjectSelectionMode
  is_dynamic_client: boolean
}

export type OAuthAppType = 'A' | 'B' | 'C' | 'D' | 'E'

export function getOAuthAppType(config: OAuthAppGrantConfig): OAuthAppType {
  if (config.is_dynamic_client) return 'E'
  if (config.bind_to_authorizing_user) return config.project_selection === 'off' ? 'C' : 'D'
  return config.project_selection === 'off' ? 'A' : 'B'
}

export type OAuthConsentModel = {
  app_type: OAuthAppType
  grant_kind: Exclude<OAuthGrantKind, 'compatibility'>
  requires_owner: boolean
  shows_project_picker: boolean
  offers_all_projects: boolean
  implicit_project_scope: OAuthGrantProjectScope | null
}

export function getOAuthConsentModel(config: OAuthAppGrantConfig): OAuthConsentModel {
  const boundToUser = config.is_dynamic_client || config.bind_to_authorizing_user
  const selection: OAuthProjectSelectionMode = config.is_dynamic_client
    ? 'required'
    : config.project_selection

  return {
    app_type: getOAuthAppType(config),
    grant_kind: boundToUser ? 'user_bound' : 'organization_bound',
    requires_owner: !boundToUser,
    shows_project_picker: selection !== 'off',
    offers_all_projects: selection === 'optional',
    implicit_project_scope: selection === 'off' ? { target: 'all_projects' } : null,
  }
}

export type OAuthGrantProjectScope =
  | { target: 'all_projects' }
  | { target: 'selected_projects'; project_refs: string[] }

export function isAllProjectsScope(
  scope: OAuthGrantProjectScope
): scope is { target: 'all_projects' } {
  return scope.target === 'all_projects'
}

export function getScopedProjectRefs(scope: OAuthGrantProjectScope): string[] {
  return scope.target === 'selected_projects' ? scope.project_refs : []
}

export type OAuthExistingGrant = {
  kind: OAuthGrantKind
  approved_scopes: OAuthScope[] | null
  project_scope: OAuthGrantProjectScope
  created_at: string
  updated_at: string | null
}

export type OAuthAppsAuthorizeRedirect = {
  url: string
}

export type OAuthScopeValidationResult =
  | {
      scope_target: 'organization'
      role: OrganizationRole
      failed_scopes: OAuthScope[]
    }
  | {
      scope_target: 'projects'
      failures: Array<{
        ref: string
        name: string
        role: OrganizationRole
        failed_scopes: OAuthScope[]
      }>
    }

export type OAuthScopeValidationProjectFailure = Extract<
  OAuthScopeValidationResult,
  { scope_target: 'projects' }
>['failures'][number]

export type OAuthAppsAuthorizeRoleValidationFailure = {
  error_code: 'role_validation_failed'
  message: string
  validation: OAuthScopeValidationResult
}

export type OAuthAppsAuthorizeApproveResult =
  | OAuthAppsAuthorizeRedirect
  | OAuthAppsAuthorizeRoleValidationFailure

export function isRoleValidationFailure(
  result: OAuthAppsAuthorizeApproveResult
): result is OAuthAppsAuthorizeRoleValidationFailure {
  return 'error_code' in result && result.error_code === 'role_validation_failed'
}

export function getFailedProjects(
  failure: OAuthAppsAuthorizeRoleValidationFailure | null | undefined
): OAuthScopeValidationProjectFailure[] {
  if (!failure) return []
  return failure.validation.scope_target === 'projects' ? failure.validation.failures : []
}
