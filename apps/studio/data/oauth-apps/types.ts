import type { components } from 'api-types'

import type { OrganizationRole } from '@/data/organization-members/organization-roles-query'

type LiveAuthorizeRequest = components['schemas']['GetOAuthAuthorizationResponse_Output']

export type OAuthAppsAuthorizeLiveFields = Pick<
  LiveAuthorizeRequest,
  'name' | 'website' | 'domain' | 'icon' | 'redirect_uri' | 'registration_type' | 'expires_at'
>

export type OAuthScope = NonNullable<LiveAuthorizeRequest['scopes']>[number]

export function isWriteScope(scope: OAuthScope): boolean {
  return scope.endsWith(':write')
}

export type OAuthGrantKind = 'organization_bound' | 'member_bound'

export type OAuthAppsAuthorizeRequest = OAuthAppsAuthorizeLiveFields & {
  app_id: string
  app_name: string
  grant_kind: OAuthGrantKind
  project_scoping_mode: boolean
  scopes: OAuthScope[]
}

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

export type OAuthExistingGrant = {
  approved_scopes: OAuthScope[] | null
  project_refs: string[]
  approved_at: string
}

export type OAuthOrgAppDetails = {
  existing_grant: OAuthExistingGrant | null
}

export function getPreselectedProjectRefs({
  existingGrant,
  projectRef,
  liveProjects,
}: {
  existingGrant: OAuthExistingGrant | null
  projectRef: string | null
  liveProjects: OAuthAppsAuthorizeOrganizationProject[]
}): string[] {
  const liveRefs = new Set(liveProjects.map((project) => project.ref))
  const candidates = existingGrant?.project_refs.length
    ? existingGrant.project_refs
    : projectRef
      ? [projectRef]
      : []
  return candidates.filter((ref) => liveRefs.has(ref))
}

export type OAuthAuthorizeApproveRequest = {
  // not allowed when project_scoping_mode is false.
  // when project_scoping_mode is true, if omitted, this means all projects
  project_refs?: string[]
}

export type OAuthAppsAuthorizeRedirect =
  components['schemas']['ApproveAuthorizationResponse_Output']

export type OAuthScopeValidationResult =
  | {
      scope_target: 'organization'
      role: OrganizationRole
    }
  | {
      scope_target: 'all_projects'
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

export type OAuthAppsAuthorizePreflightSuccess = { ok: true }

export type OAuthAppsAuthorizePreflightResult =
  | OAuthAppsAuthorizePreflightSuccess
  | OAuthAppsAuthorizeRoleValidationFailure

export function isPreflightValidationFailure(
  result: OAuthAppsAuthorizePreflightResult
): result is OAuthAppsAuthorizeRoleValidationFailure {
  return 'error_code' in result && result.error_code === 'role_validation_failed'
}

export type OAuthApprovalItem = {
  id: string
  name: string
  icon: string | null
  org_grant: {
    grant_id: string
    approved_scopes: string[]
    approved_at: string
  } | null
}

export type ListOAuthApprovalsResponse = {
  data: OAuthApprovalItem[]
  pagination: { next_cursor: string | null }
}

export type OAuthGrantProject = {
  ref: string
  name: string
}

export type OAuthGrantItem = {
  grant_id: string
  kind: OAuthGrantKind
  user: { gotrue_id: string; email: string; avatar_url?: string } | null
  projects: OAuthGrantProject[] | null
  approved_scopes: string[]
  approved_at: string
}

export type ListOrgAppGrantsResponse = {
  data: OAuthGrantItem[]
  pagination: { next_cursor: string | null }
}

export type MemberOauthGrantItem = {
  grant_id: string
  app: { id: string; name: string; icon: string | null }
  organization: { slug: string; name: string }
  projects: OAuthGrantProject[] | null
  approved_scopes: string[]
  approved_at: string
}

export type ListOwnGrantsResponse = {
  data: MemberOauthGrantItem[]
  pagination: { next_cursor: string | null }
}
