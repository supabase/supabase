import { describe, expect, test } from 'vitest'

import {
  getCatalogEntry,
  PERMISSION_CATALOG,
  PERMISSION_CATALOG_BY_CATEGORY,
  type PermissionSelection,
} from './AccessToken.permissions'
import {
  applyPreset,
  getActivePresetId,
  getFullAccessDescription,
  getPreset,
  PERMISSION_PRESETS,
} from './AccessToken.presets'

const NONE = getPreset('none')!
const READ = getPreset('read')!
const FULL = getPreset('full')!

describe('PERMISSION_PRESETS', () => {
  test('offers no access, read-only and full access in that order', () => {
    expect(PERMISSION_PRESETS.map((preset) => preset.id)).toEqual(['none', 'read', 'full'])
  })

  test('resolves every catalog entry to a mode its row can render', () => {
    for (const entry of PERMISSION_CATALOG) {
      expect(NONE.resolve(entry)).toBe('none')
      expect(READ.resolve(entry)).toBe('read')
      expect(FULL.resolve(entry)).toBe(entry.writable ? 'readwrite' : 'read')
    }
  })

  test('caps full access at read for resources with no write scopes', () => {
    const readOnlyEntries = PERMISSION_CATALOG.filter((entry) => !entry.writable)
    expect(readOnlyEntries.length).toBeGreaterThan(0)
    for (const entry of readOnlyEntries) {
      expect(FULL.resolve(entry)).toBe('read')
    }
  })

  test('only marks full access as risky, and only it carries a description', () => {
    expect(
      PERMISSION_PRESETS.filter((preset) => preset.isRisky).map((preset) => preset.id)
    ).toEqual(['full'])
    expect(
      PERMISSION_PRESETS.filter((preset) => preset.description !== undefined).map(
        (preset) => preset.id
      )
    ).toEqual(['full'])
  })
})

describe('getFullAccessDescription', () => {
  test('names high-risk resources that exist in the catalog', () => {
    const description = getFullAccessDescription()
    expect(description).toBe(
      'Grants write access to every resource, including your database, API keys, and organization members.'
    )
    for (const key of ['project:database', 'project:api_gateway_keys', 'organization:members']) {
      expect(getCatalogEntry(key)).toBeDefined()
      expect(getCatalogEntry(key)!.risk).toBe('high')
    }
  })
})

describe('applyPreset', () => {
  test('sets every catalog entry by default', () => {
    const selection = applyPreset(READ, {})
    expect(Object.keys(selection)).toHaveLength(PERMISSION_CATALOG.length)
    expect(Object.values(selection).every((mode) => mode === 'read')).toBe(true)
  })

  test('overwrites existing manual choices', () => {
    const selection = applyPreset(NONE, { 'project:database': 'readwrite' })
    expect(selection['project:database']).toBe('none')
  })

  test('leaves entries outside the given subset untouched', () => {
    const database = PERMISSION_CATALOG_BY_CATEGORY.find((category) => category.key === 'database')!
    const before: PermissionSelection = { 'project:advisors': 'read' }
    const selection = applyPreset(FULL, before, database.entries)

    expect(selection['project:advisors']).toBe('read')
    expect(selection['project:database']).toBe('readwrite')
    expect(Object.keys(selection)).toHaveLength(database.entries.length + 1)
  })
})

describe('getActivePresetId', () => {
  test('reads an empty selection as no access', () => {
    expect(getActivePresetId({})).toBe('none')
  })

  test('identifies a selection produced by each preset', () => {
    for (const preset of PERMISSION_PRESETS) {
      expect(getActivePresetId(applyPreset(preset, {}))).toBe(preset.id)
    }
  })

  test('returns null once a single row diverges', () => {
    const selection = applyPreset(READ, {})
    selection['project:storage'] = 'readwrite'
    expect(getActivePresetId(selection)).toBeNull()
  })

  test('ignores rows outside the given subset', () => {
    const database = PERMISSION_CATALOG_BY_CATEGORY.find((category) => category.key === 'database')!
    const selection = applyPreset(READ, {}, database.entries)
    selection['project:storage'] = 'readwrite'

    expect(getActivePresetId(selection)).toBeNull()
    expect(getActivePresetId(selection, database.entries)).toBe('read')
  })
})
