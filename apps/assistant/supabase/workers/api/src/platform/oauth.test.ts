import { describe, expect, it } from 'vitest'

import { findOrganizationMismatch, resolveAuthorizeOrganizationSlug } from './oauth'

describe('findOrganizationMismatch', () => {
  it('returns null when the token is scoped to the Studio org', () => {
    expect(
      findOrganizationMismatch({
        expectedSlug: 'acme',
        organizations: [{ id: 'acme', slug: 'acme', name: 'Acme' }],
      })
    ).toBeNull()
  })

  it('reports the org the user actually consented for', () => {
    expect(
      findOrganizationMismatch({
        expectedSlug: 'utvbdgaxmvzwgzaujubx',
        organizations: [{ slug: 'chemical-tan-earwig', name: "SaxonF's Org" }],
      })
    ).toEqual({
      expectedSlug: 'utvbdgaxmvzwgzaujubx',
      connectedSlugs: ['chemical-tan-earwig'],
    })
  })

  it('fails open on an unrecognized response', () => {
    expect(findOrganizationMismatch({ expectedSlug: 'acme', organizations: null })).toBeNull()
    expect(findOrganizationMismatch({ expectedSlug: 'acme', organizations: [] })).toBeNull()
    expect(
      findOrganizationMismatch({ expectedSlug: 'acme', organizations: [{ name: 'no slug' }] })
    ).toBeNull()
  })
})

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
