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
 * An existing grant for this app, returned when the user has authorized it before.
 *
 * Re-consent REPLACES the grant server-side — the upsert does
 * `do update set project_refs = excluded.project_refs` — so it replaces both `project_refs`
 * and `approved_scopes` rather than merging them. Two consequences for consumers (which land
 * in the consent-screen PR): preselect `project_refs`, and present the screen as a
 * replacement of the previous grant, never as an addition to it.
 */
export type OAuthExistingGrant = {
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
  updated_at: string
}

/** Successful authorization: the URL to hand back to the client. */
export type OAuthAppsAuthorizeRedirect = {
  url: string
}

/**
 * PROVISIONAL — mirror of the agreed Slack contract (exact JSON still to be published);
 * revisit before wiring the real API. The `mock-vercel-role-validation` scenario returns this.
 */
export type OAuthAppsAuthorizeRoleValidationFailure = {
  error_code: 'role_validation_failed'
  message: string
  /** Which of the requested scopes the member's roles could not satisfy. */
  failed_scopes: OAuthScope[]
  projects: Array<{ name: string; ref: string; role: OrganizationRole }>
  /** ALL distinct member roles involved, as a list — not a single role. */
  roles: OrganizationRole[]
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
