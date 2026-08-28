import { describe, expect, test } from 'vitest'

import type { ConnectMode } from '../Connect.types'
import { mapConnectTabToMode, resolveConnectSheetHydration } from '../ConnectSheet.utils'
import type { ConnectSheetQueryParams } from '../ConnectSheet.utils'
import type { ConnectSheetPrefs } from '../useConnectSheetParams'

const ALL_MODES: ConnectMode[] = ['framework', 'direct', 'orm', 'mcp', 'server']

const EMPTY_QUERY: ConnectSheetQueryParams = {
  connectTab: null,
  framework: null,
  using: null,
  method: null,
  type: null,
  mcpClient: null,
}

const EMPTY_PREFS: ConnectSheetPrefs = {}

describe('mapConnectTabToMode', () => {
  test('returns null for null tab', () => {
    expect(mapConnectTabToMode(null)).toBeNull()
  })

  test('returns null for an unrecognized tab', () => {
    expect(mapConnectTabToMode('not-a-real-tab')).toBeNull()
  })

  test.each(['frameworks', 'mobiles'])('maps "%s" to framework mode', (tab) => {
    expect(mapConnectTabToMode(tab)).toBe('framework')
  })

  test('maps "orms" to orm mode', () => {
    expect(mapConnectTabToMode('orms')).toBe('orm')
  })

  test.each(ALL_MODES)('passes through an already-valid mode "%s"', (mode) => {
    expect(mapConnectTabToMode(mode)).toBe(mode)
  })
})

describe('resolveConnectSheetHydration', () => {
  test('returns no mode, field updates, or URL updates when nothing is stored or in the URL', () => {
    expect(resolveConnectSheetHydration(EMPTY_QUERY, EMPTY_PREFS, ALL_MODES)).toEqual({
      mode: null,
      fieldUpdates: [],
      urlUpdates: {},
    })
  })

  test('resolves mode from the URL when connectTab is already present', () => {
    const result = resolveConnectSheetHydration(
      { ...EMPTY_QUERY, connectTab: 'direct' },
      EMPTY_PREFS,
      ALL_MODES
    )
    expect(result.mode).toBe('direct')
    // Already in the URL, so no need to backfill it.
    expect(result.urlUpdates.connectTab).toBeUndefined()
  })

  test('falls back to storedPrefs.connectTab and backfills the URL', () => {
    const result = resolveConnectSheetHydration(EMPTY_QUERY, { connectTab: 'mcp' }, ALL_MODES)
    expect(result.mode).toBe('mcp')
    expect(result.urlUpdates.connectTab).toBe('mcp')
  })

  test('does not set mode when the mapped mode is unavailable, but still computes field/URL updates', () => {
    const result = resolveConnectSheetHydration(
      { ...EMPTY_QUERY, connectTab: 'direct', method: 'transaction' },
      EMPTY_PREFS,
      ['framework'] // 'direct' is not available
    )
    expect(result.mode).toBeNull()
    expect(result.fieldUpdates).toEqual([{ fieldId: 'connectionMethod', value: 'transaction' }])
  })

  describe('framework mode', () => {
    test('hydrates framework field from storedPrefs and backfills the URL', () => {
      const result = resolveConnectSheetHydration(
        { ...EMPTY_QUERY, connectTab: 'frameworks' },
        { framework: 'nextjs' },
        ALL_MODES
      )
      expect(result.mode).toBe('framework')
      expect(result.fieldUpdates).toEqual([{ fieldId: 'framework', value: 'nextjs' }])
      expect(result.urlUpdates.framework).toBe('nextjs')
    })

    test('also hydrates frameworkVariant when both framework and using are present', () => {
      const result = resolveConnectSheetHydration(
        { ...EMPTY_QUERY, connectTab: 'frameworks' },
        { framework: 'nextjs', using: 'app-router' },
        ALL_MODES
      )
      expect(result.fieldUpdates).toEqual([
        { fieldId: 'framework', value: 'nextjs' },
        { fieldId: 'frameworkVariant', value: 'app-router' },
      ])
      expect(result.urlUpdates.using).toBe('app-router')
    })

    test('does not hydrate frameworkVariant when framework is missing', () => {
      const result = resolveConnectSheetHydration(
        { ...EMPTY_QUERY, connectTab: 'frameworks' },
        { using: 'app-router' },
        ALL_MODES
      )
      expect(result.fieldUpdates).toEqual([])
    })

    test('does not backfill URL params that are already present', () => {
      const result = resolveConnectSheetHydration(
        { ...EMPTY_QUERY, connectTab: 'frameworks', framework: 'nextjs', using: 'app-router' },
        EMPTY_PREFS,
        ALL_MODES
      )
      expect(result.urlUpdates.framework).toBeUndefined()
      expect(result.urlUpdates.using).toBeUndefined()
      // Field updates are still applied to local state even when the URL already has them.
      expect(result.fieldUpdates).toEqual([
        { fieldId: 'framework', value: 'nextjs' },
        { fieldId: 'frameworkVariant', value: 'app-router' },
      ])
    })
  })

  test('orm mode hydrates the "orm" field id (not "framework")', () => {
    const result = resolveConnectSheetHydration(
      { ...EMPTY_QUERY, connectTab: 'orms' },
      { framework: 'prisma' },
      ALL_MODES
    )
    expect(result.mode).toBe('orm')
    expect(result.fieldUpdates).toEqual([{ fieldId: 'orm', value: 'prisma' }])
    expect(result.urlUpdates.framework).toBe('prisma')
  })

  describe('direct mode', () => {
    test('hydrates connectionMethod and connectionType independently', () => {
      const result = resolveConnectSheetHydration(
        { ...EMPTY_QUERY, connectTab: 'direct' },
        { method: 'session', type: 'ipv4' },
        ALL_MODES
      )
      expect(result.fieldUpdates).toEqual([
        { fieldId: 'connectionMethod', value: 'session' },
        { fieldId: 'connectionType', value: 'ipv4' },
      ])
      expect(result.urlUpdates).toEqual({ method: 'session', type: 'ipv4' })
    })
  })

  test('mcp mode hydrates mcpClient', () => {
    const result = resolveConnectSheetHydration(
      { ...EMPTY_QUERY, connectTab: 'mcp' },
      { mcpClient: 'cursor' },
      ALL_MODES
    )
    expect(result.mode).toBe('mcp')
    expect(result.fieldUpdates).toEqual([{ fieldId: 'mcpClient', value: 'cursor' }])
    expect(result.urlUpdates.mcpClient).toBe('cursor')
  })

  test('server mode has no extra fields to hydrate', () => {
    const result = resolveConnectSheetHydration(
      { ...EMPTY_QUERY, connectTab: 'server' },
      { framework: 'nextjs', method: 'session' },
      ALL_MODES
    )
    expect(result.mode).toBe('server')
    expect(result.fieldUpdates).toEqual([])
    expect(result.urlUpdates).toEqual({})
  })
})
