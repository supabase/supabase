import { describe, expect, test } from 'vitest'

import {
  getCatalogEntry,
  getVisibleEntries,
  isEntryVisible,
  PERMISSION_CATALOG,
  PERMISSION_CATALOG_BY_CATEGORY,
  sanitizeSelection,
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

  test('resolves every catalog entry to a mode its row can render, capping full access at read for read-only resources', () => {
    expect(PERMISSION_CATALOG.some((entry) => !entry.writable)).toBe(true)
    for (const entry of PERMISSION_CATALOG) {
      expect(NONE.resolve(entry)).toBe('none')
      expect(READ.resolve(entry)).toBe('read')
      expect(FULL.resolve(entry)).toBe(entry.writable ? 'readwrite' : 'read')
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
      'Grants the highest access each resource offers, including write access to your database, API keys, and organization members.'
    )
    for (const key of ['project:database', 'project:api_gateway_keys', 'organization:members']) {
      expect(getCatalogEntry(key)).toBeDefined()
      expect(getCatalogEntry(key)!.risk).toBe('high')
      // The copy claims write access on these specifically, so they have to be writable
      expect(getCatalogEntry(key)!.writable).toBe(true)
    }
  })
})

describe('applyPreset', () => {
  test('sets every catalog entry by default', () => {
    const selection = applyPreset(READ, {}, 'organization')
    expect(Object.keys(selection)).toHaveLength(PERMISSION_CATALOG.length)
    expect(Object.values(selection).every((mode) => mode === 'read')).toBe(true)
  })

  test('overwrites existing manual choices', () => {
    const selection = applyPreset(NONE, { 'project:database': 'readwrite' }, 'organization')
    expect(selection['project:database']).toBe('none')
  })

  test('leaves entries outside the given subset untouched', () => {
    const database = PERMISSION_CATALOG_BY_CATEGORY.find((category) => category.key === 'database')!
    const before: PermissionSelection = { 'project:advisors': 'read' }
    const selection = applyPreset(FULL, before, 'organization', database.entries)

    expect(selection['project:advisors']).toBe('read')
    expect(selection['project:database']).toBe('readwrite')
    expect(Object.keys(selection)).toHaveLength(database.entries.length + 1)
  })
})

describe('getActivePresetId', () => {
  test('reads an empty selection as no access', () => {
    expect(getActivePresetId({}, 'organization')).toBe('none')
  })

  test('identifies a selection produced by each preset', () => {
    for (const preset of PERMISSION_PRESETS) {
      expect(getActivePresetId(applyPreset(preset, {}, 'organization'), 'organization')).toBe(
        preset.id
      )
    }
  })

  test('returns null once a single row diverges', () => {
    const selection = applyPreset(READ, {}, 'organization')
    selection['project:storage'] = 'readwrite'
    expect(getActivePresetId(selection, 'organization')).toBeNull()
  })

  test('ignores rows outside the given subset', () => {
    const database = PERMISSION_CATALOG_BY_CATEGORY.find((category) => category.key === 'database')!
    const selection = applyPreset(READ, {}, 'organization', database.entries)
    selection['project:storage'] = 'readwrite'

    expect(getActivePresetId(selection, 'organization')).toBeNull()
    expect(getActivePresetId(selection, 'organization', database.entries)).toBe('read')
  })
})

describe('presets on project scope', () => {
  test('sets only the visible rows, leaving hidden ones absent', () => {
    for (const preset of PERMISSION_PRESETS) {
      const selection = applyPreset(preset, {}, 'project')
      const keys = Object.keys(selection)

      expect(keys).toEqual(getVisibleEntries('project').map((entry) => entry.key))
      expect(keys.every((key) => isEntryVisible(key, 'project'))).toBe(true)
    }
  })

  test('never sets Organization Settings to Read', () => {
    for (const preset of PERMISSION_PRESETS) {
      expect(applyPreset(preset, {}, 'project')['organization:admin']).not.toBe('read')
    }
    expect(applyPreset(READ, {}, 'project')['organization:admin']).toBe('none')
    expect(applyPreset(FULL, {}, 'project')['organization:admin']).toBe('readwrite')
    expect(applyPreset(READ, {}, 'organization')['organization:admin']).toBe('read')
  })

  test('leaves a hidden row at none after a scope switch reset it', () => {
    const configuredOnOrgScope: PermissionSelection = { 'organization:members': 'readwrite' }
    const afterSwitch = sanitizeSelection(configuredOnOrgScope, 'project')

    expect(applyPreset(FULL, afterSwitch, 'project')['organization:members']).toBe('none')
    expect(applyPreset(READ, afterSwitch, 'project')['organization:members']).toBe('none')
  })

  test('still reports the applied preset as active on project scope', () => {
    for (const preset of PERMISSION_PRESETS) {
      expect(getActivePresetId(applyPreset(preset, {}, 'project'), 'project')).toBe(preset.id)
    }
  })
})
