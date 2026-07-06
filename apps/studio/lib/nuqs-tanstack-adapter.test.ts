import { describe, expect, it } from 'vitest'

import { buildSearchUpdateTarget } from './nuqs-tanstack-adapter'

describe('buildSearchUpdateTarget (custom nuqs adapter)', () => {
  it('joins the current pathname and a rendered query string', () => {
    // The regression we fixed: the stock tanstack-router adapter navigated to
    // a relative `?provider=...`, which TanStack resolved by appending —
    // landing on `/auth/providers/?provider=...` (trailing slash injected).
    expect(buildSearchUpdateTarget('/auth/providers', '?provider=apple')).toBe(
      '/auth/providers?provider=apple'
    )
  })

  it('returns just the pathname when every param is cleared', () => {
    expect(buildSearchUpdateTarget('/auth/providers', '')).toBe('/auth/providers')
  })

  it('strips a trailing slash from the pathname, but keeps the root "/"', () => {
    expect(buildSearchUpdateTarget('/auth/providers/', '?a=1')).toBe('/auth/providers?a=1')
    expect(buildSearchUpdateTarget('/', '?a=1')).toBe('/?a=1')
    expect(buildSearchUpdateTarget('', '?a=1')).toBe('/?a=1')
    expect(buildSearchUpdateTarget('/', '')).toBe('/')
  })
})
