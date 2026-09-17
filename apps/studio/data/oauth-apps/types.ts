import type { components } from 'api-types'

/**
 * The live authorization request contract, already called from
 * `data/api-authorization`. Every field this folder can derive from it is
 * derived rather than hand-written, so `pnpm api:codegen` fails the build when
 * the backend contract moves instead of letting this folder drift silently.
 */
type LiveAuthorizeRequest = components['schemas']['GetOAuthAuthorizationResponse_Output']

export type OAuthAppRegistrationType = LiveAuthorizeRequest['registration_type']

/**
 * Fields the live authorize endpoint already returns today.
 *
 * `domain` currently stands in for the publisher display name the design shows
 * ("Vercel Inc."), derived from the app's callback URL in the fixtures. The live
 * contract has no human publisher name; revisit when the real backend lands.
 */
export type OAuthAppsAuthorizeLiveFields = Pick<
  LiveAuthorizeRequest,
  'name' | 'website' | 'domain' | 'icon' | 'redirect_uri' | 'registration_type' | 'expires_at'
>

/**
 * The coarse `resource:action` scopes the live endpoint returns, e.g.
 * `database:read`. Kept for the compatibility path — grants authorized before
 * project controls carry this vocabulary.
 */
export type OAuthLiveScope = NonNullable<LiveAuthorizeRequest['scopes']>[number]

/**
 * PROVISIONAL — a single scope in the new grant model, e.g. `sql_snippets`.
 *
 * Deliberately an opaque string: the RFC vocabulary is finer-grained than
 * `OAuthLiveScope` and is not published yet. Do not confuse this with
 * `OAuthScope` from `@supabase/shared-types/out/constants`, which is the live
 * coarse enum that `data/api-authorization` consumes.
 */
export type OAuthScopeString = string

/**
 * PROVISIONAL — the role names the grant model reasons about.
 *
 * The platform API models roles as numeric ids with server-supplied names
 * (`OrganizationRole` in `data/organization-members/organization-roles-query`),
 * and organizations can define custom roles, so this closed union only holds
 * for the default roles. Replace it with the generated role type once the RFC
 * settles whether role even belongs in the grant contract.
 */
export type OAuthOrganizationRoleName = 'owner' | 'administrator' | 'developer' | 'read_only'

export type OAuthScopeLevel = 'read' | 'write' | 'read_write'

export type OAuthScopeGroup = {
  name: string
  level: OAuthScopeLevel
  scopes: OAuthScopeString[]
}

export type OAuthGrantKind = 'organization_bound' | 'user_bound' | 'compatibility'

export type OAuthProjectSelectionMode = 'off' | 'optional' | 'required'

export type OAuthOrganizationRole = {
  slug: string
  name: string
  default_role: OAuthOrganizationRoleName
}

export type OAuthAppsAuthorizeOrganizationProject = {
  ref: string
  name: string
  role: OAuthOrganizationRoleName
}

/**
 * PROVISIONAL — mirrors the app author settings panel; the backend contract is
 * not published yet.
 *
 * Dynamic-client-ness is deliberately absent: it arrives on the live response
 * as `registration_type`, so it is read from there rather than mirrored here.
 */
export type OAuthAppGrantConfig = {
  bind_to_authorizing_user: boolean
  project_selection: OAuthProjectSelectionMode
}

export type OAuthConsentModel = {
  grant_kind: Exclude<OAuthGrantKind, 'compatibility'>
  project_selection: OAuthProjectSelectionMode
}

export function getOAuthConsentModel({
  grantConfig,
  registrationType,
}: {
  grantConfig: OAuthAppGrantConfig
  registrationType: OAuthAppRegistrationType
}): OAuthConsentModel {
  const isDynamicClient = registrationType === 'dynamic'
  const isBoundToUser = isDynamicClient || grantConfig.bind_to_authorizing_user

  return {
    grant_kind: isBoundToUser ? 'user_bound' : 'organization_bound',
    project_selection: isDynamicClient ? 'required' : grantConfig.project_selection,
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
  approved_scopes: OAuthScopeString[] | null
  project_scope: OAuthGrantProjectScope
  created_at: string
  updated_at: string | null
}

/**
 * PROVISIONAL — a row in the org settings "Authorized apps" table.
 *
 * No endpoint serves this yet. `GET /platform/organizations/{slug}/oauth/apps`
 * with `type=authorized` returns identity and timestamps only — no status, no
 * grant counts — so every field below the identity block is an RFC addition.
 */
export type OAuthAuthorizedApp = {
  id: string
  client_id: string
  name: string
  icon: string | null
  status: OAuthAuthorizedAppStatus
  member_grant_count: number
  org_owned_compatibility_grant_count: number
}

/**
 * PROVISIONAL — `legacy` is a grant authorized before project controls existed,
 * i.e. backed by `OAuthGrantKind: 'compatibility'`. Revoked rows stay in the
 * table, so this cannot be derived from a row's absence.
 */
export type OAuthAuthorizedAppStatus = 'active' | 'revoked' | 'legacy'

/**
 * PROVISIONAL — one member's grant for an app, as listed in the "Member grants"
 * dialog. The live contract has no per-member view at all.
 */
export type OAuthAppMemberGrant = {
  member_email: string
  project_scope: OAuthGrantProjectScope
  scope_groups: OAuthScopeGroup[]
  created_at: string
}

/**
 * The dialog's meta line counts individual scopes, not groups — a grant showing
 * "14 permissions" may hold only two groups.
 */
export function getMemberGrantPermissionCount(grant: OAuthAppMemberGrant): number {
  return grant.scope_groups.reduce((total, scopeGroup) => total + scopeGroup.scopes.length, 0)
}

export function getMemberGrantScopeGroupsByLevel(
  grant: OAuthAppMemberGrant,
  level: OAuthScopeLevel
): OAuthScopeGroup[] {
  return grant.scope_groups.filter((scopeGroup) => scopeGroup.level === level)
}

export type OAuthAppsAuthorizeRedirect =
  components['schemas']['ApproveAuthorizationResponse_Output']

export type OAuthScopeValidationResult =
  | {
      scope_target: 'organization'
      role: OAuthOrganizationRoleName
      failed_scopes: OAuthScopeString[]
    }
  | {
      scope_target: 'projects'
      failures: Array<{
        ref: string
        name: string
        role: OAuthOrganizationRoleName
        failed_scopes: OAuthScopeString[]
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
