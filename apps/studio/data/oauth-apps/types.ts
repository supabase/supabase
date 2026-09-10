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
 * What a grant is bound to.
 *
 * `organization_bound` grants are approved once by an org owner and outlive the member who
 * created them. `user_bound` grants are scoped to the authorizing member and die with their
 * membership. `compatibility` is the backfilled pre-Select authorization: org-wide, original
 * scopes, not tied to any member. Compatibility grants are never created by the consent flow —
 * they only ever arrive from the backfill, and the grants views render them distinctly.
 */
export type OAuthGrantKind = 'organization_bound' | 'user_bound' | 'compatibility'

/**
 * The app author's project-selection setting. Tri-state, not a boolean: `optional` and
 * `required` both render the picker, but only `optional` offers org-wide access alongside it.
 *
 * - `off` — the picker is hidden and every grant covers the whole organization.
 * - `optional` — the member picks projects, or grants all current and future projects.
 * - `required` — the member must pick at least one project; org-wide is not offered.
 */
export type OAuthProjectSelectionMode = 'off' | 'optional' | 'required'

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
 * PROVISIONAL — how the app author configured the consent flow, so the interstitial renders what
 * the app actually asked for. These are the two independent author flags; every existing app
 * starts at `{ bind_to_authorizing_user: false, project_selection: 'off' }` and only moves when
 * the author edits the app. Do not read these fields directly in UI — go through
 * {@link getOAuthConsentModel}, which normalizes dynamic clients and derives the rendering rules.
 */
export type OAuthAppGrantConfig = {
  /**
   * Flag 1. When set, the app acts with the permissions of whoever connects it and each member
   * gets their own grant. When unset, an org owner approves once and the grant is shared.
   */
  bind_to_authorizing_user: boolean
  /** Flag 2. See {@link OAuthProjectSelectionMode}. */
  project_selection: OAuthProjectSelectionMode
  /**
   * Dynamic MCP clients have no author and no settings page — Supabase forces both flags on and
   * they are neither visible nor changeable. Kept separate from the flags so the interstitial can
   * avoid attributing the configuration to an app author who does not exist.
   */
  is_dynamic_client: boolean
}

/**
 * The app types from the addendum, derived from the two author flags. Consumers should not switch
 * on this for rendering — {@link getOAuthConsentModel} exposes the rules directly. It exists so
 * fixtures, tests, and analytics can name a configuration the same way the PRD does.
 */
export type OAuthAppType = 'A' | 'B' | 'C' | 'D' | 'E'

export function getOAuthAppType(config: OAuthAppGrantConfig): OAuthAppType {
  if (config.is_dynamic_client) return 'E'
  if (config.bind_to_authorizing_user) return config.project_selection === 'off' ? 'C' : 'D'
  return config.project_selection === 'off' ? 'A' : 'B'
}

/**
 * What the consent screen has to render for a given app configuration.
 *
 * Dynamic clients are normalized here rather than trusted from the wire: Supabase forces their
 * flags, so a stale or under-specified `grant_config` must not be able to hide the picker or
 * hand an org-bound grant to a dynamic client.
 */
export type OAuthConsentModel = {
  app_type: OAuthAppType
  /** The grant this approval will create. Never `compatibility` — those are backfill only. */
  grant_kind: Exclude<OAuthGrantKind, 'compatibility'>
  /**
   * Only an org owner can approve, because the resulting grant carries owner-level permissions
   * rather than the connecting member's. Every other member is blocked outright.
   */
  requires_owner: boolean
  /** Whether to render the project picker at all. */
  shows_project_picker: boolean
  /** Whether "all current and future projects" sits alongside the picker as a choice. */
  offers_all_projects: boolean
  /**
   * The scope the approval submits when the picker is hidden. `null` when the member chooses,
   * which is exactly when {@link OAuthConsentModel.shows_project_picker} is true.
   */
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

/**
 * What a grant covers.
 *
 * `all_projects` is a live subscription, not a snapshot: it includes projects created after the
 * grant. It is reachable three ways — a `project_selection: 'off'` app, a member choosing it
 * under `optional`, and every backfilled compatibility grant — so consumers must handle it
 * everywhere a grant is read, not just on the legacy path.
 */
export type OAuthGrantProjectScope =
  | { target: 'all_projects' }
  | { target: 'selected_projects'; project_refs: string[] }

export function isAllProjectsScope(
  scope: OAuthGrantProjectScope
): scope is { target: 'all_projects' } {
  return scope.target === 'all_projects'
}

/**
 * The selected refs, or `[]` for an all-projects grant. Consumers that diff or preselect rows in
 * the picker go through this so an all-projects grant degrades to "nothing to preselect" instead
 * of a type error. Check {@link isAllProjectsScope} first where the two cases differ in copy.
 */
export function getScopedProjectRefs(scope: OAuthGrantProjectScope): string[] {
  return scope.target === 'selected_projects' ? scope.project_refs : []
}

/**
 * An existing grant for this app, returned when the user has authorized it before.
 *
 * Re-consent REPLACES the grant server-side — the upsert does
 * `do update set project_refs = excluded.project_refs` — so it replaces both `project_scope`
 * and `approved_scopes` rather than merging them. Two consequences for consumers (which land
 * in the consent-screen PR): preselect the previous scope, and present the screen as a
 * replacement of the previous grant, never as an addition to it.
 */
export type OAuthExistingGrant = {
  kind: OAuthGrantKind
  /**
   * `null` is only valid on `kind='compatibility'` rows, where it means ALL scopes — it is NOT an
   * empty grant. The interstitial never renders compatibility grants; this annotation exists so
   * the shared types stay truthful for the grants views.
   */
  approved_scopes: OAuthScope[] | null
  /**
   * On `selected_projects`, the refs are raw `text[]` server-side and are never pruned when a
   * project is deleted, so a ref here may not resolve against the live project list. Consumers
   * must intersect these against the live projects and never render a raw ref.
   */
  project_scope: OAuthGrantProjectScope
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
 *
 * The `projects` variant is also returned when the picker is hidden — an all-projects grant still
 * fails per project. In that case the failures are explanatory only: there is no picker to
 * deselect a row in, so the screen is a dead end rather than a recoverable error.
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
