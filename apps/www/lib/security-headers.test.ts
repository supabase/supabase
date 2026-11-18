// Next.js compiles header sources with this matcher (next/dist/lib/build-custom-route.js)
import { pathToRegexp } from 'next/dist/compiled/path-to-regexp'
import { describe, expect, it } from 'vitest'

import rewrites from './rewrites'
import {
  buildCsp,
  getProxiedPathPatterns,
  getSecurityHeaderRules,
  getWwwOwnedSource,
} from './security-headers'

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

describe('getProxiedPathPatterns', () => {
  it('ignores internal rewrites', () => {
    expect(
      getProxiedPathPatterns([
        { source: '/feed.xml', destination: '/rss.xml' },
        { source: '/:path*', destination: '/:path*' },
      ])
    ).toEqual([])
  })

  it('includes rewrites to unset env vars', () => {
    expect(
      getProxiedPathPatterns([{ source: '/kb/:path*', destination: 'undefined/:path*' }])
    ).toHaveLength(1)
  })
})

describe('getWwwOwnedSource', () => {
  it.each(['/', '/pricing', '/blog/some-post'])(
    'matches every path when nothing is proxied: %s',
    (path) => {
      expect(matches(getWwwOwnedSource([]), path)).toBe(true)
    }
  )
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
    '/library.segments/example',
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

  // Every path must get the www headers exactly when no external rewrite proxies it
  const externalSources = REWRITES.filter((rewrite) => !rewrite.destination.startsWith('/')).map(
    (rewrite) => rewrite.source
  )
  const SAMPLE_PATHS = [
    '/',
    '/pricing',
    '/customers/maergo',
    '/dashboard',
    '/dashboard/project/abc',
    '/dashboarding-guide',
    '/docs',
    '/docs/guides/auth',
    '/docs.segments/a.segment.rsc',
    '/docsearch',
    '/library',
    '/library.rsc',
    '/library.json',
    '/library.segments/a.segment.rsc',
    '/library.segments/example',
    '/library/example/x.segments/y.segment.rsc',
    '/library/example/password-based-auth',
    '/libraryx',
    '/design-system.segments/a.segment.rsc',
    '/design-system.segments/example',
    '/kb',
    '/kb/a/b',
    '/evals/run',
    '/migrate',
    '/migrate/instantdb',
    '/migrate/instantdb/step',
    '/migrate/other',
    '/new-docs',
    '/new-docs/',
    '/new-docs/guides',
    '/humans.txt',
    '/humans',
    '/lawyers.txt',
    '/.well-known/security.txt',
    '/.well-known/ard.json',
    '/openapi.json',
    '/openapi',
    '/feed.xml',
  ]

  it.each(SAMPLE_PATHS)('agrees with the rewrite sources for %s', (path) => {
    const isProxied = externalSources.some((source) => matches(source, path))
    expect(matches(wwwRule.source, path)).toBe(!isProxied)
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
