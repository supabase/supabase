import { afterEach, describe, expect, it, vi } from 'vitest'

import { splitInternalUrl } from './link'

describe('splitInternalUrl (next/link compat shim)', () => {
  it('splits pathname, search, and hash', () => {
    expect(splitInternalUrl('/project/abc/editor/123?schema=public#section')).toEqual({
      to: '/project/abc/editor/123',
      search: { schema: 'public' },
      hash: 'section',
    })
  })

  it('strips the leading "#" from the hash so TanStack does not produce "##section"', () => {
    expect(splitInternalUrl('/org/slug/billing#invoices')).toEqual({
      to: '/org/slug/billing',
      search: undefined,
      hash: 'invoices',
    })
  })

  it('omits search and hash when absent', () => {
    expect(splitInternalUrl('/projects')).toEqual({
      to: '/projects',
      search: undefined,
      hash: undefined,
    })
  })

  it('preserves repeated query keys as arrays', () => {
    expect(splitInternalUrl('/advisors/security?filter=a:eq:1&filter=b:eq:2&page=2')).toEqual({
      to: '/advisors/security',
      search: { filter: ['a:eq:1', 'b:eq:2'], page: '2' },
      hash: undefined,
    })
  })

  it('keeps query values as plain strings (no JSON coercion)', () => {
    expect(splitInternalUrl('/x?flag=true&page=2').search).toEqual({ flag: 'true', page: '2' })
  })

  it('normalizes same-origin absolute URLs to a relative path', () => {
    const url = new URL('/project/abc/editor/1?schema=public#top', window.location.origin)
    expect(splitInternalUrl(url.toString())).toEqual({
      to: '/project/abc/editor/1',
      search: { schema: 'public' },
      hash: 'top',
    })
  })

  it('leaves cross-origin and protocol-relative URLs untouched', () => {
    expect(splitInternalUrl('https://supabase.com/docs#install')).toEqual({
      to: 'https://supabase.com/docs#install',
    })
    expect(splitInternalUrl('//supabase.com/docs')).toEqual({ to: '//supabase.com/docs' })
  })
})

describe('splitInternalUrl with a configured basePath', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it('strips the basePath prefix so TanStack does not double-prefix', async () => {
    vi.stubEnv('NEXT_PUBLIC_BASE_PATH', '/dashboard')
    vi.resetModules()
    const { splitInternalUrl: split } = await import('./link')
    expect(split('/dashboard/project/abc?schema=public#top')).toEqual({
      to: '/project/abc',
      search: { schema: 'public' },
      hash: 'top',
    })
    expect(split('/dashboard')).toEqual({ to: '/', search: undefined, hash: undefined })
    // A coincidental prefix is not stripped.
    expect(split('/dashboard-other/x').to).toBe('/dashboard-other/x')
  })
})
