import { describe, expect, it } from 'vitest'

import { resolveAuthorizeOrganizationSlug } from './oauth'

describe('resolveAuthorizeOrganizationSlug', () => {
  it('uses the Studio org slug by default', () => {
    expect(resolveAuthorizeOrganizationSlug({ studioOrgSlug: 'acme' })).toBe('acme')
  })

  it('prefers an explicit cloud-org override', () => {
    expect(
      resolveAuthorizeOrganizationSlug({
        studioOrgSlug: 'default-org',
        overrideSlug: 'cloud-org',
      })
    ).toBe('cloud-org')
  })

  it('omits organization_slug when preselect is disabled', () => {
    expect(
      resolveAuthorizeOrganizationSlug({
        studioOrgSlug: 'default-org',
        overrideSlug: 'cloud-org',
        preselect: false,
      })
    ).toBeUndefined()
  })
})
