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
  const BASE: Parameters<typeof shouldShowIpv4AddonNotice>[0] = {
    isPlatform: true,
    isAws: true,
    isIpv4Enabled: true,
    mode: 'direct',
    connectionMethod: 'direct',
    useSharedPooler: false,
    hasIpv4Addon: false,
    isHighAvailability: false,
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

  test.each<[string, Partial<typeof BASE>]>([
    [
      'the transaction pooler via the shared pooler (already IPv4)',
      { connectionMethod: 'transaction', useSharedPooler: true },
    ],
    ['the session pooler (has its own notice)', { connectionMethod: 'session' }],
    ['the IPv4 addon is already enabled', { hasIpv4Addon: true }],
    ['not in direct mode', { mode: 'framework' }],
    ['self-hosted (not platform)', { isPlatform: false }],
    ['not on AWS (e.g. Multigres/Fly)', { isAws: false }],
    ['the IPv4 add-on is not enabled for the project', { isIpv4Enabled: false }],
    ['high-availability projects', { isHighAvailability: true }],
  ])('returns false for %s', (_label, overrides) => {
    expect(shouldShowIpv4AddonNotice({ ...BASE, ...overrides })).toBe(false)
  })
})

describe('shouldShowSessionPoolerNotice', () => {
  const BASE: Parameters<typeof shouldShowSessionPoolerNotice>[0] = {
    isPlatform: true,
    mode: 'direct',
    connectionMethod: 'session',
  }

  test('returns true for the session pooler on platform in direct mode', () => {
    expect(shouldShowSessionPoolerNotice(BASE)).toBe(true)
  })

  test.each<[string, Partial<typeof BASE>]>([
    ['self-hosted (not platform)', { isPlatform: false }],
    ['not in direct mode', { mode: 'framework' }],
    ['a non-session connection method', { connectionMethod: 'transaction' }],
  ])('returns false for %s', (_label, overrides) => {
    expect(shouldShowSessionPoolerNotice({ ...BASE, ...overrides })).toBe(false)
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
