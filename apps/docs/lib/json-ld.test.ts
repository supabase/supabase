import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { breadcrumbListSchema } from './json-ld'

describe('breadcrumbListSchema', () => {
  let warn: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    warn.mockRestore()
  })

  it('emits item and name on every position when all chain items have urls', () => {
    const result = breadcrumbListSchema({
      pathname: '/guides/auth/jwts',
      chain: [
        { name: 'Authentication', url: '/guides/auth' },
        { name: 'JWTs', url: '/guides/auth/jwts' },
      ],
    })

    expect(result).not.toBeNull()
    expect(result!.itemListElement).toHaveLength(4)
    for (const entry of result!.itemListElement) {
      expect(typeof entry.item).toBe('string')
      expect(entry.item).toMatch(/^https?:\/\//)
      expect(typeof entry.name).toBe('string')
    }
  })

  it('uses pathname for the leaf url even when chain leaf url differs', () => {
    const result = breadcrumbListSchema({
      pathname: '/guides/database/postgres-js',
      chain: [{ name: 'Postgres.js', url: '/guides/database/postgres-js-old' }],
    })

    expect(result).not.toBeNull()
    const leaf = result!.itemListElement.at(-1)
    expect(leaf?.item).toMatch(/\/guides\/database\/postgres-js$/)
  })

  it('returns null when every chain item is url-less', () => {
    const result = breadcrumbListSchema({
      pathname: '/guides/some-broken-route',
      chain: [{ name: 'Category A' }, { name: 'Category B' }],
    })

    expect(result).toBeNull()
  })

  it('returns null on an empty chain', () => {
    const result = breadcrumbListSchema({ pathname: '/guides', chain: [] })

    expect(result).toBeNull()
  })
})
