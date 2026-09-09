/**
 * A single OAuth scope string (e.g. `project_settings`). The registered set is a server-side
 * property of the app, so this stays an open string rather than a closed union.
 */
export type OAuthScope = string

/** A member's role, used both org-wide (`default_role`) and per project. */
export type OrganizationRole = 'owner' | 'administrator' | 'developer' | 'read_only'

export type OAuthScopeLevel = 'read' | 'write' | 'read_write'

export type OAuthScopeGroup = {
  name: string
  level: OAuthScopeLevel
  scopes: OAuthScope[]
}

/**
 * What a grant is bound to. `organization_bound` grants outlive the member who created them;
 * `user_bound` grants are scoped to the authorizing user and die with their membership.
 */
export type OAuthGrantKind = 'organization_bound' | 'user_bound'

export type OAuthOrganizationRole = {
  slug: string
  name: string
  /**
   * Org-level fallback role. On Team/Enterprise a member can hold a different role on an
   * individual project, and that project-level role overrides this one.
   */
  default_role: OrganizationRole
}

/**
 * Pickers operate on parent projects only — enforcement resolves a branch ref to its parent,
 * so storing a branch ref would create a stored-vs-enforced mismatch. Never add branch
 * projects to fixtures.
 */
export type OAuthAppsAuthorizeOrganizationProject = {
  ref: string
  name: string
  /** The member's role on this specific project. Overrides the org-level `default_role`. */
  role: OrganizationRole
}

/**
 * PROVISIONAL — how the app author configured the consent flow at registration, so the
 * interstitial renders what the app actually asked for rather than assuming project scoping is
 * always on. `allow_project_scoping: false` means the grant covers the whole organization and
 * the project picker must not be shown.
 */
export type OAuthAppGrantConfig = {
  grant_kind: OAuthGrantKind
  allow_project_scoping: boolean
}

/**
 * An existing grant for this app, returned when the user has authorized it before.
 *
 * Re-consent REPLACES the grant server-side — the upsert does
 * `do update set project_refs = excluded.project_refs` — so it replaces both `project_refs`
 * and `approved_scopes` rather than merging them. Two consequences for consumers (which land
 * in the consent-screen PR): preselect `project_refs`, and present the screen as a
 * replacement of the previous grant, never as an addition to it.
 */
export type OAuthExistingGrant = {
  kind: OAuthGrantKind
  /**
   * `null` is only valid on `kind='organization_bound'` legacy rows, where it means ALL
   * scopes — it is NOT an empty grant. The interstitial never renders legacy grants; this
   * annotation exists so the shared types stay truthful for the grants views.
   */
  approved_scopes: OAuthScope[] | null
  /**
   * Raw `text[]` server-side, never pruned when a project is deleted, so a ref here may not
   * resolve against the live project list. Consumers must intersect these against the live
   * projects and never render a raw ref.
   */
  project_refs: string[]
  created_at: string
  /** `null` until the grant is first re-consented — a created-but-never-updated grant has no value here. */
  updated_at: string | null
}

/** Successful authorization: the URL to hand back to the client. */
export type OAuthAppsAuthorizeRedirect = {
  url: string
}

/**
 * Which scopes a member's roles could not satisfy, and at which level the check ran.
 *
 * Keeping the per-project breakdown (rather than flattening to one `failed_scopes` list) is what
 * lets the consent screen mark individual rows in the picker. Consumers that need the union of
 * failed scopes across projects build that set themselves.
 */
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

/** A single project that failed the role check. */
export type OAuthScopeValidationProjectFailure = Extract<
  OAuthScopeValidationResult,
  { scope_target: 'projects' }
>['failures'][number]

/**
 * PROVISIONAL — mirror of the agreed Slack contract (exact JSON still to be published);
 * revisit before wiring the real API. The `mock-vercel-role-validation` scenario returns the
 * `scope_target: 'projects'` variant. The `organization` variant belongs to the upfront org-role
 * check, which has no endpoint or mock fetcher yet.
 */
export type OAuthAppsAuthorizeRoleValidationFailure = {
  error_code: 'role_validation_failed'
  message: string
  validation: OAuthScopeValidationResult
}

/** PROVISIONAL — see {@link OAuthAppsAuthorizeRoleValidationFailure}. */
export type OAuthAppsAuthorizeApproveResult =
  | OAuthAppsAuthorizeRedirect
  | OAuthAppsAuthorizeRoleValidationFailure

export function isRoleValidationFailure(
  result: OAuthAppsAuthorizeApproveResult
): result is OAuthAppsAuthorizeRoleValidationFailure {
  return 'error_code' in result && result.error_code === 'role_validation_failed'
}

/**
 * The per-project failures, or `[]` for an organization-level failure. Consumers that highlight
 * rows in the project picker go through this rather than reaching into `validation`, so an
 * organization-level result degrades to "nothing to highlight" instead of a type error.
 */
export function getFailedProjects(
  failure: OAuthAppsAuthorizeRoleValidationFailure | null | undefined
): OAuthScopeValidationProjectFailure[] {
  if (!failure) return []
  return failure.validation.scope_target === 'projects' ? failure.validation.failures : []
}
