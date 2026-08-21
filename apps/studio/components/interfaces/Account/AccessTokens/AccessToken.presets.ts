import {
  getCatalogEntry,
  PERMISSION_CATALOG,
  type PermissionCatalogEntry,
  type PermissionMode,
  type PermissionSelection,
} from './AccessToken.permissions'

/**
 * Bulk presets for the permission list. Setting 42 rows one at a time is the main reason people
 * abandon the scoped token flow, so a preset applies a mode to every row at once and the user
 * fine-tunes from there.
 *
 * A preset is data, not JSX: `resolve` maps a single catalog entry to a mode, and every helper
 * below takes an `entries` subset (defaulting to the whole catalog) so the same presets can later
 * back per-category "set all" controls, or move server-side.
 */

export type PermissionPresetId = 'none' | 'read' | 'full'

export interface PermissionPreset {
  id: PermissionPresetId
  label: string
  /** Optional subtext, shown beneath the label in the menu. */
  description?: string
  /** Surfaces the description as an inline warning once applied. */
  isRisky?: boolean
  /** Announced in a live region once the preset is applied. */
  announcement: string
  resolve: (entry: PermissionCatalogEntry) => PermissionMode
}

/**
 * High-risk resources named in the Full access warning. Keyed by catalog key so the copy can only
 * name scopes that actually exist — AccessToken.presets.test.ts asserts every key resolves.
 */
const FULL_ACCESS_HIGH_RISK: { key: string; noun: string }[] = [
  { key: 'project:database', noun: 'your database' },
  { key: 'project:api_gateway_keys', noun: 'API keys' },
  { key: 'organization:members', noun: 'organization members' },
]

export const getFullAccessDescription = (): string => {
  const nouns = FULL_ACCESS_HIGH_RISK.filter(({ key }) => getCatalogEntry(key) !== undefined).map(
    ({ noun }) => noun
  )
  if (nouns.length === 0) return 'Grants write access to every resource.'
  const listed =
    nouns.length === 1
      ? nouns[0]
      : `${nouns.slice(0, -1).join(', ')}, and ${nouns[nouns.length - 1]}`
  return `Grants write access to every resource, including ${listed}.`
}

export const PERMISSION_PRESETS: PermissionPreset[] = [
  {
    id: 'none',
    label: 'No access',
    announcement: 'All permissions set to none',
    resolve: () => 'none',
  },
  {
    id: 'read',
    label: 'Read-only',
    announcement: 'All permissions set to read',
    resolve: () => 'read',
  },
  {
    id: 'full',
    label: 'Full access',
    description: getFullAccessDescription(),
    isRisky: true,
    announcement: 'All permissions set to read-write',
    // Five resources expose no write scopes, so read is their highest level — resolving them to
    // 'readwrite' would store a mode their Select can't render.
    resolve: (entry) => (entry.writable ? 'readwrite' : 'read'),
  },
]

export const getPreset = (id: PermissionPresetId): PermissionPreset | undefined =>
  PERMISSION_PRESETS.find((preset) => preset.id === id)

/** Applies a preset over `entries`, leaving any selection outside that subset untouched. */
export const applyPreset = (
  preset: PermissionPreset,
  selection: PermissionSelection,
  entries: PermissionCatalogEntry[] = PERMISSION_CATALOG
): PermissionSelection => {
  const next = { ...selection }
  for (const entry of entries) {
    next[entry.key] = preset.resolve(entry)
  }
  return next
}

/**
 * The preset `selection` currently matches across `entries`, or null when it matches none of them
 * — the "Custom" state, which is displayed but never selectable.
 */
export const getActivePresetId = (
  selection: PermissionSelection,
  entries: PermissionCatalogEntry[] = PERMISSION_CATALOG
): PermissionPresetId | null => getActivePreset(selection, entries)?.id ?? null

export const getActivePreset = (
  selection: PermissionSelection,
  entries: PermissionCatalogEntry[] = PERMISSION_CATALOG
): PermissionPreset | undefined =>
  PERMISSION_PRESETS.find((preset) =>
    entries.every((entry) => (selection[entry.key] ?? 'none') === preset.resolve(entry))
  )
