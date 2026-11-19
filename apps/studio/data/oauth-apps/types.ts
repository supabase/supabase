import { OAuthAppsAuthorizeRequestData } from './oauth-apps-authorize-request-query'
import type { OrganizationRole } from '@/data/organization-members/organization-roles-query'

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

export type OAuthGrantKind = 'organization_bound' | 'member_bound'

export type OAuthOrganizationRole = {
  id: string
  slug: string
  name: string
  default_role: OrganizationRole
}

export type OAuthAppsAuthorizeOrganizationProject = {
  ref: string
  name: string
  organization_id: number
  role: OrganizationRole
}

export type OAuthApprovalTarget = 'organization' | 'members' | 'organization_and_members'

export type OAuthApprovalItem = {
  id: string
  type: 'oauth_app'
  attributes: {
    app: {
      name: string
      created_by: string | null
      icon: string | null
    }
    last_approved_at: string
    target: OAuthApprovalTarget
    org_grant: {
      grant_id: string
      approved_scopes: string[]
      approved_at: string
    } | null
  }
}

export type ListOAuthApprovalsResponse = {
  data: OAuthApprovalItem[]
  links: { next: string | null }
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
