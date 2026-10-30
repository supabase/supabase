import { afterEach, describe, expect, it, vi } from 'vitest'

describe('canonical', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it('builds production URLs under the default base path', async () => {
    vi.stubEnv('NEXT_PUBLIC_BASE_PATH', '')
    const { libraryUrl, canonicalAlternates } = await import('./canonical')
    expect(libraryUrl('/docs/quickstart')).toBe('https://supabase.com/docs/quickstart')
    expect(canonicalAlternates('/docs/quickstart')).toEqual({
      canonical: 'https://supabase.com/docs/quickstart',
    })
  })

  it('prefixes the configured base path and keeps the home page on the bare base', async () => {
    vi.stubEnv('NEXT_PUBLIC_BASE_PATH', '/library')
    const { libraryUrl, canonicalAlternates } = await import('./canonical')
    expect(libraryUrl('/docs/quickstart')).toBe('https://supabase.com/library/docs/quickstart')
    expect(canonicalAlternates('')).toEqual({ canonical: 'https://supabase.com/library' })
  })
})
