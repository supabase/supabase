import { PermissionAction } from '@supabase/shared-types/out/constants'

import type {
  PermissionCatalogEntry,
  PermissionMode,
  PermissionSelection,
  ResourceAccessMode,
} from './AccessToken.permissions'
import { getCatalogEntry, getEntryScopes } from './AccessToken.permissions'
import { doPermissionsCheck } from '@/hooks/misc/useCheckPermissions'
import type { Permission } from '@/types'

/**
 * Client-side estimation of what a scoped token can actually do, given its owner's current role.
 *
 * Scoped tokens are enforced server-side as the intersection of the token's granted scopes and
 * the owner's live role, re-checked on every request. Nothing here gates anything — these helpers
 * only power advisory UI (warnings in the creation flow, status badges in the token view) so users
 * aren't surprised when an over-provisioned scope returns 403.
 *
 * The minimum-role table below is transcribed from the OpenFGA authorization model
 * (platform: openfga/model/supabase.fga), where every permission is a union of base roles.
 * AccessToken.roles.test.ts asserts the table stays in sync with the scope ids in
 * `@supabase/shared-types` FgaPermissions.
 */

/** Base-role ladder. `member` covers org membership without a base role (e.g. project-scoped users at org level). */
export const TOKEN_ROLE_LEVELS = [
  'none',
  'member',
  'readonly',
  'developer',
  'administrator',
  'owner',
] as const

export type TokenRoleLevel = (typeof TOKEN_ROLE_LEVELS)[number]

const ROLE_RANK = Object.fromEntries(
  TOKEN_ROLE_LEVELS.map((role, index) => [role, index])
) as Record<TokenRoleLevel, number>

export const TOKEN_ROLE_LABEL: Record<TokenRoleLevel, string> = {
  none: 'No role',
  member: 'Member',
  readonly: 'Read-only',
  developer: 'Developer',
  administrator: 'Administrator',
  owner: 'Owner',
}

const rankOf = (role: TokenRoleLevel) => ROLE_RANK[role]

const minRole = (a: TokenRoleLevel, b: TokenRoleLevel): TokenRoleLevel =>
  rankOf(a) <= rankOf(b) ? a : b

const maxRole = (a: TokenRoleLevel, b: TokenRoleLevel): TokenRoleLevel =>
  rankOf(a) >= rankOf(b) ? a : b

/**
 * Lowest base role that holds each FGA permission scope, transcribed from the role unions in the
 * OpenFGA model. Keep in the same order as the model for easy diffing.
 *
 * The drift-guard test only pins the *key set* (scope ids). The role values have no automated
 * guard: if a role union changes in the OpenFGA model (e.g. a `_write` scope moves from developer
 * to administrator), CI stays green and this advisory UI silently gives stale guidance until the
 * value is re-transcribed here. Reviewers of FGA model changes must update this table in the same
 * change.
 */
export const FGA_SCOPE_MINIMUM_ROLE: Record<string, TokenRoleLevel> = {
  // user — available to any authenticated account, no org role required
  organizations_read: 'member',
  organizations_create: 'member',
  projects_read: 'member',
  snippets_read: 'member',

  // organization
  organization_admin_read: 'member',
  organization_admin_write: 'owner',
  organization_projects_read: 'member',
  organization_projects_create: 'administrator',
  members_read: 'readonly',
  members_write: 'administrator',
  platform_webhooks_organization_read: 'member',
  platform_webhooks_organization_write: 'administrator',

  // project
  project_admin_read: 'member',
  project_admin_write: 'administrator',
  action_runs_read: 'readonly',
  action_runs_write: 'developer',
  advisors_read: 'readonly',
  analytics_config_read: 'developer',
  analytics_config_write: 'administrator',
  analytics_logs_read: 'readonly',
  analytics_usage_read: 'readonly',
  api_gateway_keys_read: 'developer',
  api_gateway_keys_write: 'administrator',
  auth_config_read: 'readonly',
  auth_config_write: 'developer',
  auth_signing_keys_read: 'developer',
  auth_signing_keys_write: 'developer',
  backups_read: 'readonly',
  backups_write: 'developer',
  branching_development_create: 'developer',
  branching_development_delete: 'developer',
  branching_development_read: 'readonly',
  branching_development_write: 'developer',
  branching_production_create: 'administrator',
  branching_production_delete: 'administrator',
  branching_production_read: 'readonly',
  branching_production_write: 'developer',
  custom_domain_read: 'readonly',
  custom_domain_write: 'administrator',
  data_api_config_read: 'readonly',
  data_api_config_write: 'administrator',
  database_read: 'readonly',
  database_write: 'developer',
  database_config_read: 'readonly',
  database_config_write: 'administrator',
  database_jit_read: 'readonly',
  database_jit_write: 'administrator',
  database_network_bans_read: 'readonly',
  database_network_bans_write: 'administrator',
  database_network_restrictions_read: 'readonly',
  database_network_restrictions_write: 'administrator',
  database_migrations_read: 'readonly',
  database_migrations_write: 'developer',
  database_pooling_config_read: 'readonly',
  database_pooling_config_write: 'administrator',
  database_readonly_config_read: 'readonly',
  database_readonly_config_write: 'administrator',
  database_ssl_config_read: 'readonly',
  database_ssl_config_write: 'administrator',
  database_webhooks_config_read: 'readonly',
  database_webhooks_config_write: 'developer',
  edge_functions_read: 'readonly',
  edge_functions_write: 'developer',
  edge_functions_secrets_read: 'readonly',
  edge_functions_secrets_write: 'administrator',
  infra_add_ons_read: 'readonly',
  infra_add_ons_write: 'administrator',
  infra_disk_config_read: 'readonly',
  infra_disk_config_write: 'administrator',
  infra_read_replicas_read: 'readonly',
  infra_read_replicas_write: 'administrator',
  project_snippets_read: 'readonly',
  project_snippets_write: 'readonly',
  realtime_config_read: 'readonly',
  realtime_config_write: 'administrator',
  storage_read: 'readonly',
  storage_write: 'developer',
  storage_config_read: 'readonly',
  storage_config_write: 'administrator',
  vanity_subdomain_read: 'administrator',
  vanity_subdomain_write: 'administrator',
  platform_webhooks_projects_read: 'member',
  platform_webhooks_projects_write: 'administrator',
}

/**
 * ABAC checks that identify the user's base role from their own permission rows (the ungated
 * /platform/profile/permissions response). Base roles inherit each other's rows
 * (Owner ⊃ Administrator ⊃ Developer ⊃ Read-only), so the first probe that passes, walking
 * top-down, is the user's level. Each probe is a permission only that role and above holds.
 */
const ROLE_PROBES: { role: TokenRoleLevel; action: string; resource: string }[] = [
  { role: 'owner', action: PermissionAction.UPDATE, resource: 'organizations' },
  { role: 'administrator', action: PermissionAction.CREATE, resource: 'projects' },
  { role: 'developer', action: PermissionAction.FUNCTIONS_WRITE, resource: 'functions' },
  { role: 'readonly', action: PermissionAction.TENANT_SQL_SELECT, resource: 'sql' },
]

/**
 * Estimates the user's base role in an organization (or on a specific project, when the user's
 * access is project-scoped). Custom roles resolve to the nearest base role by capability, which
 * matches how they behave in the FGA model.
 */
export const estimateRoleLevel = (
  permissions: Permission[],
  organizationSlug: string,
  projectRef?: string
): TokenRoleLevel => {
  for (const probe of ROLE_PROBES) {
    if (
      doPermissionsCheck(
        permissions,
        probe.action,
        probe.resource,
        undefined,
        organizationSlug,
        projectRef
      )
    ) {
      return probe.role
    }
  }
  const isMember = permissions.some(
    (permission) => permission.organization_slug === organizationSlug
  )
  return isMember ? 'member' : 'none'
}

/**
 * True when every permission row the user holds in the org is limited to specific projects.
 * Org-wide rows arrive as [] or null (the API contract is nullable) — both mean not scoped.
 */
export const getIsProjectScopedOnly = (
  permissions: Permission[],
  organizationSlug: string
): boolean => {
  const orgRows = permissions.filter(
    (permission) => permission.organization_slug === organizationSlug
  )
  if (orgRows.length === 0) return false
  return orgRows.every(
    (permission) => Array.isArray(permission.project_refs) && permission.project_refs.length > 0
  )
}

/** Lowest role that holds every scope in the list. Unknown scope ids assume `owner` (warn rather than promise). */
const requiredRoleForScopes = (scopeIds: string[]): TokenRoleLevel => {
  let required: TokenRoleLevel = 'member'
  for (const id of scopeIds) {
    required = maxRole(required, FGA_SCOPE_MINIMUM_ROLE[id] ?? 'owner')
  }
  return required
}

/** Lowest role that can exercise a catalog entry at the given mode. */
export const requiredRoleForEntry = (
  entry: PermissionCatalogEntry,
  mode: PermissionMode
): TokenRoleLevel =>
  mode === 'none' ? 'member' : requiredRoleForScopes(getEntryScopes(entry, mode))

/**
 * 'unavailable-for-scope': the entry's permission level can never be exercised through this
 * token's resource binding, regardless of the owner's role — platform rejects project-scoped
 * tokens outright on organization endpoints.
 */
export type EntryAccessStatus = 'ok' | 'exceeds-role' | 'unavailable-for-scope' | 'unknown'

/** A token-bound resource where the user's current role can't exercise the selected mode. */
export interface FailingResource {
  type: 'organization' | 'project'
  /** Org slug or project ref — unique, unlike `label`. Use for React keys and grouping. */
  id: string
  /** Display name of the org/project, falling back to its slug/ref. */
  label: string
  /** The user's current role on that resource. */
  role: TokenRoleLevel
  /**
   * Set when the user has no organization-level role here but does hold roles on specific
   * projects (they were invited to projects, not the org). Lets the UI say "your role is
   * Read-only on the project X" instead of an opaque org-level pseudo-role.
   */
  projectScopedRoles?: { label: string; role: TokenRoleLevel }[]
}

export interface EntryAccess {
  status: EntryAccessStatus
  /** Highest mode the user's current role can exercise for this entry. */
  effectiveMode: PermissionMode
  /** Lowest role that could exercise the selected mode. */
  requiredRole: TokenRoleLevel
  /** Resources where the selected mode would be denied (empty unless status is 'exceeds-role'). */
  failingResources: FailingResource[]
}

export interface TokenAccessEvaluation {
  /** 'unknown' while the user's permissions are loading (or on self-hosted) — show no warnings. */
  status: 'unknown' | 'evaluated'
  /** Token-bound orgs the user can no longer access. */
  inaccessibleOrgSlugs: string[]
  /** Token-bound projects the user can no longer access. */
  inaccessibleProjectRefs: string[]
  /** True when a resource-scoped token has no bindings left — everything it was bound to was deleted. */
  hasNoBoundResources: boolean
  /** True when the token is bound to resources but the user can access none of them. */
  hasNoAccessibleResource: boolean
  /** Per selected catalog entry key. */
  entries: Record<string, EntryAccess>
  /** Entry keys whose selected mode exceeds the user's current role. */
  exceedingEntryKeys: string[]
  /** Entry keys the token's resource binding can never exercise (org entries on project tokens). */
  unavailableEntryKeys: string[]
  /**
   * Selection reduced to what the user's current role can exercise. Always normalized to
   * catalog-known, non-'none' entries — including on the 'unknown' and account paths, where no
   * reduction applies.
   */
  effectiveSelection: PermissionSelection
}

export interface TokenRoleContextArgs {
  resourceAccess: ResourceAccessMode
  /** Token-bound org slugs (organization mode), or the parent org (project mode, from the form). */
  organizationSlugs: string[]
  /** Token-bound project refs (project mode). */
  projectRefs: string[]
  /** The user's own ABAC permission rows; undefined while loading. */
  permissions: Permission[] | undefined
  /** Organizations the user can currently access. */
  organizations: { slug: string; name?: string }[]
  /** Projects the user can currently access. */
  projects: { ref: string; organization_slug: string; name?: string }[]
}

/**
 * Selection-independent role resolution for a token's bound resources. Resolving roles walks the
 * user's full permission list several times, so callers should memoize this on its inputs and
 * apply (cheap) selection changes via `applySelectionToRoleContext`.
 */
export interface TokenRoleContext {
  status: 'unknown' | 'evaluated'
  resourceAccess: ResourceAccessMode
  inaccessibleOrgSlugs: string[]
  inaccessibleProjectRefs: string[]
  hasNoBoundResources: boolean
  hasNoAccessibleResource: boolean
  /** Per bound organization (or parent org in project mode). */
  orgLevels: FailingResource[]
  /**
   * Per bound project in project mode; per accessible project of the bound orgs in organization
   * mode (platform checks project permissions against the project object, so project-scoped
   * roles count). Orgs with no accessible projects contribute their org level instead.
   */
  projectLevels: FailingResource[]
  /** Weakest role across orgLevels / projectLevels. */
  orgLevel: TokenRoleLevel
  projectLevel: TokenRoleLevel
}

const UNKNOWN_ENTRY: EntryAccess = {
  status: 'unknown',
  effectiveMode: 'none',
  requiredRole: 'member',
  failingResources: [],
}

const minOver = (levels: FailingResource[]): TokenRoleLevel =>
  levels.length === 0
    ? 'none'
    : levels.reduce<TokenRoleLevel>((lowest, level) => minRole(lowest, level.role), 'owner')

export const computeTokenRoleContext = ({
  resourceAccess,
  organizationSlugs,
  projectRefs,
  permissions,
  organizations,
  projects,
}: TokenRoleContextArgs): TokenRoleContext => {
  const boundResourceIds =
    resourceAccess === 'project'
      ? projectRefs
      : resourceAccess === 'organization'
        ? organizationSlugs
        : []
  const hasNoBoundResources = resourceAccess !== 'account' && boundResourceIds.length === 0

  const unknownContext = (status: TokenRoleContext['status']): TokenRoleContext => ({
    status,
    resourceAccess,
    inaccessibleOrgSlugs: [],
    inaccessibleProjectRefs: [],
    hasNoBoundResources,
    hasNoAccessibleResource: false,
    orgLevels: [],
    projectLevels: [],
    orgLevel: 'none',
    projectLevel: 'none',
  })

  // Nothing to evaluate while permissions load, or until resources are chosen (mid-form state).
  if (permissions === undefined || hasNoBoundResources) return unknownContext('unknown')
  if (resourceAccess === 'account') return unknownContext('evaluated')

  const knownOrgSlugs = new Set(organizations.map((org) => org.slug))
  const projectsByRef = new Map(projects.map((project) => [project.ref, project]))

  const inaccessibleOrgSlugs = organizationSlugs.filter((slug) => !knownOrgSlugs.has(slug))
  // Only meaningful in project mode — the form can carry stale projectRefs after a mode switch.
  const inaccessibleProjectRefs =
    resourceAccess === 'project' ? projectRefs.filter((ref) => !projectsByRef.has(ref)) : []

  const accessibleOrgSlugs = organizationSlugs.filter((slug) => knownOrgSlugs.has(slug))
  const accessibleProjects = projectRefs.flatMap((ref) => projectsByRef.get(ref) ?? [])

  const hasNoAccessibleResource =
    resourceAccess === 'project' ? accessibleProjects.length === 0 : accessibleOrgSlugs.length === 0

  if (hasNoAccessibleResource) {
    return {
      ...unknownContext('evaluated'),
      inaccessibleOrgSlugs,
      inaccessibleProjectRefs,
      hasNoAccessibleResource,
    }
  }

  // Role probes walk every permission row; the same org/project pair is asked for repeatedly
  // (project levels + project-scoped detail), so resolve each pair once.
  const roleCache = new Map<string, TokenRoleLevel>()
  const roleFor = (slug: string, ref?: string): TokenRoleLevel => {
    const cacheKey = `${slug}|${ref ?? ''}`
    const cached = roleCache.get(cacheKey)
    if (cached !== undefined) return cached
    const role = estimateRoleLevel(permissions, slug, ref)
    roleCache.set(cacheKey, role)
    return role
  }

  const organizationsBySlug = new Map(organizations.map((org) => [org.slug, org]))

  // The form passes the parent org even in project mode; the token view may not, so fall back to
  // the bound projects' parent orgs when no org slug was provided.
  const orgSlugsForLevels =
    accessibleOrgSlugs.length > 0
      ? accessibleOrgSlugs
      : Array.from(new Set(accessibleProjects.map((project) => project.organization_slug)))

  // For members without an organization-level role, resolve their per-project roles so org-level
  // failures can explain the distinction (invited to projects, not the org). In project mode only
  // the token-bound projects are relevant; in organization mode (e.g. a token that predates a
  // role change) look at every project they can access in the org.
  const getProjectScopedRoles = (
    slug: string,
    orgRole: TokenRoleLevel
  ): FailingResource['projectScopedRoles'] => {
    if (rankOf(orgRole) >= ROLE_RANK.readonly) return undefined
    const candidates =
      resourceAccess === 'project'
        ? accessibleProjects.filter((project) => project.organization_slug === slug)
        : projects.filter((project) => project.organization_slug === slug)
    const roles = candidates.flatMap((project) => {
      const role = roleFor(slug, project.ref)
      if (rankOf(role) < ROLE_RANK.readonly) return []
      return [{ label: project.name ?? project.ref, role }]
    })
    return roles.length > 0 ? roles : undefined
  }

  const orgLevels: FailingResource[] = orgSlugsForLevels.map((slug) => {
    const role = roleFor(slug)
    return {
      type: 'organization',
      id: slug,
      label: organizationsBySlug.get(slug)?.name ?? slug,
      role,
      projectScopedRoles: getProjectScopedRoles(slug, role),
    }
  })

  const toProjectLevel = (project: { ref: string; organization_slug: string; name?: string }) => ({
    type: 'project' as const,
    id: project.ref,
    label: project.name ?? project.ref,
    role: roleFor(project.organization_slug, project.ref),
  })

  // In organization mode the token's scope cascades to every project of the bound orgs, and
  // platform checks the owner's permission against the project object — so a project-scoped
  // Developer really can exercise e.g. database_write on their project through an org-bound
  // token. Evaluate project-level entries per accessible project rather than by the org-level
  // role, falling back to the org level for orgs with no accessible projects. Future projects
  // only ever inherit the org-level role; the per-project view can't warn about those.
  const projectLevels: FailingResource[] =
    resourceAccess === 'project'
      ? accessibleProjects.map(toProjectLevel)
      : orgSlugsForLevels.flatMap((slug) => {
          const orgProjects = projects.filter((project) => project.organization_slug === slug)
          if (orgProjects.length === 0) return orgLevels.filter((level) => level.id === slug)
          return orgProjects.map(toProjectLevel)
        })

  return {
    status: 'evaluated',
    resourceAccess,
    inaccessibleOrgSlugs,
    inaccessibleProjectRefs,
    hasNoBoundResources,
    hasNoAccessibleResource,
    orgLevels,
    projectLevels,
    orgLevel: minOver(orgLevels),
    projectLevel: minOver(projectLevels),
  }
}

/**
 * Applies a scope selection to a resolved role context. Cheap — safe to re-run on every
 * permission toggle. Account-scoped (legacy/user) tokens track the owner's access by definition,
 * so every entry evaluates as 'ok' there.
 */
export const applySelectionToRoleContext = (
  context: TokenRoleContext,
  selection: PermissionSelection
): TokenAccessEvaluation => {
  // Every path reports entries and effectiveSelection over the same normalized key set, so
  // consumers can iterate either without special-casing 'none' modes or unknown catalog keys.
  const selectedKeys = Object.keys(selection).filter(
    (key) => selection[key] !== 'none' && getCatalogEntry(key) !== undefined
  )
  const normalizedSelection: PermissionSelection = Object.fromEntries(
    selectedKeys.map((key) => [key, selection[key]])
  )

  const base = {
    status: context.status,
    inaccessibleOrgSlugs: context.inaccessibleOrgSlugs,
    inaccessibleProjectRefs: context.inaccessibleProjectRefs,
    hasNoBoundResources: context.hasNoBoundResources,
    hasNoAccessibleResource: context.hasNoAccessibleResource,
    exceedingEntryKeys: [] as string[],
    unavailableEntryKeys: [] as string[],
    effectiveSelection: normalizedSelection,
  }

  // Account-scoped (legacy/user) tokens track the owner's access by definition — every entry is
  // exercisable, so requiredRole/failingResources (only read for 'exceeds-role' entries) stay inert.
  if (context.status === 'evaluated' && context.resourceAccess === 'account') {
    return {
      ...base,
      entries: Object.fromEntries(
        selectedKeys.map((key): [string, EntryAccess] => [
          key,
          {
            status: 'ok',
            effectiveMode: selection[key],
            requiredRole: 'member',
            failingResources: [],
          },
        ])
      ),
    }
  }

  if (context.status === 'unknown' || context.hasNoAccessibleResource) {
    return {
      ...base,
      entries: Object.fromEntries(selectedKeys.map((key) => [key, UNKNOWN_ENTRY])),
    }
  }

  const { orgLevel, projectLevel, orgLevels, projectLevels } = context
  const entries: Record<string, EntryAccess> = {}
  const exceedingEntryKeys: string[] = []
  const unavailableEntryKeys: string[] = []
  const effectiveSelection: PermissionSelection = {}

  for (const key of selectedKeys) {
    const mode = selection[key]
    const entry = getCatalogEntry(key)
    if (!entry) continue

    // Platform rejects project-scoped tokens outright on organization endpoints (getChecks
    // throws before any FGA evaluation), so the owner's org role is irrelevant there and
    // role-based evaluation would wrongly report these entries as exercisable. The one
    // exception — organization_admin_write is additionally enforced on a few project-ref
    // routes via the model's `from parent_organization` indirection — is deliberately
    // ignored: this advisory UI fails closed.
    if (context.resourceAccess === 'project' && entry.level === 'organization') {
      entries[key] = {
        status: 'unavailable-for-scope',
        effectiveMode: 'none',
        requiredRole: requiredRoleForEntry(entry, mode),
        failingResources: [],
      }
      unavailableEntryKeys.push(key)
      continue
    }

    const availableLevel =
      entry.level === 'user' ? 'owner' : entry.level === 'organization' ? orgLevel : projectLevel

    const requiredRole = requiredRoleForEntry(entry, mode)

    let effectiveMode: PermissionMode = 'none'
    if (rankOf(availableLevel) >= rankOf(requiredRole)) {
      effectiveMode = mode
    } else if (
      mode === 'readwrite' &&
      rankOf(availableLevel) >= rankOf(requiredRoleForEntry(entry, 'read'))
    ) {
      effectiveMode = 'read'
    }

    const status: EntryAccessStatus = effectiveMode === mode ? 'ok' : 'exceeds-role'
    const relevantLevels =
      entry.level === 'user' ? [] : entry.level === 'organization' ? orgLevels : projectLevels
    const failingResources =
      status === 'exceeds-role'
        ? relevantLevels.filter((level) => rankOf(level.role) < rankOf(requiredRole))
        : []

    entries[key] = { status, effectiveMode, requiredRole, failingResources }
    if (status === 'exceeds-role') exceedingEntryKeys.push(key)
    if (effectiveMode !== 'none') effectiveSelection[key] = effectiveMode
  }

  return { ...base, entries, exceedingEntryKeys, unavailableEntryKeys, effectiveSelection }
}

export interface FailingResourceGroup {
  type: 'organization' | 'project'
  resource: FailingResource
  entries: { key: string; name: string; mode: PermissionMode; requiredRole: TokenRoleLevel }[]
}

/**
 * Inverts the evaluation's entry → failingResources mapping into resource → failing entries
 * (organizations first, then alphabetical) for per-resource breakdowns.
 */
export const groupFailingResources = (
  evaluation: TokenAccessEvaluation,
  selection: PermissionSelection
): FailingResourceGroup[] => {
  const groups = new Map<string, FailingResourceGroup>()
  for (const key of evaluation.exceedingEntryKeys) {
    const entryAccess = evaluation.entries[key]
    const entry = getCatalogEntry(key)
    const mode = selection[key]
    if (entryAccess === undefined || entry === undefined || mode === undefined) continue
    for (const resource of entryAccess.failingResources) {
      const groupKey = `${resource.type}:${resource.id}`
      let group = groups.get(groupKey)
      if (group === undefined) {
        group = { type: resource.type, resource, entries: [] }
        groups.set(groupKey, group)
      }
      group.entries.push({ key, name: entry.name, mode, requiredRole: entryAccess.requiredRole })
    }
  }
  return Array.from(groups.values()).sort((a, b) => {
    if (a.type === b.type) return a.resource.label.localeCompare(b.resource.label)
    return a.type === 'organization' ? -1 : 1
  })
}
