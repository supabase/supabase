import { describe, expect, it } from 'vitest'

import { resolveBlogSlug } from './posts'

describe('resolveBlogSlug', () => {
  it('resolves an alias to the real post slug', () => {
    expect(resolveBlogSlug('postgres-13')).toBe('supabase-postgres-13')
  })

  it('resolves the date-prefixed filename to the same slug', () => {
    expect(resolveBlogSlug('2021-07-26-supabase-postgres-13')).toBe('supabase-postgres-13')
  })

  it('returns the real slug unchanged', () => {
    expect(resolveBlogSlug('supabase-postgres-13')).toBe('supabase-postgres-13')
  })

  it('returns undefined for a slug with no matching post', () => {
    expect(resolveBlogSlug('this-post-does-not-exist-xyz')).toBeUndefined()
  })
})
