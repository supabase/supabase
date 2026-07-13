import { describe, expect, it } from 'vitest'

import { matchRedirect, preserveQueryAndHash } from './redirects.shared'

describe('preserveQueryAndHash', () => {
  it('carries incoming query params onto the destination', () => {
    expect(preserveQueryAndHash('/org', { foo: '1', bar: 'x' })).toBe('/org?foo=1&bar=x')
  })

  it('returns the destination untouched when there is nothing to carry', () => {
    expect(preserveQueryAndHash('/org', {})).toBe('/org')
    expect(preserveQueryAndHash('/org', new URLSearchParams())).toBe('/org')
  })

  it('drops params consumed by the matched rule', () => {
    expect(
      preserveQueryAndHash(
        '/new/new-project',
        { next: 'new-project', a: '1' },
        {
          consumedKeys: ['next'],
        }
      )
    ).toBe('/new/new-project?a=1')
  })

  it("lets the destination's own params win on conflict", () => {
    expect(
      preserveQueryAndHash('/org/_/billing?panel=subscriptionPlan', { panel: 'other', x: '1' })
    ).toBe('/org/_/billing?panel=subscriptionPlan&x=1')
  })

  it('preserves repeated keys and array values', () => {
    expect(preserveQueryAndHash('/dest', new URLSearchParams('f=a&f=b'))).toBe('/dest?f=a&f=b')
    expect(preserveQueryAndHash('/dest', { f: ['a', 'b'] })).toBe('/dest?f=a&f=b')
  })

  it('carries the incoming hash', () => {
    expect(preserveQueryAndHash('/dest', { a: '1' }, { hash: 'section' })).toBe('/dest?a=1#section')
    expect(preserveQueryAndHash('/dest', {}, { hash: 'section' })).toBe('/dest#section')
  })

  it("lets the destination's own hash win over the incoming one", () => {
    expect(preserveQueryAndHash('/org/slug/billing#invoices', { a: '1' }, { hash: 'other' })).toBe(
      '/org/slug/billing?a=1#invoices'
    )
  })

  it('skips undefined values in a record search', () => {
    expect(preserveQueryAndHash('/dest', { a: undefined, b: '1' })).toBe('/dest?b=1')
  })
})

describe('matchRedirect query/hash preservation', () => {
  it('carries the incoming query and hash through a plain rule', () => {
    expect(
      matchRedirect({
        pathname: '/project/abc/sql/quickstarts',
        search: { template: 'countries', flag: 'true' },
        isPlatform: true,
        hash: 'top',
      })
    ).toEqual({
      destination: '/project/abc/sql/examples?template=countries&flag=true#top',
      permanent: true,
    })
  })

  it('consumes `has` query keys but keeps the rest', () => {
    expect(
      matchRedirect({
        pathname: '/',
        search: { next: 'new-project', projectName: 'foo' },
        isPlatform: true,
      })
    ).toEqual({ destination: '/new/new-project?projectName=foo', permanent: false })
  })

  it("keeps the destination's own params when the incoming query repeats them", () => {
    expect(
      matchRedirect({
        pathname: '/project/abc/settings/billing/subscription',
        search: { panel: 'pitr', source: 'email' },
        isPlatform: true,
      })
    ).toEqual({
      destination: '/project/abc/settings/addons?panel=pitr&source=email',
      permanent: true,
    })
  })

  it('keeps a destination hash (e.g. billing#invoices) over the incoming hash', () => {
    expect(
      matchRedirect({
        pathname: '/org/my-org/invoices',
        search: {},
        isPlatform: true,
        hash: 'ignored',
      })
    ).toEqual({ destination: '/org/my-org/billing#invoices', permanent: true })
  })

  it('leaves plain redirects without query or hash untouched', () => {
    expect(matchRedirect({ pathname: '/', search: {}, isPlatform: true })).toEqual({
      destination: '/org',
      permanent: false,
    })
    expect(matchRedirect({ pathname: '/', search: {}, isPlatform: false })).toEqual({
      destination: '/project/default',
      permanent: false,
    })
  })

  it('still returns null for non-matching paths', () => {
    expect(
      matchRedirect({ pathname: '/project/abc/editor', search: { a: '1' }, isPlatform: true })
    ).toBeNull()
  })
})
