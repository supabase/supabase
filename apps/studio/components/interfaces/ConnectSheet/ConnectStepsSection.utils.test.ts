import { describe, expect, test } from 'vitest'

import type { ConnectMode } from './Connect.types'
import {
  shouldFetchDataApiConfig,
  shouldShowDataApiDisabledWarning,
} from './ConnectStepsSection.utils'

const ALL_MODES: ConnectMode[] = ['framework', 'direct', 'orm', 'mcp', 'server']
const MCP_WITH_DATABASE_TOOLS = {
  mode: 'mcp' as const,
  mcpFeatures: ['database'],
}

describe('shouldFetchDataApiConfig', () => {
  test('returns true for framework mode', () => {
    expect(shouldFetchDataApiConfig({ mode: 'framework' })).toBe(true)
  })

  test.each(['direct', 'orm', 'server', 'mcp'] as const)('returns false for %s mode', (mode) => {
    expect(shouldFetchDataApiConfig({ mode })).toBe(false)
  })

  test('returns false for mcp even when database tools are selected', () => {
    expect(shouldFetchDataApiConfig(MCP_WITH_DATABASE_TOOLS)).toBe(false)
  })
})

describe('shouldShowDataApiDisabledWarning', () => {
  test.each(ALL_MODES)('returns false while pending for %s mode', (mode) => {
    expect(
      shouldShowDataApiDisabledWarning({
        mode,
        isDataApiEnabled: false,
        isPending: true,
        isError: false,
      })
    ).toBe(false)
  })

  test('returns false when config query errored', () => {
    expect(
      shouldShowDataApiDisabledWarning({
        mode: 'framework',
        isDataApiEnabled: false,
        isPending: false,
        isError: true,
      })
    ).toBe(false)
  })

  test('returns true for framework when Data API is disabled', () => {
    expect(
      shouldShowDataApiDisabledWarning({
        mode: 'framework',
        isDataApiEnabled: false,
        isPending: false,
        isError: false,
      })
    ).toBe(true)
  })

  test.each(['direct', 'orm', 'server', 'mcp'] as const)(
    'returns false for %s when Data API is disabled',
    (mode) => {
      expect(
        shouldShowDataApiDisabledWarning({
          mode,
          isDataApiEnabled: false,
          isPending: false,
          isError: false,
        })
      ).toBe(false)
    }
  )

  test('returns false for mcp with database tools selected when Data API is disabled', () => {
    expect(
      shouldShowDataApiDisabledWarning({
        ...MCP_WITH_DATABASE_TOOLS,
        isDataApiEnabled: false,
        isPending: false,
        isError: false,
      })
    ).toBe(false)
  })

  test('returns false when framework mode has Data API enabled', () => {
    expect(
      shouldShowDataApiDisabledWarning({
        mode: 'framework',
        isDataApiEnabled: true,
        isPending: false,
        isError: false,
      })
    ).toBe(false)
  })
})
