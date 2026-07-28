import { permissions } from '@supabase/shared-types'

import type { ScopedAccessTokenPermission } from './AccessToken.constants'

/**
 * Data model for the scoped access-token creation flow.
 *
 * The real permission scopes come from `@supabase/shared-types` (`FgaPermissions`). Those scopes
 * carry no category or risk metadata, so this file layers editable presentation data on top:
 *   - PERMISSION_CATEGORIES groups every scope into one of five UI categories.
 *   - RESOURCE_METADATA assigns each resource a display name, description, category and risk.
 *
 * TODO(product): the risk levels, reasons and "Allows" copy below are proposed defaults — review
 * and adjust. Where a resource has no explicit metadata entry we fall back to a heuristic.
 */

const FGA = permissions.FgaPermissions

export type PermissionMode = 'none' | 'read' | 'readwrite'
export type RiskLevel = 'low' | 'medium' | 'high'
export type PermissionCategoryKey = 'account' | 'project' | 'database' | 'appsvc' | 'infra'

export interface PermissionCategory {
  key: PermissionCategoryKey
  name: string
  description: string
}

/** Display order matches the accordion. The first category is open by default. */
export const PERMISSION_CATEGORIES: PermissionCategory[] = [
  {
    key: 'project',
    name: 'Project',
    description: 'Core project visibility, settings, and diagnostics.',
  },
  {
    key: 'database',
    name: 'Database',
    description: 'SQL access, migrations, backups, and data operations.',
  },
  {
    key: 'appsvc',
    name: 'Application Services',
    description: 'Auth, storage, realtime, edge functions, and service configuration.',
  },
  {
    key: 'infra',
    name: 'Infrastructure & Delivery',
    description: 'Branch automation, domains, add-ons, and network.',
  },
  {
    key: 'account',
    name: 'Account & Organization',
    description: 'Account-wide and organization-level access that spans projects.',
  },
]

interface ResourceMeta {
  category: PermissionCategoryKey
  name: string
  description: string
  risk: RiskLevel
  riskReason: string
  allowsRead?: string[]
  allowsWrite?: string[]
}

/**
 * Per-resource presentation metadata, keyed by the derived `scope:resource` key (see
 * AccessToken.constants → ACCESS_TOKEN_RESOURCES). Every resource returned from FgaPermissions
 * should have an entry; RESOURCE_METADATA_FALLBACK covers anything that slips through.
 */
const RESOURCE_METADATA: Record<string, ResourceMeta> = {
  // --- Account & Organization ---
  'user:organizations': {
    category: 'account',
    name: 'Organizations',
    description: 'Organizations you belong to.',
    risk: 'medium',
    riskReason: 'Read-write can create new organizations under your account.',
    allowsRead: ['List your organizations'],
    allowsWrite: ['Create organizations'],
  },
  'user:projects': {
    category: 'account',
    name: 'Projects (account-wide)',
    description: 'Projects across all your organizations.',
    risk: 'low',
    riskReason: 'Read-only listing of the projects you can access.',
    allowsRead: ['List your projects'],
  },
  'user:snippets': {
    category: 'account',
    name: 'SQL Snippets (account-wide)',
    description: 'Saved SQL snippets across your account.',
    risk: 'low',
    riskReason: 'Read-only access to your saved snippets.',
    allowsRead: ['Read your SQL snippets'],
  },
  'organization:admin': {
    category: 'account',
    name: 'Organization Settings',
    description: 'Organization settings and project transfers.',
    risk: 'high',
    riskReason: 'Read-write grants elevated access to organization settings and project transfers.',
    allowsRead: ['Read organization settings'],
    allowsWrite: ['Manage organization settings', 'Transfer projects'],
  },
  'organization:members': {
    category: 'account',
    name: 'Organization Members',
    description: 'Members and roles within the organization.',
    risk: 'high',
    riskReason: 'Read-write can add or remove members and change roles across your organization.',
    allowsRead: ['Read organization members'],
    allowsWrite: ['Add or remove members', 'Change member roles'],
  },
  'organization:projects': {
    category: 'account',
    name: 'Organization Projects',
    description: 'Projects within the organization.',
    risk: 'medium',
    riskReason: 'Read-write can create new projects in the organization.',
    allowsRead: ['List organization projects'],
    allowsWrite: ['Create organization projects'],
  },

  // --- Project ---
  'project:admin': {
    category: 'project',
    name: 'Project Settings',
    description: 'Project metadata and settings.',
    risk: 'high',
    riskReason: 'Read-write grants elevated access to change project settings and configuration.',
    allowsRead: ['Read project metadata'],
    allowsWrite: ['Update project settings'],
  },
  'project:action_runs': {
    category: 'project',
    name: 'Action Runs',
    description: 'Project action run status and logs.',
    risk: 'medium',
    riskReason: 'Read-write can trigger action runs that execute project workflows.',
    allowsRead: ['Read action run status', 'Read run logs'],
    allowsWrite: ['Trigger action runs'],
  },
  'project:advisors': {
    category: 'project',
    name: 'Advisors',
    description: 'Security and performance advisor results.',
    risk: 'low',
    riskReason: 'Read-only access to advisor findings — no changes possible.',
    allowsRead: ['Read security advisors', 'Read performance advisors'],
  },
  'project:analytics_logs': {
    category: 'project',
    name: 'Logs',
    description: 'Operational logs and log analytics.',
    risk: 'low',
    riskReason: 'Read-only access to project logs.',
    allowsRead: ['Read project logs'],
  },
  'project:analytics_usage': {
    category: 'project',
    name: 'Usage Analytics',
    description: 'Project usage and analytics data.',
    risk: 'low',
    riskReason: 'Read-only access to usage analytics.',
    allowsRead: ['Read usage analytics'],
  },
  'project:snippets': {
    category: 'project',
    name: 'SQL Snippets',
    description: 'Saved SQL snippets for the project.',
    risk: 'low',
    riskReason: 'Read-write can create and edit saved SQL snippets.',
    allowsRead: ['Read project SQL snippets'],
    allowsWrite: ['Manage project SQL snippets'],
  },

  // --- Database ---
  'project:database': {
    category: 'database',
    name: 'Database',
    description: 'Database access and data operations.',
    risk: 'high',
    riskReason:
      'Read-write lets this token run arbitrary SQL, so it can modify or delete any data in your database.',
    allowsRead: ['Read tables and schema', 'Run read-only queries'],
    allowsWrite: ['Run arbitrary SQL'],
  },
  'project:database_migrations': {
    category: 'database',
    name: 'Migrations',
    description: 'Database migration history and application.',
    risk: 'high',
    riskReason:
      'Read-write can apply schema changes that alter or drop tables across your database.',
    allowsRead: ['Read migration history'],
    allowsWrite: ['Apply migrations'],
  },
  'project:backups': {
    category: 'database',
    name: 'Backups',
    description: 'Database backups, restore points, and restore.',
    risk: 'high',
    riskReason:
      'Read-write can trigger restores that overwrite current data with an earlier snapshot.',
    allowsRead: ['Read backups and restore points'],
    allowsWrite: ['Trigger restores'],
  },
  'project:database_config': {
    category: 'database',
    name: 'Database Config',
    description: 'Database configuration.',
    risk: 'medium',
    riskReason: 'Read-write can change database configuration.',
    allowsRead: ['Read database configuration'],
    allowsWrite: ['Update database configuration'],
  },
  'project:database_jit': {
    category: 'database',
    name: 'Database JIT',
    description: 'Just-in-time database access settings.',
    risk: 'medium',
    riskReason: 'Read-write can change just-in-time database access settings.',
    allowsRead: ['Read JIT settings'],
    allowsWrite: ['Manage JIT settings'],
  },
  'project:database_pooling_config': {
    category: 'database',
    name: 'Connection Pooling',
    description: 'Database connection pooling.',
    risk: 'medium',
    riskReason: 'Read-write can change connection pooling behavior.',
    allowsRead: ['Read pooling configuration'],
    allowsWrite: ['Update pooling configuration'],
  },
  'project:database_readonly_config': {
    category: 'database',
    name: 'Read-only Mode',
    description: 'Database read-only mode.',
    risk: 'medium',
    riskReason: 'Read-write can toggle the database into or out of read-only mode.',
    allowsRead: ['Read read-only mode status'],
    allowsWrite: ['Toggle read-only mode'],
  },
  'project:database_ssl_config': {
    category: 'database',
    name: 'SSL Enforcement',
    description: 'Database SSL configuration.',
    risk: 'medium',
    riskReason: 'Read-write can change SSL enforcement for database connections.',
    allowsRead: ['Read SSL configuration'],
    allowsWrite: ['Manage SSL enforcement'],
  },
  'project:database_webhooks_config': {
    category: 'database',
    name: 'Database Webhooks',
    description: 'Webhooks triggered from the database.',
    risk: 'medium',
    riskReason: 'Read-write can change database webhook configuration.',
    allowsRead: ['Read webhook configuration'],
    allowsWrite: ['Manage database webhooks'],
  },
  'project:database_network_bans': {
    category: 'database',
    name: 'Network Bans',
    description: 'Banned IPs for the database.',
    risk: 'medium',
    riskReason: 'Read-write can ban or unban IP addresses from reaching the database.',
    allowsRead: ['Read banned IPs'],
    allowsWrite: ['Manage banned IPs'],
  },
  'project:database_network_restrictions': {
    category: 'database',
    name: 'Network Restrictions',
    description: 'Network restrictions for the database.',
    risk: 'high',
    riskReason: 'Read-write can change which networks are allowed to reach the database.',
    allowsRead: ['Read network restrictions'],
    allowsWrite: ['Manage network restrictions'],
  },

  // --- Application Services ---
  'project:auth_config': {
    category: 'appsvc',
    name: 'Auth Config',
    description: 'Authentication provider and settings.',
    risk: 'high',
    riskReason:
      'Read-write can change authentication providers and settings, affecting how users sign in.',
    allowsRead: ['Read auth configuration'],
    allowsWrite: ['Update auth providers and settings'],
  },
  'project:auth_signing_keys': {
    category: 'appsvc',
    name: 'Auth Signing Keys',
    description: 'Authentication signing keys.',
    risk: 'high',
    riskReason: 'Read-write can rotate signing keys, invalidating existing sessions and tokens.',
    allowsRead: ['Read signing keys'],
    allowsWrite: ['Manage signing keys'],
  },
  'project:api_gateway_keys': {
    category: 'appsvc',
    name: 'API Keys',
    description: 'Project API keys.',
    risk: 'high',
    riskReason: 'Read exposes API keys; read-write grants elevated access to create new keys.',
    allowsRead: ['Read project API keys'],
    allowsWrite: ['Create and revoke API keys'],
  },
  'project:edge_functions': {
    category: 'appsvc',
    name: 'Edge Functions',
    description: 'Edge functions.',
    risk: 'medium',
    riskReason: 'Read-write can deploy or delete edge functions.',
    allowsRead: ['Read edge functions'],
    allowsWrite: ['Deploy and delete edge functions'],
  },
  'project:edge_functions_secrets': {
    category: 'appsvc',
    name: 'Edge Function Secrets',
    description: 'Secrets available to edge functions.',
    risk: 'high',
    riskReason: 'Read exposes function secrets; read-write can set new secret values.',
    allowsRead: ['Read edge function secrets'],
    allowsWrite: ['Set edge function secrets'],
  },
  'project:realtime_config': {
    category: 'appsvc',
    name: 'Realtime Config',
    description: 'Realtime configuration.',
    risk: 'medium',
    riskReason: 'Read-write can change realtime settings and shut down active connections.',
    allowsRead: ['Read realtime configuration'],
    allowsWrite: ['Update realtime settings'],
  },
  'project:storage': {
    category: 'appsvc',
    name: 'Storage',
    description: 'File storage buckets and objects.',
    risk: 'medium',
    riskReason: 'Read-write can modify or delete stored files.',
    allowsRead: ['Read storage buckets and objects'],
    allowsWrite: ['Manage storage buckets and objects'],
  },
  'project:storage_config': {
    category: 'appsvc',
    name: 'Storage Config',
    description: 'Storage bucket configuration.',
    risk: 'medium',
    riskReason: 'Read-write can change storage configuration.',
    allowsRead: ['Read storage configuration'],
    allowsWrite: ['Update storage configuration'],
  },
  'project:data_api_config': {
    category: 'appsvc',
    name: 'Data API Config',
    description: 'PostgREST behavior and settings.',
    risk: 'medium',
    riskReason: 'Read-write can change how the auto-generated Data API behaves.',
    allowsRead: ['Read Data API configuration'],
    allowsWrite: ['Update Data API configuration'],
  },

  // --- Infrastructure & Delivery ---
  'project:branching_development': {
    category: 'infra',
    name: 'Development Branches',
    description: 'Development branch automation.',
    risk: 'low',
    riskReason: 'Branch automation for development workflows — limited blast radius.',
    allowsRead: ['Read development branches'],
    allowsWrite: ['Create, update, and delete development branches'],
  },
  'project:branching_production': {
    category: 'infra',
    name: 'Production Branches',
    description: 'Production branch automation.',
    risk: 'high',
    riskReason:
      'Read-write grants elevated access to create, merge, or delete production branches.',
    allowsRead: ['Read production branches'],
    allowsWrite: ['Create, merge, and delete production branches'],
  },
  'project:custom_domain': {
    category: 'infra',
    name: 'Custom Domains',
    description: 'Custom hostnames.',
    risk: 'medium',
    riskReason: 'Read-write can change custom hostnames, affecting how your project is reached.',
    allowsRead: ['Read custom domain configuration'],
    allowsWrite: ['Set custom hostnames'],
  },
  'project:vanity_subdomain': {
    category: 'infra',
    name: 'Vanity Subdomain',
    description: 'Project vanity subdomain.',
    risk: 'medium',
    riskReason: 'Read-write can change the project vanity subdomain.',
    allowsRead: ['Read vanity subdomain'],
    allowsWrite: ['Manage vanity subdomain'],
  },
  'project:infra_addons': {
    category: 'infra',
    name: 'Add-ons',
    description: 'Infrastructure add-ons.',
    risk: 'medium',
    riskReason: 'Read-write can enable or change paid infrastructure add-ons.',
    allowsRead: ['Read infrastructure add-ons'],
    allowsWrite: ['Manage infrastructure add-ons'],
  },
  'project:infra_disk_config': {
    category: 'infra',
    name: 'Disk Config',
    description: 'Disk configuration.',
    risk: 'medium',
    riskReason: 'Read-write can change disk size and configuration, which may incur cost.',
    allowsRead: ['Read disk configuration'],
    allowsWrite: ['Manage disk configuration'],
  },
  'project:read_replicas': {
    category: 'infra',
    name: 'Read Replicas',
    description: 'Read replica configuration.',
    risk: 'medium',
    riskReason: 'Read-write can provision or remove read replicas, which may incur cost.',
    allowsRead: ['Read read-replica configuration'],
    allowsWrite: ['Manage read replicas'],
  },
}

const RESOURCE_METADATA_FALLBACK = (
  resourceKey: string,
  title: string,
  hasWrite: boolean
): ResourceMeta => ({
  category: resourceKey.startsWith('project:') ? 'project' : 'account',
  name: title.replace(/^(Read|Manage|Create|Delete)\s+/i, ''),
  description: title,
  risk: hasWrite ? 'medium' : 'low',
  riskReason: hasWrite
    ? 'Read-write can modify this resource.'
    : 'Read-only access to this resource.',
})

export interface PermissionCatalogEntry {
  /** Derived resource key, e.g. "project:database" */
  key: string
  category: PermissionCategoryKey
  name: string
  description: string
  risk: RiskLevel
  riskReason: string
  allowsRead: string[]
  allowsWrite: string[]
  /** Whether a Read-write mode is offered (false => read-only resource). */
  writable: boolean
  /** FGA scope ids granted at Read (and above). */
  readScopes: ScopedAccessTokenPermission[]
  /** Additional FGA scope ids granted at Read-write (write / create / delete). */
  writeScopes: ScopedAccessTokenPermission[]
}

const getAction = (key: string): 'read' | 'write' | 'create' | 'delete' => {
  if (key.endsWith('_WRITE')) return 'write'
  if (key.endsWith('_CREATE')) return 'create'
  if (key.endsWith('_DELETE')) return 'delete'
  return 'read'
}

const getResource = (key: string): string =>
  key.replace(/_(READ|WRITE|CREATE|DELETE)$/, '').toLowerCase()

/**
 * Builds the permission catalog from the real FgaPermissions. Each unique `scope:resource` becomes
 * one row; its read scope maps to Read mode and its write/create/delete scopes to Read-write mode.
 */
const buildCatalog = (): PermissionCatalogEntry[] => {
  const byResource = new Map<
    string,
    { title: string; readScopes: string[]; writeScopes: string[] }
  >()

  for (const [scope, scopePerms] of Object.entries(FGA)) {
    for (const [permKey, perm] of Object.entries(scopePerms)) {
      const resourceKey = `${scope.toLowerCase()}:${getResource(permKey)}`
      const action = getAction(permKey)
      if (!byResource.has(resourceKey)) {
        byResource.set(resourceKey, { title: perm.title, readScopes: [], writeScopes: [] })
      }
      const entry = byResource.get(resourceKey)!
      if (action === 'read') entry.readScopes.push(perm.id)
      else entry.writeScopes.push(perm.id)
    }
  }

  const catalog: PermissionCatalogEntry[] = []
  for (const [key, { title, readScopes, writeScopes }] of byResource.entries()) {
    const meta =
      RESOURCE_METADATA[key] ?? RESOURCE_METADATA_FALLBACK(key, title, writeScopes.length > 0)
    catalog.push({
      key,
      category: meta.category,
      name: meta.name,
      description: meta.description,
      risk: meta.risk,
      riskReason: meta.riskReason,
      allowsRead: meta.allowsRead ?? [`Read ${meta.name.toLowerCase()}`],
      allowsWrite:
        meta.allowsWrite ?? (writeScopes.length > 0 ? [`Modify ${meta.name.toLowerCase()}`] : []),
      writable: writeScopes.length > 0,
      readScopes: readScopes as ScopedAccessTokenPermission[],
      writeScopes: writeScopes as ScopedAccessTokenPermission[],
    })
  }
  return catalog
}

export const PERMISSION_CATALOG = buildCatalog()

const CATALOG_BY_KEY = new Map(PERMISSION_CATALOG.map((entry) => [entry.key, entry]))

export const getCatalogEntry = (key: string) => CATALOG_BY_KEY.get(key)

export interface CategoryWithEntries extends PermissionCategory {
  entries: PermissionCatalogEntry[]
}

/** Catalog grouped by category, in category display order, dropping empty categories. */
export const PERMISSION_CATALOG_BY_CATEGORY: CategoryWithEntries[] = PERMISSION_CATEGORIES.map(
  (category) => ({
    ...category,
    entries: PERMISSION_CATALOG.filter((entry) => entry.category === category.key),
  })
).filter((category) => category.entries.length > 0)

/** Map of resource key -> selected mode. Absent keys are treated as 'none'. */
export type PermissionSelection = Record<string, PermissionMode>

/** Flattens a selection into the concrete FGA scope ids to send to the API. */
export const selectionToScopes = (
  selection: PermissionSelection
): ScopedAccessTokenPermission[] => {
  const scopes: ScopedAccessTokenPermission[] = []
  for (const [key, mode] of Object.entries(selection)) {
    if (mode === 'none') continue
    const entry = CATALOG_BY_KEY.get(key)
    if (!entry) continue
    scopes.push(...entry.readScopes)
    if (mode === 'readwrite') scopes.push(...entry.writeScopes)
  }
  return Array.from(new Set(scopes))
}

export const countConfiguredInCategory = (
  selection: PermissionSelection,
  categoryKey: PermissionCategoryKey
): number =>
  PERMISSION_CATALOG.filter(
    (entry) => entry.category === categoryKey && (selection[entry.key] ?? 'none') !== 'none'
  ).length

export const countConfigured = (selection: PermissionSelection): number =>
  Object.values(selection).filter((mode) => mode !== 'none').length

export const RISK_LEVEL_LABEL: Record<RiskLevel, string> = {
  low: 'Low risk',
  medium: 'Medium risk',
  high: 'High risk',
}

export type ResourceAccessMode = 'project' | 'organization' | 'account'

export interface OverallRisk {
  /** Minimal | Low | Medium | Elevated | High */
  level: string
  text: string
  tone: 'default' | 'low' | 'medium' | 'high'
}

/**
 * Computes the overall token risk from the selected capabilities and the resource-access breadth.
 * Account-level tokens are never below "Elevated", even when read-only.
 */
export const computeOverallRisk = (
  selection: PermissionSelection,
  resourceAccess: ResourceAccessMode
): OverallRisk => {
  const active = Object.entries(selection).filter(([, mode]) => mode !== 'none')
  if (active.length === 0) {
    return { level: 'Minimal', text: 'Minimal — no capabilities', tone: 'default' }
  }

  const anyWrite = active.some(([, mode]) => mode === 'readwrite')
  const anyHighWrite = active.some(
    ([key, mode]) => mode === 'readwrite' && CATALOG_BY_KEY.get(key)?.risk === 'high'
  )

  const scopeWord =
    resourceAccess === 'account'
      ? 'account-wide'
      : resourceAccess === 'organization'
        ? 'organization-wide'
        : 'single-project'
  const accessWord = anyWrite ? 'read-write' : 'read-only'

  let level: string
  let tone: OverallRisk['tone']
  if (resourceAccess === 'account') {
    level = anyWrite ? 'High' : 'Elevated'
    tone = anyWrite ? 'high' : 'medium'
  } else if (anyHighWrite) {
    level = 'High'
    tone = 'high'
  } else if (anyWrite) {
    level = 'Medium'
    tone = 'medium'
  } else {
    level = 'Low'
    tone = 'low'
  }

  return { level, text: `${level} — ${scopeWord} ${accessWord} access`, tone }
}
