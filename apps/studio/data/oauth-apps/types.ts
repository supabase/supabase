import type { components } from 'api-types'

import type { OrganizationRole } from '@/data/organization-members/organization-roles-query'

type LiveAuthorizeRequest = components['schemas']['GetOAuthAuthorizationResponse_Output']

export type OAuthAppsAuthorizeLiveFields = Pick<
  LiveAuthorizeRequest,
  'name' | 'website' | 'domain' | 'icon' | 'redirect_uri' | 'registration_type' | 'expires_at'
>

export type OAuthScope = NonNullable<LiveAuthorizeRequest['scopes']>[number]

export function isWriteScope(scope: string): boolean {
  return scope.endsWith(':write')
}

export type OAuthGrantKind = 'organization_bound' | 'member_bound'

export type OAuthAppsAuthorizeRequest = OAuthAppsAuthorizeLiveFields & {
  app_id: string
  grant_kind: OAuthGrantKind
  project_scoping_mode: boolean
  scopes?: string[]
  databaseAccess?: {
    role: string
    mode: 'read' | 'write'
    projectIssues?: Partial<
      Record<
        string,
        'postgres_upgrade_required' | 'ssl_enforcement_required' | 'project_unavailable'
      >
    >
  }
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
  grant_id: string
  approved_scopes: string[] | null
  databaseAccessMode?: 'read' | 'write'
  project_refs: string[] | null
  approved_at: string
}

export type OAuthOrgAppDetails = {
  existing_grant: OAuthExistingGrant | null
}

export type OAuthAppsAuthorizeRedirect =
  components['schemas']['ApproveAuthorizationResponse_Output']

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

export type OAuthAppsAuthorizeRoleValidationFailure = {
  status: 'error'
  error_code: 'role_validation_failed'
  message: string
  validation: OAuthScopeValidationResult
}

export type OAuthAppsAuthorizeApproveResult = OAuthAppsAuthorizeRedirect

export type OAuthAppsAuthorizePreflightResult = {
  existing_grant: OAuthExistingGrant | null
  validation_failure: {
    failed_scopes: string[]
    role: {
      name: 'owner' | 'administrator' | 'developer' | 'read-only' | 'no-access'
    }
    scope_target: 'all_projects'
  } | null
}

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
