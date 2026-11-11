import { afterEach, describe, expect, it, vi } from 'vitest'

describe('canonical', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it('keeps /library in production URLs when NEXT_PUBLIC_BASE_PATH is empty', async () => {
    vi.stubEnv('NEXT_PUBLIC_BASE_PATH', '')
    const { libraryUrl, canonicalAlternates } = await import('./canonical')
    expect(libraryUrl('/docs/quickstart')).toBe('https://supabase.com/library/docs/quickstart')
    expect(canonicalAlternates('/docs/quickstart')).toEqual({
      canonical: 'https://supabase.com/library/docs/quickstart',
    })
  })

  it('does not depend on the routing base path', async () => {
    vi.stubEnv('NEXT_PUBLIC_BASE_PATH', '/preview')
    const { libraryUrl } = await import('./canonical')
    expect(libraryUrl('/docs/quickstart')).toBe('https://supabase.com/library/docs/quickstart')
  })

  it('points the home page at the bare library URL', async () => {
    vi.stubEnv('NEXT_PUBLIC_BASE_PATH', '')
    const { canonicalAlternates } = await import('./canonical')
    expect(canonicalAlternates('')).toEqual({ canonical: 'https://supabase.com/library' })
  })
})
