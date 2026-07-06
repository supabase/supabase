import { describe, expect, it } from 'vitest'

import { resolveSearchOrHashOnlyTarget, resolveUrl, withDefaultPathname } from './router'

describe('resolveUrl (next/router compat shim)', () => {
  it('returns string URLs untouched', () => {
    expect(resolveUrl('/project/abc/editor/1?schema=public')).toBe(
      '/project/abc/editor/1?schema=public'
    )
    // A string that happens to contain brackets is NOT interpolated.
    expect(resolveUrl('/project/[ref]/editor')).toBe('/project/[ref]/editor')
  })

  it('interpolates dynamic params from query into a bracketed pathname and drops them from the query string', () => {
    // The regression we fixed: useUrlState pushes `router.pathname` (the bracketed
    // pattern) + query. Next fills the params; the shim must too, or TanStack
    // navigates to a literal `/project/[ref]/...` and bounces to "project not found".
    expect(
      resolveUrl({
        pathname: '/project/[ref]/database/tables/[id]',
        query: { ref: 'default', id: '123', schema: 'public', sort: 'name:asc' },
      })
    ).toBe('/project/default/database/tables/123?schema=public&sort=name%3Aasc')
  })

  it('omits the query string entirely when every param is consumed', () => {
    expect(resolveUrl({ pathname: '/project/[ref]/settings', query: { ref: 'abc' } })).toBe(
      '/project/abc/settings'
    )
  })

  it('leaves a bracket-free pathname and its query alone', () => {
    expect(resolveUrl({ pathname: '/project/default/sql', query: { a: '1', b: '2' } })).toBe(
      '/project/default/sql?a=1&b=2'
    )
  })

  it('interpolates required and optional catch-all segments', () => {
    expect(
      resolveUrl({
        pathname: '/project/[ref]/logs/[[...slug]]',
        query: { ref: 'r', slug: ['a', 'b'] },
      })
    ).toBe('/project/r/logs/a/b')
    expect(resolveUrl({ pathname: '/p/[...rest]', query: { rest: ['x', 'y'] } })).toBe('/p/x/y')
  })

  it('does not interpolate when query is a raw string (cannot fill named params)', () => {
    expect(resolveUrl({ pathname: '/project/[ref]/x', query: 'a=1' })).toBe('/project/[ref]/x?a=1')
  })

  it('preserves hash and honours an explicit search override', () => {
    expect(resolveUrl({ pathname: '/project/[ref]', query: { ref: 'x' }, hash: 'section' })).toBe(
      '/project/x#section'
    )
    expect(
      resolveUrl({ pathname: '/project/[ref]', query: { ref: 'x', drop: 'me' }, search: '?a=1' })
    ).toBe('/project/x?a=1')
  })
})

describe('resolveSearchOrHashOnlyTarget (next/router compat shim)', () => {
  it('prefixes the current pathname on a ?-only target', () => {
    // The regression we fixed: `push({ query })` with no pathname produced a
    // relative `?...` that TanStack resolved by appending — landing on
    // `/advisors/security/?preset=...` (trailing slash injected).
    expect(resolveSearchOrHashOnlyTarget('?preset=x', '/advisors/security')).toBe(
      '/advisors/security?preset=x'
    )
  })

  it('prefixes the current pathname on a #-only target', () => {
    expect(resolveSearchOrHashOnlyTarget('#invoices', '/org/slug/billing')).toBe(
      '/org/slug/billing#invoices'
    )
  })

  it('strips a trailing slash from the current pathname, but keeps the root "/"', () => {
    expect(resolveSearchOrHashOnlyTarget('?a=1', '/auth/providers/')).toBe('/auth/providers?a=1')
    expect(resolveSearchOrHashOnlyTarget('?a=1', '/')).toBe('/?a=1')
    expect(resolveSearchOrHashOnlyTarget('?a=1', '')).toBe('/?a=1')
  })

  it('leaves targets with a pathname untouched', () => {
    expect(resolveSearchOrHashOnlyTarget('/project/abc?x=1', '/elsewhere')).toBe('/project/abc?x=1')
    expect(resolveSearchOrHashOnlyTarget('/project/abc', '/elsewhere')).toBe('/project/abc')
  })
})

describe('withDefaultPathname (next/router compat shim)', () => {
  it('fills a missing pathname from the current route pattern so path params are consumed', () => {
    // The regression we fixed: `push({ query: { ...router.query, filter } })`
    // with no pathname leaked `ref`/`id` into the query string
    // (`/editor/17597/?ref=...&id=17597&filter=...`) because nothing
    // interpolated them back into the path.
    const target = withDefaultPathname(
      { query: { ref: 'abc', id: '17597', filter: 'note:eq:hi' } },
      '/project/[ref]/editor/[id]',
      { ref: 'abc', id: '17597' }
    )
    expect(resolveUrl(target)).toBe('/project/abc/editor/17597?filter=note%3Aeq%3Ahi')
  })

  it('backfills params the caller omitted from the current route params', () => {
    const target = withDefaultPathname(
      { query: { preset: 'WARN' } },
      '/project/[ref]/advisors/security',
      { ref: 'abc' }
    )
    expect(resolveUrl(target)).toBe('/project/abc/advisors/security?preset=WARN')
  })

  it('caller-provided query values win over backfilled params', () => {
    const target = withDefaultPathname(
      { query: { ref: 'other', page: '2' } },
      '/project/[ref]',
      { ref: 'abc' }
    )
    expect(resolveUrl(target)).toBe('/project/other?page=2')
  })

  it('never backfills the TanStack _splat param', () => {
    const target = withDefaultPathname({ query: { a: '1' } }, '/org/_/[[...routeSlug]]', {
      _splat: 'x/y',
    })
    expect(resolveUrl(target)).toBe('/org/_/?a=1')
  })

  it('leaves string URLs, explicit pathnames, and raw-string queries untouched', () => {
    expect(withDefaultPathname('/x?a=1', '/p/[ref]', { ref: 'r' })).toBe('/x?a=1')
    expect(
      withDefaultPathname({ pathname: '/y', query: { a: '1' } }, '/p/[ref]', { ref: 'r' })
    ).toEqual({ pathname: '/y', query: { a: '1' } })
    expect(withDefaultPathname({ query: 'a=1' }, '/p/[ref]', { ref: 'r' })).toEqual({
      query: 'a=1',
    })
  })
})
