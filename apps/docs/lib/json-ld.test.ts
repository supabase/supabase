import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { breadcrumbListSchema, techArticleSchema } from './json-ld'

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
    expect(result!.itemListElement).toHaveLength(3)
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

describe('techArticleSchema', () => {
  const url = 'https://supabase.com/docs/guides/auth/jwts'

  it('describes the guide as a TechArticle on its own URL', () => {
    const schema = techArticleSchema({
      url,
      headline: 'JWTs',
      description: 'How JSON Web Tokens work.',
    })

    expect(schema['@context']).toBe('https://schema.org')
    expect(schema['@type']).toBe('TechArticle')
    expect(schema['@id']).toBe(`${url}#page`)
    expect(schema.mainEntityOfPage).toEqual({ '@type': 'WebPage', '@id': url })
    expect(schema.url).toBe(url)
    expect(schema.headline).toBe('JWTs')
    expect(schema.description).toBe('How JSON Web Tokens work.')
    expect(schema.inLanguage).toBe('en')
  })

  it('omits description when none is given', () => {
    const schema = techArticleSchema({ url, headline: 'JWTs' })

    expect(schema.description).toBeUndefined()
  })

  it('omits date fields', () => {
    const schema = techArticleSchema({ url, headline: 'JWTs' })

    expect(schema).not.toHaveProperty('datePublished')
    expect(schema).not.toHaveProperty('dateModified')
  })

  it('publishes under an inline Supabase organization', () => {
    const schema = techArticleSchema({ url, headline: 'JWTs' })

    expect(schema.publisher).toMatchObject({
      '@type': 'Organization',
      name: 'Supabase',
      url: 'https://supabase.com',
    })
  })
})
