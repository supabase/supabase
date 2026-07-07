import { describe, expect, it } from 'vitest'

import {
  generateOrganizationSettingsMenuItems,
  generateOrganizationSettingsSections,
  normalizeOrganizationSettingsPath,
} from './OrganizationSettingsLayout'
import { SHORTCUT_IDS } from '@/state/shortcuts/registry'

describe('generateOrganizationSettingsMenuItems', () => {
  it('includes webhooks entry for organization settings nav', () => {
    const items = generateOrganizationSettingsMenuItems({
      slug: 'my-org',
      showSecuritySettings: true,
      showSsoSettings: true,
      showLegalDocuments: true,
    })

    expect(items.some((item) => item.label === 'Webhooks')).toBe(true)
    expect(items.some((item) => item.href === '/org/my-org/webhooks')).toBe(true)
  })
})

describe('OrganizationSettingsLayout helpers', () => {
  it('returns expected organization settings sections and links', () => {
    const sections = generateOrganizationSettingsSections({
      slug: 'my-org',
      currentPath: '/org/my-org/general',
      showSecuritySettings: true,
      showSsoSettings: true,
      showLegalDocuments: true,
    })

    expect(sections.map((section) => section.heading)).toEqual([
      'Configuration',
      'Connections',
      'Compliance',
    ])
    expect(sections.flatMap((section) => section.links.map((item) => item.label))).toEqual([
      'General',
      'Security',
      'SSO',
      'OAuth Apps',
      'Webhooks',
      'Audit Logs',
      'Legal Documents',
    ])
    expect(
      sections.flatMap((section) => section.links).find((item) => item.label === 'General')
        ?.isActive
    ).toBe(true)
  })

  it('hides feature-flagged items when flags are disabled', () => {
    const sections = generateOrganizationSettingsSections({
      slug: 'my-org',
      currentPath: '/org/my-org/general',
      showSecuritySettings: false,
      showSsoSettings: false,
      showLegalDocuments: false,
    })

    expect(sections.map((section) => section.heading)).toEqual([
      'Configuration',
      'Connections',
      'Compliance',
    ])
    expect(sections.flatMap((section) => section.links.map((item) => item.label))).toEqual([
      'General',
      'OAuth Apps',
      'Webhooks',
      'Audit Logs',
    ])
  })

  it('normalizes hash paths for active state checks', () => {
    const currentPath = normalizeOrganizationSettingsPath('/org/my-org/security#sso')
    const sections = generateOrganizationSettingsSections({
      slug: 'my-org',
      currentPath,
      showSecuritySettings: true,
      showSsoSettings: true,
      showLegalDocuments: true,
    })

    expect(
      sections.flatMap((section) => section.links).find((item) => item.label === 'Security')
        ?.isActive
    ).toBe(true)
  })

  it('attaches shortcutId to each settings link', () => {
    const sections = generateOrganizationSettingsSections({
      slug: 'my-org',
      currentPath: '/org/my-org/general',
      showSecuritySettings: true,
      showSsoSettings: true,
      showLegalDocuments: true,
      showPlatformWebhooks: true,
    })

    const allLinks = sections.flatMap((s) => s.links)
    const linkByKey = (key: string) => allLinks.find((l) => l.key === key)

    expect(linkByKey('general')?.shortcutId).toBe(SHORTCUT_IDS.NAV_ORG_SETTINGS_GENERAL)
    expect(linkByKey('security')?.shortcutId).toBe(SHORTCUT_IDS.NAV_ORG_SETTINGS_SECURITY)
    expect(linkByKey('sso')?.shortcutId).toBe(SHORTCUT_IDS.NAV_ORG_SETTINGS_SSO)
    expect(linkByKey('apps')?.shortcutId).toBe(SHORTCUT_IDS.NAV_ORG_SETTINGS_APPS)
    expect(linkByKey('webhooks')?.shortcutId).toBe(SHORTCUT_IDS.NAV_ORG_SETTINGS_WEBHOOKS)
    expect(linkByKey('audit')?.shortcutId).toBe(SHORTCUT_IDS.NAV_ORG_SETTINGS_AUDIT)
    expect(linkByKey('documents')?.shortcutId).toBe(SHORTCUT_IDS.NAV_ORG_SETTINGS_DOCUMENTS)
  })

  it('omits feature-flagged links (and their shortcutIds) when flags are off', () => {
    const sections = generateOrganizationSettingsSections({
      slug: 'my-org',
      currentPath: '/org/my-org/general',
      showSecuritySettings: false,
      showSsoSettings: false,
      showLegalDocuments: false,
    })

    const allLinks = sections.flatMap((s) => s.links)
    const keys = allLinks.map((l) => l.key)

    expect(keys).not.toContain('security')
    expect(keys).not.toContain('sso')
    expect(keys).not.toContain('documents')
  })

  it('keeps webhooks nav item active for nested endpoint routes', () => {
    const sections = generateOrganizationSettingsSections({
      slug: 'my-org',
      currentPath: '/org/my-org/webhooks/org-endpoint-1',
      showSecuritySettings: true,
      showSsoSettings: true,
      showLegalDocuments: true,
    })

    expect(
      sections.flatMap((section) => section.links).find((item) => item.label === 'Webhooks')
        ?.isActive
    ).toBe(true)
  })
})
