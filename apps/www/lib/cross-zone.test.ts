import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

async function loadIsCrossZoneHref(vercelEnv: string) {
  vi.stubEnv('NEXT_PUBLIC_VERCEL_ENV', vercelEnv)
  vi.resetModules()
  const { isCrossZoneHref } = await import('./cross-zone')
  return isCrossZoneHref
}

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('isCrossZoneHref in production', () => {
  let isCrossZoneHref: (href: string) => boolean

  beforeEach(async () => {
    isCrossZoneHref = await loadIsCrossZoneHref('production')
  })

  it.each([
    '/docs/guides/auth#setup',
    '/dashboard',
    '/dashboard/project/_?sidebar=ai-assistant',
    'https://supabase.com/dashboard/sign-up',
    '/humans.txt',
  ])('%s is served by another zone', (href) => {
    expect(isCrossZoneHref(href)).toBe(true)
  })

  it.each([
    '/pricing',
    '/dashboards',
    '/.well-known/ai-catalog.json',
    'https://github.com/supabase/supabase',
    'https://supabase.com.example.com/dashboard',
  ])('%s stays in the www zone or is external', (href) => {
    expect(isCrossZoneHref(href)).toBe(false)
  })

  it('treats an unparseable href as not cross-zone instead of throwing', () => {
    expect(isCrossZoneHref('https://')).toBe(false)
  })
})

describe('isCrossZoneHref outside production', () => {
  it('only treats /docs as another zone where the docs rewrite exists', async () => {
    const isCrossZoneHref = await loadIsCrossZoneHref('preview')

    expect(isCrossZoneHref('/docs')).toBe(false)
    expect(isCrossZoneHref('/dashboard')).toBe(true)
  })
})
