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

/** PROVISIONAL — mirrors the app author settings panel; the backend contract is not published yet. */
export type OAuthAppGrantConfig = {
  bind_to_authorizing_user: boolean
  project_selection: OAuthProjectSelectionMode
  is_dynamic_client: boolean
}

export type OAuthConsentModel = {
  grant_kind: Exclude<OAuthGrantKind, 'compatibility'>
  project_selection: OAuthProjectSelectionMode
}

export function getOAuthConsentModel(config: OAuthAppGrantConfig): OAuthConsentModel {
  const boundToUser = config.is_dynamic_client || config.bind_to_authorizing_user

  return {
    grant_kind: boundToUser ? 'user_bound' : 'organization_bound',
    project_selection: config.is_dynamic_client ? 'required' : config.project_selection,
  }
}

/** PROVISIONAL — replaces a flat `project_refs`; not yet agreed with the backend. */
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

export function getPreselectedProjectRefs({
  existingGrant,
  suggestedRefs,
  liveProjects,
  max = 10,
}: {
  existingGrant: OAuthExistingGrant | null
  suggestedRefs: string[]
  liveProjects: OAuthAppsAuthorizeOrganizationProject[]
  max?: number
}): string[] {
  if (liveProjects.length === 0) return []
  if (existingGrant && isAllProjectsScope(existingGrant.project_scope)) return []

  const liveRefs = new Set(liveProjects.map((project) => project.ref))
  const grantRefs = existingGrant ? getScopedProjectRefs(existingGrant.project_scope) : []

  const preselected: string[] = []
  for (const ref of [...grantRefs, ...suggestedRefs]) {
    if (!liveRefs.has(ref) || preselected.includes(ref)) continue
    preselected.push(ref)
    if (preselected.length >= max) break
  }
  return preselected
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

/** PROVISIONAL — mirrors the agreed Slack contract; exact JSON still to be published. */
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
