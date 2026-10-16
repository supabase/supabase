import { describe, expect, it } from 'vitest'

import { CANONICAL_ORIGIN, canonicalAlternates } from './lib/canonical'

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
