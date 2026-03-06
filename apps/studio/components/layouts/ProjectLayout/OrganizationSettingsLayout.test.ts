import { describe, expect, it } from 'vitest'

import {
  generateOrganizationSettingsMenuItems,
  generateOrganizationSettingsSections,
  getOrganizationSettingsDocumentTitle,
  normalizeOrganizationSettingsPath,
} from './OrganizationSettingsLayout'

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

  it('uses settings as default document title when page title is not provided', () => {
    expect(getOrganizationSettingsDocumentTitle(undefined, 'Supabase')).toBe('Settings | Supabase')
  })

  it('uses page title for document title when provided', () => {
    expect(getOrganizationSettingsDocumentTitle('General', 'Supabase')).toBe('General | Supabase')
  })
})
