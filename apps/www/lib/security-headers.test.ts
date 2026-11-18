// Next.js compiles header sources with this matcher (next/dist/lib/build-custom-route.js)
import { pathToRegexp } from 'next/dist/compiled/path-to-regexp'
import { describe, expect, it } from 'vitest'

import rewrites from './rewrites'
import { buildCsp, getProxiedPathExclusions, getSecurityHeaderRules } from './security-headers'

const PRODUCTION_ENV = {
  NODE_ENV: 'production',
  NEXT_PUBLIC_VERCEL_ENV: 'production',
  NEXT_PUBLIC_POSTHOG_HOST: 'https://ph.supabase.com',
}
const PREVIEW_ENV = {
  NODE_ENV: 'production',
  NEXT_PUBLIC_VERCEL_ENV: 'preview',
  NEXT_PUBLIC_POSTHOG_HOST: 'https://ph.supabase.green',
}

// The docs zone is only rewritten in production
const REWRITES = [
  ...rewrites,
  { source: '/docs/:path*', destination: 'https://docs.example.com/:path*' },
]

const matches = (source: string, path: string) =>
  pathToRegexp(source, [], { strict: true, sensitive: false, delimiter: '/' }).test(path)

const scriptSrc = (csp: string) =>
  csp
    .split('; ')
    .find((directive) => directive.startsWith('script-src '))!
    .split(' ')
    .slice(1)

describe('buildCsp', () => {
  it('builds the production policy', () => {
    const csp = buildCsp({ env: PRODUCTION_ENV })

    expect(csp).toContain("object-src 'none'")
    expect(csp).toContain("base-uri 'self'")
    expect(csp).toContain("form-action 'self'")
    expect(csp).toContain("frame-ancestors 'self'")

    const sources = scriptSrc(csp)
    expect(sources).toEqual(
      expect.arrayContaining([
        "'self'",
        "'unsafe-inline'",
        "'unsafe-eval'",
        'https://ss.supabase.com',
        'https://ph.supabase.com',
      ])
    )
    expect(sources).not.toContain('https://vercel.live')
    expect(sources).not.toContain('https://ph.supabase.green')
    expect(sources.some((source) => source.includes('unpkg.com'))).toBe(false)
    expect(sources.some((source) => source.includes('vercel.app'))).toBe(false)
    expect(sources.some((source) => source === 'https://cdn.jsdelivr.net')).toBe(false)
  })

  it.each([
    ['production', PRODUCTION_ENV],
    ['preview', PREVIEW_ENV],
    ['development', { NODE_ENV: 'development' }],
  ])('allows eval in %s, where MDX pages evaluate on the client', (_, env) => {
    expect(scriptSrc(buildCsp({ env }))).toContain("'unsafe-eval'")
  })

  it('allows the preview hosts on preview and staging', () => {
    for (const env of [
      PREVIEW_ENV,
      { NODE_ENV: 'production', NEXT_PUBLIC_ENVIRONMENT: 'staging' },
    ]) {
      const sources = scriptSrc(buildCsp({ env }))
      expect(sources).toContain('https://vercel.live')
      expect(sources).toContain('https://ph.supabase.green')
    }
  })

  it('uses the configured PostHog host', () => {
    const sources = scriptSrc(
      buildCsp({
        env: { ...PRODUCTION_ENV, NEXT_PUBLIC_POSTHOG_HOST: 'https://ph.example.com/path' },
      })
    )
    expect(sources).toContain('https://ph.example.com')
  })
})

describe('getProxiedPathExclusions', () => {
  const { exact, subtree } = getProxiedPathExclusions(REWRITES)

  it('excludes single-file rewrites exactly', () => {
    expect(exact).toEqual(
      expect.arrayContaining([
        '/openapi.json',
        '/.well-known/security.txt',
        '/humans.txt',
        '/lawyers.txt',
        '/library.rsc',
        '/design-system.rsc',
      ])
    )
  })

  it('excludes zones as subtrees', () => {
    expect(subtree).toEqual(
      expect.arrayContaining([
        '/dashboard',
        '/docs',
        '/kb',
        '/library',
        '/library.segments',
        '/design-system',
        '/migrate/instantdb',
        '/new-docs',
      ])
    )
  })

  it('does not widen exact rewrites or nested zones', () => {
    expect(subtree).not.toContain('/openapi')
    expect(subtree).not.toContain('/migrate')
    expect(subtree).not.toContain('/.well-known')
  })

  it('drops exact paths that a subtree covers', () => {
    expect(exact).not.toContain('/dashboard')
    expect(exact).not.toContain('/kb')
    expect(exact).not.toContain('/new-docs/')
  })

  it('ignores internal rewrites', () => {
    const all = [...exact, ...subtree]
    expect(all).not.toContain('/feed.xml')
    expect(all).not.toContain('/.well-known/ai-catalog.json')
  })

  it('includes rewrites to unset env vars', () => {
    expect(
      getProxiedPathExclusions([{ source: '/kb/:path*', destination: 'undefined/:path*' }])
    ).toEqual({ exact: [], subtree: ['/kb'] })
  })
})

describe('getSecurityHeaderRules', () => {
  const rules = getSecurityHeaderRules(REWRITES, PRODUCTION_ENV)
  const [wwwRule] = rules

  it.each([
    '/',
    '/pricing',
    '/blog/some-post',
    '/customers',
    '/customers/maergo',
    '/changelog',
    '/openapi',
    '/openapi-guide',
    '/library.json',
    '/libraryx',
    '/migrate',
    '/migrate/other',
    '/humans',
    '/.well-known/ard.json',
    '/dashboarding-guide',
    '/docsearch',
  ])('applies to the www path %s', (path) => {
    expect(matches(wwwRule.source, path)).toBe(true)
  })

  it.each([
    '/.well-known/security.txt',
    '/openapi.json',
    '/humans.txt',
    '/dashboard',
    '/dashboard/project/abc',
    '/docs',
    '/docs/guides/auth',
    '/library',
    '/library.rsc',
    '/library.segments/a.segment.rsc',
    '/library/example/x.segments/y.segment.rsc',
    '/library/example/password-based-auth',
    '/design-system/docs',
    '/migrate/instantdb',
    '/migrate/instantdb/step',
    '/new-docs/',
    '/kb/some-article',
  ])('does not apply to the proxied path %s', (path) => {
    expect(matches(wwwRule.source, path)).toBe(false)
  })

  it('sets the framing, sniffing and referrer headers', () => {
    expect(wwwRule.headers).toEqual(
      expect.arrayContaining([
        { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      ])
    )
  })

  it('uses one CSP for every www page, so client-side navigation keeps a working policy', () => {
    const cspRules = rules.filter((rule) =>
      rule.headers.some((header) => header.key === 'Content-Security-Policy')
    )
    expect(cspRules).toHaveLength(1)
  })
})
