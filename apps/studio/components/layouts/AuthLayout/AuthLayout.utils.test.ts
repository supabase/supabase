import { describe, expect, it } from 'vitest'

import { generateAuthMenu, GenerateAuthMenuOptions } from './AuthLayout.utils'

const allFeaturesEnabled: GenerateAuthMenuOptions = {
  ref: 'test-ref',
  isPlatform: true,
  showOverview: true,
  features: {
    signInProviders: true,
    rateLimits: true,
    emails: true,
    multiFactor: true,
    attackProtection: true,
    performance: true,
    passkeys: true,
  },
}

const allFeaturesDisabled: GenerateAuthMenuOptions = {
  ref: 'test-ref',
  isPlatform: true,
  showOverview: false,
  features: {
    signInProviders: false,
    rateLimits: false,
    emails: false,
    multiFactor: false,
    attackProtection: false,
    performance: false,
    passkeys: true,
  },
}

function flatItemNames(menu: ReturnType<typeof generateAuthMenu>): string[] {
  return menu.flatMap((group) => group.items.map((item) => item.name))
}

function findItem(menu: ReturnType<typeof generateAuthMenu>, name: string) {
  for (const group of menu) {
    const item = group.items.find((i) => i.name === name)
    if (item) return item
  }
  return undefined
}

describe('generateAuthMenu', () => {
  it('platform with all features enabled includes all menu items', () => {
    const menu = generateAuthMenu(allFeaturesEnabled)
    const names = flatItemNames(menu)

    expect(names).toContain('Overview')
    expect(names).toContain('Users')
    expect(names).toContain('OAuth Apps')
    expect(names).toContain('Email')
    expect(names).toContain('Sign In / Providers')
    expect(names).toContain('OAuth Server')
    expect(names).toContain('Passkeys')
    expect(names).toContain('Sessions')
    expect(names).toContain('Rate Limits')
    expect(names).toContain('Multi-Factor')
    expect(names).toContain('URL Configuration')
    expect(names).toContain('Attack Protection')
    expect(names).toContain('Auth Hooks')
    expect(names).toContain('Audit Logs')
    expect(names).toContain('Performance')
  })

  it('platform with all features disabled shows only core items', () => {
    const menu = generateAuthMenu(allFeaturesDisabled)
    const names = flatItemNames(menu)

    expect(names).toContain('Users')
    expect(names).toContain('OAuth Apps')
    expect(names).toContain('Policies')
    expect(names).toContain('OAuth Server')
    expect(names).toContain('Passkeys')
    expect(names).toContain('Sessions')
    expect(names).toContain('URL Configuration')
    expect(names).toContain('Auth Hooks')
    expect(names).toContain('Audit Logs')

    expect(names).not.toContain('Overview')
    expect(names).not.toContain('Email')
    expect(names).not.toContain('Sign In / Providers')
    expect(names).not.toContain('Rate Limits')
    expect(names).not.toContain('Multi-Factor')
    expect(names).not.toContain('Attack Protection')
    expect(names).not.toContain('Performance')
  })

  it('self-hosted hides OAuth Apps, Notifications, and platform-only Configuration items', () => {
    const menu = generateAuthMenu({
      ...allFeaturesEnabled,
      isPlatform: false,
    })
    const names = flatItemNames(menu)
    const groupTitles = menu.map((g) => g.title)

    expect(names).not.toContain('OAuth Apps')
    expect(groupTitles).not.toContain('Notifications')

    // Configuration should only have Policies
    const configGroup = menu.find((g) => g.title === 'Configuration')!
    expect(configGroup.items).toHaveLength(1)
    expect(configGroup.items[0].name).toBe('Policies')
  })

  it('shows Overview when showOverview is true', () => {
    const menu = generateAuthMenu({ ...allFeaturesDisabled, showOverview: true })
    expect(flatItemNames(menu)).toContain('Overview')
  })

  it('hides Overview when showOverview is false', () => {
    const menu = generateAuthMenu({ ...allFeaturesEnabled, showOverview: false })
    expect(flatItemNames(menu)).not.toContain('Overview')
  })

  it.each([
    ['signInProviders', 'Sign In / Providers'],
    ['rateLimits', 'Rate Limits'],
    ['emails', 'Email'],
    ['multiFactor', 'Multi-Factor'],
    ['attackProtection', 'Attack Protection'],
    ['performance', 'Performance'],
  ] as const)('feature flag %s toggles %s', (flag, itemName) => {
    const withEnabled = generateAuthMenu({
      ...allFeaturesDisabled,
      features: { ...allFeaturesDisabled.features, [flag]: true },
    })
    const withDisabled = generateAuthMenu({
      ...allFeaturesEnabled,
      features: { ...allFeaturesEnabled.features, [flag]: false },
    })

    expect(flatItemNames(withEnabled)).toContain(itemName)
    expect(flatItemNames(withDisabled)).not.toContain(itemName)
  })

  it('generates correct URLs using the ref parameter', () => {
    const menu = generateAuthMenu({ ...allFeaturesEnabled, ref: 'my-project' })
    const users = findItem(menu, 'Users')
    const oauthApps = findItem(menu, 'OAuth Apps')

    expect(users?.url).toBe('/project/my-project/auth/users')
    expect(oauthApps?.url).toBe('/project/my-project/auth/oauth-apps')
  })

  it('hides Passkeys when passkeys feature is false', () => {
    const menu = generateAuthMenu({
      ...allFeaturesEnabled,
      features: { ...allFeaturesEnabled.features, passkeys: false },
    })
    expect(flatItemNames(menu)).not.toContain('Passkeys')
  })
})
