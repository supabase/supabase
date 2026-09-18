import type { components } from 'api-types'

import type { OrganizationRole } from '@/data/organization-members/organization-roles-query'

type LiveAuthorizeRequest = components['schemas']['GetOAuthAuthorizationResponse_Output']

export type OAuthAppsAuthorizeLiveFields = Pick<
  LiveAuthorizeRequest,
  'name' | 'website' | 'domain' | 'icon' | 'redirect_uri' | 'registration_type' | 'expires_at'
>

// TODO(rfc): RFC has one OAuthScope type; confirm the vocabulary is unchanged from the live coarse enum.
export type OAuthScope = NonNullable<LiveAuthorizeRequest['scopes']>[number]

export type OAuthScopeLevel = 'read' | 'write' | 'read_write'

// TODO(rfc): OAuthScopeGroup is referenced but undefined in the RFC; shape below is our guess and drives the scope badges.
export type OAuthScopeGroup = {
  name: string
  level: OAuthScopeLevel
  scopes: OAuthScope[]
}

export type OAuthGrantKind = 'organization_bound' | 'member_bound'

export type OAuthProjectScopingMode = 'off' | 'optional' | 'required'

export type OAuthAppsAuthorizeRequest = OAuthAppsAuthorizeLiveFields & {
  app_id: string
  // TODO(rfc): confirm whether app_name supersedes the live name field.
  app_name: string
  grant_kind: OAuthGrantKind
  project_scoping_mode: OAuthProjectScopingMode
  allow_partial_grants: boolean
  scopes: OAuthScopeGroup[]
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
  // TODO(rfc): non-nullable here but OAuthGrantItem uses null for "all projects"; confirm how an all-projects grant is represented.
  project_refs: string[]
  approved_at: string
}

export type OAuthBlockedReason = 'org_requires_project_scoping' | 'app_blocked_for_organization'

export type OAuthOrgAppDetails = {
  organization_settings: { require_project_scoping: boolean }
  blocked_reason: OAuthBlockedReason | null
  existing_grant: OAuthExistingGrant | null
}

export type OAuthOrgScopeCheck = {
  role: OrganizationRole
  failed_scopes: OAuthScope[]
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
  project_refs?: string[]
}

export type OAuthAppsAuthorizeRedirect =
  components['schemas']['ApproveAuthorizationResponse_Output']

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

export type OAuthAppOverviewItem = {
  id: string
  name: string
  icon: string | null
  status: 'active' | 'legacy'
  // TODO(rfc): may become string ("50+"); RFC undecided.
  member_grant_count: number
  last_used_at: string | null
  org_grant: {
    grant_id: string
    approved_scopes: string[]
    approved_at: string
    last_used_at: string | null
  } | null
}

export type ListOAuthAppsOverviewResponse = {
  data: OAuthAppOverviewItem[]
  pagination: { next_cursor: string | null }
}

export type OAuthBlockedAppItem = {
  app_id: string
  name: string
  icon: string | null
  blocked_at: string
  blocked_by: { gotrue_id: string; email: string }
}

export type ListBlockedAppsResponse = {
  data: OAuthBlockedAppItem[]
  pagination: { next_cursor: string | null }
}

export type OAuthGrantItem = {
  grant_id: string
  kind: OAuthGrantKind
  user: { gotrue_id: string; email: string; avatar_url?: string } | null
  project_refs: string[] | null
  approved_scopes: string[]
  approved_at: string
  last_used_at: string | null
}

export type ListAppGrantsResponse = {
  data: OAuthGrantItem[]
  pagination: { next_cursor: string | null }
}

export type MemberOauthGrantItem = {
  grant_id: string
  app: { id: string; name: string; icon: string | null }
  organization: { slug: string; name: string }
  project_refs: string[] | null
  approved_scopes: string[]
  approved_at: string
  last_used_at: string | null
  access_affected: boolean
  access_affected_reason: 'role_below_granted_scopes' | 'project_access_revoked' | null
}

export type ListOwnGrantsResponse = {
  data: MemberOauthGrantItem[]
  pagination: { next_cursor: string | null }
}

export type OAuthOrganizationSettings = { require_project_scoping: boolean }

export type OAuthOrganizationSettingsUpdate = { require_project_scoping: boolean }
