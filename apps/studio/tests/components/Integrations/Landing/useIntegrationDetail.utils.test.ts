import { describe, expect, it } from 'vitest'

import type { IntegrationDefinition } from '@/components/interfaces/Integrations/Landing/Integrations.constants'
import {
  areRequiredExtensionsInstalledFor,
  getFilteredNavItems,
  getInstallActionType,
} from '@/components/interfaces/Integrations/Landing/useIntegrationDetail.utils'

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

// ─── areRequiredExtensionsInstalledFor ───────────────────────────────────────

describe('areRequiredExtensionsInstalledFor', () => {
  it('returns false when integration is undefined', () => {
    expect(areRequiredExtensionsInstalledFor(undefined, [])).toBe(false)
  })

  it('returns false when extensions list is undefined', () => {
    expect(areRequiredExtensionsInstalledFor(extensionIntegration, undefined)).toBe(false)
  })

  it('returns false when integration has no required extensions', () => {
    const noExts = {
      ...extensionIntegration,
      requiredExtensions: [],
    } as unknown as IntegrationDefinition
    expect(
      areRequiredExtensionsInstalledFor(noExts, [{ name: 'pgmq', installed_version: '1.0' }])
    ).toBe(false)
  })

  it('returns false when a required extension is not installed', () => {
    expect(
      areRequiredExtensionsInstalledFor(extensionIntegration, [
        { name: 'pgmq', installed_version: null },
      ])
    ).toBe(false)
  })

  it('returns false when a required extension is missing from list entirely', () => {
    expect(areRequiredExtensionsInstalledFor(extensionIntegration, [])).toBe(false)
  })

  it('returns true when all required extensions are installed', () => {
    expect(
      areRequiredExtensionsInstalledFor(extensionIntegration, [
        { name: 'pgmq', installed_version: '1.4.4' },
      ])
    ).toBe(true)
  })

  it('returns true only when every required extension is installed (multiple)', () => {
    expect(
      areRequiredExtensionsInstalledFor(wrapperIntegration, [
        { name: 'wrappers', installed_version: '0.4.1' },
        { name: 'supabase_vault', installed_version: '0.2.8' },
      ])
    ).toBe(true)
  })

  it('returns false when only some of multiple required extensions are installed', () => {
    expect(
      areRequiredExtensionsInstalledFor(wrapperIntegration, [
        { name: 'wrappers', installed_version: '0.4.1' },
        { name: 'supabase_vault', installed_version: null },
      ])
    ).toBe(false)
  })
})

// ─── getFilteredNavItems ─────────────────────────────────────────────────────

describe('getFilteredNavItems', () => {
  it('returns empty array when integration is undefined', () => {
    expect(
      getFilteredNavItems({
        integration: undefined,
        isInstalled: false,
        isMarketplaceEnabled: false,
        areRequiredExtensionsInstalled: false,
      })
    ).toEqual([])
  })

  it('returns empty array when integration has no navigation', () => {
    const noNav = {
      ...wrapperIntegration,
      navigation: undefined,
    } as unknown as IntegrationDefinition
    expect(
      getFilteredNavItems({
        integration: noNav,
        isInstalled: false,
        isMarketplaceEnabled: false,
        areRequiredExtensionsInstalled: false,
      })
    ).toEqual([])
  })

  it('returns full navigation for non-wrapper integrations regardless of flags', () => {
    const result = getFilteredNavItems({
      integration: extensionIntegration,
      isInstalled: false,
      isMarketplaceEnabled: false,
      areRequiredExtensionsInstalled: false,
    })
    expect(result).toEqual(extensionIntegration.navigation)
  })

  it('returns full navigation for installed wrapper integrations', () => {
    const result = getFilteredNavItems({
      integration: wrapperIntegration,
      isInstalled: true,
      isMarketplaceEnabled: false,
      areRequiredExtensionsInstalled: false,
    })
    expect(result).toEqual(wrapperIntegration.navigation)
  })

  it('hides wrappers tab for uninstalled wrapper when marketplace is off and extensions missing', () => {
    const result = getFilteredNavItems({
      integration: wrapperIntegration,
      isInstalled: false,
      isMarketplaceEnabled: false,
      areRequiredExtensionsInstalled: false,
    })
    expect(result.some((nav) => nav.route === 'wrappers')).toBe(false)
    expect(result.some((nav) => nav.route === 'overview')).toBe(true)
  })

  it('shows wrappers tab when marketplace flag is enabled', () => {
    const result = getFilteredNavItems({
      integration: wrapperIntegration,
      isInstalled: false,
      isMarketplaceEnabled: true,
      areRequiredExtensionsInstalled: false,
    })
    expect(result).toEqual(wrapperIntegration.navigation)
  })

  it('shows wrappers tab when required extensions are installed', () => {
    const result = getFilteredNavItems({
      integration: wrapperIntegration,
      isInstalled: false,
      isMarketplaceEnabled: false,
      areRequiredExtensionsInstalled: true,
    })
    expect(result).toEqual(wrapperIntegration.navigation)
  })
})

// ─── getInstallActionType ────────────────────────────────────────────────────

describe('getInstallActionType', () => {
  it('returns null when integration is undefined', () => {
    expect(
      getInstallActionType({
        integration: undefined,
        isMarketplaceEnabled: false,
        areRequiredExtensionsInstalled: false,
        isInstalled: false,
      })
    ).toBeNull()
  })

  it('returns "oauth" for OAuth integrations', () => {
    expect(
      getInstallActionType({
        integration: oauthIntegration,
        isMarketplaceEnabled: false,
        areRequiredExtensionsInstalled: false,
        isInstalled: false,
      })
    ).toBe('oauth')
  })

  it('returns "oauth" for installed OAuth integrations (type check takes priority)', () => {
    expect(
      getInstallActionType({
        integration: oauthIntegration,
        isMarketplaceEnabled: true,
        areRequiredExtensionsInstalled: true,
        isInstalled: true,
      })
    ).toBe('oauth')
  })

  it('returns "add-wrapper" for wrapper when marketplace is enabled', () => {
    expect(
      getInstallActionType({
        integration: wrapperIntegration,
        isMarketplaceEnabled: true,
        areRequiredExtensionsInstalled: false,
        isInstalled: false,
      })
    ).toBe('add-wrapper')
  })

  it('returns "add-wrapper" for wrapper when required extensions are installed', () => {
    expect(
      getInstallActionType({
        integration: wrapperIntegration,
        isMarketplaceEnabled: false,
        areRequiredExtensionsInstalled: true,
        isInstalled: false,
      })
    ).toBe('add-wrapper')
  })

  it('returns "installed" for a non-wrapper installed integration when marketplace is off', () => {
    expect(
      getInstallActionType({
        integration: extensionIntegration,
        isMarketplaceEnabled: false,
        areRequiredExtensionsInstalled: false,
        isInstalled: true,
      })
    ).toBe('installed')
  })

  it('returns "install-sheet" for an uninstalled non-wrapper integration', () => {
    expect(
      getInstallActionType({
        integration: extensionIntegration,
        isMarketplaceEnabled: false,
        areRequiredExtensionsInstalled: false,
        isInstalled: false,
      })
    ).toBe('install-sheet')
  })

  it('returns "install-sheet" for wrapper when marketplace off and extensions missing and not installed', () => {
    expect(
      getInstallActionType({
        integration: wrapperIntegration,
        isMarketplaceEnabled: false,
        areRequiredExtensionsInstalled: false,
        isInstalled: false,
      })
    ).toBe('install-sheet')
  })
})
