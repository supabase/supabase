import { describe, expect, it } from 'vitest'

import { CANONICAL_ORIGIN, canonicalAlternates, getPagesCanonicalHref } from './lib/canonical'

describe('canonicalAlternates', () => {
  it('points the canonical at production for a path', () => {
    expect(canonicalAlternates('/blog')).toEqual({ canonical: 'https://supabase.com/blog' })
  })

  it('keeps nested and dynamic paths intact', () => {
    expect(canonicalAlternates('/blog/tags/postgres')).toEqual({
      canonical: `${CANONICAL_ORIGIN}/blog/tags/postgres`,
    })
  })
})

describe('getPagesCanonicalHref', () => {
  it('uses the changelog index path', () => {
    expect(getPagesCanonicalHref('/changelog')).toBe('https://supabase.com/changelog')
  })

  it('uses a resolved changelog entry path', () => {
    expect(getPagesCanonicalHref('/changelog/17061-moving-to-org-based-billing')).toBe(
      'https://supabase.com/changelog/17061-moving-to-org-based-billing'
    )
  })

  it('strips query strings and hashes from changelog URLs', () => {
    expect(getPagesCanonicalHref('/changelog?tag=auth#latest')).toBe(
      'https://supabase.com/changelog'
    )
    expect(getPagesCanonicalHref('/changelog/some-entry?ref=twitter')).toBe(
      'https://supabase.com/changelog/some-entry'
    )
  })

  it('strips a trailing slash', () => {
    expect(getPagesCanonicalHref('/changelog/')).toBe('https://supabase.com/changelog')
  })

  it('returns the origin root for the home path', () => {
    expect(getPagesCanonicalHref('/')).toBe('https://supabase.com')
  })

  it('omits the canonical while a dynamic segment is unresolved', () => {
    expect(getPagesCanonicalHref('/changelog/[slug]')).toBeUndefined()
    expect(getPagesCanonicalHref('/features/[slug]')).toBeUndefined()
  })
})
