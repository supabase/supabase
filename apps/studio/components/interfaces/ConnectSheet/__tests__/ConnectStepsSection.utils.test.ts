import { describe, expect, test } from 'vitest'

import type { ConnectMode, ConnectState } from '../Connect.types'
import {
  resolveContentPath,
  shouldFetchDataApiConfig,
  shouldShowDataApiDisabledWarning,
  shouldShowIpv4AddonNotice,
  shouldShowSelfHostedMcpNotice,
  shouldShowSessionPoolerNotice,
} from '../ConnectStepsSection.utils'

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

describe('resolveContentPath', () => {
  test('replaces multiple placeholders with state values', () => {
    const state: ConnectState = {
      mode: 'framework',
      framework: 'nextjs',
      frameworkVariant: 'app',
      library: 'supabasejs',
    }
    expect(resolveContentPath('{{framework}}/{{frameworkVariant}}/{{library}}', state)).toBe(
      'nextjs/app/supabasejs'
    )
  })

  test('filters out segments that resolve to an empty/missing state value', () => {
    const state: ConnectState = { mode: 'framework', framework: 'nextjs' }
    expect(resolveContentPath('{{framework}}/{{frameworkVariant}}', state)).toBe('nextjs')
  })

  test('returns the template unchanged when it has no placeholders', () => {
    const state: ConnectState = { mode: 'direct' }
    expect(resolveContentPath('steps/install', state)).toBe('steps/install')
  })
})

describe('shouldShowIpv4AddonNotice', () => {
  const BASE = {
    isPlatform: true,
    mode: 'direct' as const,
    connectionMethod: 'direct',
    useSharedPooler: false,
    hasIpv4Addon: false,
  }

  test('returns true for a direct connection with no IPv4 addon', () => {
    expect(shouldShowIpv4AddonNotice(BASE)).toBe(true)
  })

  test('returns true for the transaction pooler when not using the shared pooler', () => {
    expect(
      shouldShowIpv4AddonNotice({
        ...BASE,
        connectionMethod: 'transaction',
        useSharedPooler: false,
      })
    ).toBe(true)
  })

  test('returns false for the transaction pooler when using the shared pooler (already IPv4)', () => {
    expect(
      shouldShowIpv4AddonNotice({ ...BASE, connectionMethod: 'transaction', useSharedPooler: true })
    ).toBe(false)
  })

  test('returns false for the session pooler (has its own notice)', () => {
    expect(shouldShowIpv4AddonNotice({ ...BASE, connectionMethod: 'session' })).toBe(false)
  })

  test('returns false when the IPv4 addon is already enabled', () => {
    expect(shouldShowIpv4AddonNotice({ ...BASE, hasIpv4Addon: true })).toBe(false)
  })

  test('returns false when not in direct mode', () => {
    expect(shouldShowIpv4AddonNotice({ ...BASE, mode: 'framework' })).toBe(false)
  })

  test('returns false when self-hosted (not platform)', () => {
    expect(shouldShowIpv4AddonNotice({ ...BASE, isPlatform: false })).toBe(false)
  })
})

describe('shouldShowSessionPoolerNotice', () => {
  test('returns true for the session pooler on platform in direct mode', () => {
    expect(
      shouldShowSessionPoolerNotice({
        isPlatform: true,
        mode: 'direct',
        connectionMethod: 'session',
      })
    ).toBe(true)
  })

  test('returns false when self-hosted (not platform)', () => {
    expect(
      shouldShowSessionPoolerNotice({
        isPlatform: false,
        mode: 'direct',
        connectionMethod: 'session',
      })
    ).toBe(false)
  })

  test('returns false when not in direct mode', () => {
    expect(
      shouldShowSessionPoolerNotice({
        isPlatform: true,
        mode: 'framework',
        connectionMethod: 'session',
      })
    ).toBe(false)
  })

  test('returns false for a non-session connection method', () => {
    expect(
      shouldShowSessionPoolerNotice({
        isPlatform: true,
        mode: 'direct',
        connectionMethod: 'transaction',
      })
    ).toBe(false)
  })
})

describe('shouldShowSelfHostedMcpNotice', () => {
  test('returns true for mcp mode when self-hosted', () => {
    expect(shouldShowSelfHostedMcpNotice({ isSelfHosted: true, mode: 'mcp' })).toBe(true)
  })

  test('returns false for mcp mode on platform', () => {
    expect(shouldShowSelfHostedMcpNotice({ isSelfHosted: false, mode: 'mcp' })).toBe(false)
  })

  test('returns false when self-hosted but not in mcp mode', () => {
    expect(shouldShowSelfHostedMcpNotice({ isSelfHosted: true, mode: 'direct' })).toBe(false)
  })
})
