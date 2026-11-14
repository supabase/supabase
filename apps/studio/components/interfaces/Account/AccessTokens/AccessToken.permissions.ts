import {
  getCatalogEntry,
  PERMISSION_CATALOG,
  PERMISSION_CATALOG_BY_CATEGORY,
  PERMISSION_MODE_LABEL,
  type CategoryWithEntries,
  type PermissionCatalogEntry,
  type PermissionCategoryKey,
  type PermissionMode,
  type RiskLevel,
} from 'shared-data/scoped-access-token-permissions'

import type { ScopedAccessTokenPermission } from './AccessToken.constants'

export {
  getCatalogEntry,
  PERMISSION_CATALOG,
  PERMISSION_CATALOG_BY_CATEGORY,
  PERMISSION_MODE_LABEL,
}
export type { CategoryWithEntries, PermissionCatalogEntry, PermissionMode, RiskLevel }

/**
 * Selection model for the scoped personal access token creation flow: none/read/readwrite modes per
 * catalog entry, and the conversions between a selection and concrete FGA scope ids.
 *
 * The catalog itself (resources, categories, risk metadata, scopes) lives in
 * shared-data/scoped-access-token-permissions.ts so the docs generator can consume it too.
 */

/** Map of resource key -> selected mode. Absent keys are treated as 'none'. */
export type PermissionSelection = Record<string, PermissionMode>

/** FGA scope ids a catalog entry grants at the given mode. */
export const getEntryScopes = (
  entry: PermissionCatalogEntry,
  mode: PermissionMode
): ScopedAccessTokenPermission[] => {
  if (mode === 'none') return []
  if (mode === 'readwrite') return [...entry.readScopes, ...entry.writeScopes]
  return entry.readScopes
}

/** Flattens a selection into the concrete FGA scope ids to send to the API. */
export const selectionToScopes = (
  selection: PermissionSelection
): ScopedAccessTokenPermission[] => {
  const scopes: ScopedAccessTokenPermission[] = []
  for (const [key, mode] of Object.entries(selection)) {
    const entry = getCatalogEntry(key)
    if (!entry) continue
    scopes.push(...getEntryScopes(entry, mode))
  }
  return Array.from(new Set(scopes))
}

/**
 * Reverses `selectionToScopes`: derives a selection from a token's granted FGA scope ids.
 *
 * Tokens created through the Management API can hold arbitrary scope subsets that the
 * none/read/readwrite modes cannot represent exactly (e.g. a lone branching_development_create).
 * Any granted scope of an entry marks it at the corresponding mode, so a partial grant is never
 * dropped. The mode is an upper bound and may name specific operations the token lacks, but it
 * never understates the token's authority or risk. The endpoint and MCP-tool lists, computed
 * from the actual granted scopes, remain the precise view.
 */
export const scopesToSelection = (grantedScopes: string[]): PermissionSelection => {
  const granted = new Set(grantedScopes)
  const selection: PermissionSelection = {}
  for (const entry of PERMISSION_CATALOG) {
    const hasWrite = entry.writeScopes.some((scope) => granted.has(scope))
    const hasRead = entry.readScopes.some((scope) => granted.has(scope))
    if (hasWrite) selection[entry.key] = 'readwrite'
    else if (hasRead) selection[entry.key] = 'read'
  }
  return selection
}

const PROJECT_SCOPE_HIDDEN_KEYS = new Set<string>([
  'user:organizations',
  'organization:audit_logs',
  'organization:billing',
  'organization:config',
  'organization:members',
  'organization:projects',
  'organization:platform_webhooks',
  'project:auth_hooks',
  'project:auth_users',
  'project:operations',
  'project:snippets',
])

const PROJECT_SCOPE_MODES: Record<string, PermissionMode[]> = {
  'organization:admin': ['none', 'readwrite'],
}

export const isEntryVisible = (key: string, resourceAccess: ResourceAccessMode): boolean =>
  resourceAccess !== 'project' || !PROJECT_SCOPE_HIDDEN_KEYS.has(key)

export const getEntryModes = (
  entry: PermissionCatalogEntry,
  resourceAccess: ResourceAccessMode
): PermissionMode[] => {
  const restricted = resourceAccess === 'project' ? PROJECT_SCOPE_MODES[entry.key] : undefined
  const modes = restricted ?? ['none', 'read', 'readwrite']
  return modes.filter((mode) => mode !== 'readwrite' || entry.writable)
}

export const getVisibleEntries = (resourceAccess: ResourceAccessMode): PermissionCatalogEntry[] =>
  PERMISSION_CATALOG.filter((entry) => isEntryVisible(entry.key, resourceAccess))

export const getVisibleCategories = (resourceAccess: ResourceAccessMode): CategoryWithEntries[] =>
  PERMISSION_CATALOG_BY_CATEGORY.map((category) => ({
    ...category,
    entries: category.entries.filter((entry) => isEntryVisible(entry.key, resourceAccess)),
  })).filter((category) => category.entries.length > 0)

export const sanitizeSelection = (
  selection: PermissionSelection,
  resourceAccess: ResourceAccessMode
): PermissionSelection => {
  const next: PermissionSelection = {}
  for (const [key, mode] of Object.entries(selection)) {
    const entry = getCatalogEntry(key)
    const isAllowed =
      entry !== undefined &&
      isEntryVisible(key, resourceAccess) &&
      getEntryModes(entry, resourceAccess).includes(mode)
    next[key] = isAllowed ? mode : 'none'
  }
  return next
}

export const countConfiguredInCategory = (
  selection: PermissionSelection,
  categoryKey: PermissionCategoryKey,
  resourceAccess: ResourceAccessMode
): number =>
  PERMISSION_CATALOG.filter(
    (entry) =>
      entry.category === categoryKey &&
      isEntryVisible(entry.key, resourceAccess) &&
      (selection[entry.key] ?? 'none') !== 'none'
  ).length

export const countConfigured = (
  selection: PermissionSelection,
  resourceAccess: ResourceAccessMode
): number =>
  PERMISSION_CATALOG.filter(
    (entry) =>
      isEntryVisible(entry.key, resourceAccess) && (selection[entry.key] ?? 'none') !== 'none'
  ).length

export const RISK_LEVEL_LABEL: Record<RiskLevel, string> = {
  low: 'Low risk',
  medium: 'Medium risk',
  high: 'High risk',
}

export type ResourceAccessMode = 'project' | 'organization' | 'account'

export const RISK_TONE_VARIANT: Record<RiskLevel, 'success' | 'warning' | 'destructive'> = {
  low: 'success',
  medium: 'warning',
  high: 'destructive',
}
