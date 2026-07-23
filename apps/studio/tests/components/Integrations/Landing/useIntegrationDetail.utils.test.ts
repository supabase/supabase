import { describe, expect, it } from 'vitest'

import type { IntegrationDefinition } from '@/components/interfaces/Integrations/Landing/Integrations.constants'
import { getInstallActionType } from '@/components/interfaces/Integrations/Landing/useIntegrationDetail.utils'

// Minimal stubs — only fields exercised by the utils
const oauthIntegration = {
  id: 'github',
  type: 'oauth' as const,
  requiredExtensions: [],
  navigation: [{ route: 'overview', label: 'Overview' }],
} as unknown as IntegrationDefinition

const wrapperIntegration = {
  id: 'stripe_wrapper',
  type: 'wrapper' as const,
  requiredExtensions: ['wrappers', 'supabase_vault'],
  navigation: [
    { route: 'overview', label: 'Overview' },
    { route: 'wrappers', label: 'Wrappers' },
  ],
} as unknown as IntegrationDefinition

const extensionIntegration = {
  id: 'queues',
  type: 'postgres_extension' as const,
  requiredExtensions: ['pgmq'],
  navigation: [{ route: 'overview', label: 'Overview' }],
} as unknown as IntegrationDefinition

describe('getInstallActionType', () => {
  it('returns null when integration is undefined', () => {
    expect(getInstallActionType({ integration: undefined, isInstalled: false })).toBeNull()
  })

  it('returns "oauth" for OAuth integrations', () => {
    expect(getInstallActionType({ integration: oauthIntegration, isInstalled: false })).toBe(
      'oauth'
    )
  })

  it('returns "oauth" for installed OAuth integrations (type check takes priority)', () => {
    expect(getInstallActionType({ integration: oauthIntegration, isInstalled: true })).toBe(
      'oauth'
    )
  })

  it('returns "add-wrapper" for wrapper integrations', () => {
    expect(getInstallActionType({ integration: wrapperIntegration, isInstalled: false })).toBe(
      'add-wrapper'
    )
  })

  it('returns "add-wrapper" for installed wrapper integrations (type check takes priority)', () => {
    expect(getInstallActionType({ integration: wrapperIntegration, isInstalled: true })).toBe(
      'add-wrapper'
    )
  })

  it('returns "installed" for a non-wrapper installed integration', () => {
    expect(getInstallActionType({ integration: extensionIntegration, isInstalled: true })).toBe(
      'installed'
    )
  })

  it('returns "install-sheet" for an uninstalled non-wrapper integration', () => {
    expect(getInstallActionType({ integration: extensionIntegration, isInstalled: false })).toBe(
      'install-sheet'
    )
  })
})
