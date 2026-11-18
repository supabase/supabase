// Next.js compiles header sources with this matcher (next/dist/lib/build-custom-route.js)
import { pathToRegexp } from 'next/dist/compiled/path-to-regexp'
import { describe, expect, it } from 'vitest'

import rewrites from './rewrites'
import {
  buildCsp,
  EVAL_ROUTE_SOURCES,
  getProxiedPathPrefixes,
  getSecurityHeaderRules,
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

const matches = (source: string, path: string) =>
  pathToRegexp(source, [], { strict: true, sensitive: false, delimiter: '/' }).test(path)

const scriptSrc = (csp: string) =>
  csp
    .split('; ')
    .find((directive) => directive.startsWith('script-src '))!
    .split(' ')
    .slice(1)

const cspFor = (rules: ReturnType<typeof getSecurityHeaderRules>, path: string) =>
  rules
    .filter((rule) => matches(rule.source, path))
    .flatMap((rule) => rule.headers)
    .filter((header) => header.key === 'Content-Security-Policy')
    .at(-1)?.value

describe('buildCsp', () => {
  it('builds a strict production policy', () => {
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
        'https://ss.supabase.com',
        'https://ph.supabase.com',
      ])
    )
    expect(sources).not.toContain("'unsafe-eval'")
    expect(sources).not.toContain('https://vercel.live')
    expect(sources).not.toContain('https://ph.supabase.green')
    expect(sources.some((source) => source.includes('unpkg.com'))).toBe(false)
    expect(sources.some((source) => source.includes('vercel.app'))).toBe(false)
    expect(sources.some((source) => source === 'https://cdn.jsdelivr.net')).toBe(false)
  })

  it('allows eval only when asked', () => {
    expect(scriptSrc(buildCsp({ env: PRODUCTION_ENV, allowEval: true }))).toContain("'unsafe-eval'")
  })

  it('allows eval in development', () => {
    expect(scriptSrc(buildCsp({ env: { NODE_ENV: 'development' } }))).toContain("'unsafe-eval'")
  })

  it('allows the preview hosts on preview and staging', () => {
    for (const env of [
      PREVIEW_ENV,
      { NODE_ENV: 'production', NEXT_PUBLIC_ENVIRONMENT: 'staging' },
    ]) {
      const sources = scriptSrc(buildCsp({ env }))
      expect(sources).toContain('https://vercel.live')
      expect(sources).toContain('https://ph.supabase.green')
      expect(sources).not.toContain("'unsafe-eval'")
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

describe('getProxiedPathPrefixes', () => {
  it('finds the zones that www proxies', () => {
    const prefixes = getProxiedPathPrefixes(rewrites)
    expect(prefixes).toEqual(
      expect.arrayContaining(['dashboard', 'library', 'design-system', 'kb', 'evals', 'migrate'])
    )
  })

  it('ignores internal rewrites', () => {
    const prefixes = getProxiedPathPrefixes(rewrites)
    expect(prefixes).not.toContain('feed')
    expect(prefixes).not.toContain('path')
  })

  it('includes rewrites to unset env vars', () => {
    expect(
      getProxiedPathPrefixes([{ source: '/docs/:path*', destination: 'undefined/:path*' }])
    ).toEqual(['docs'])
  })
})

describe('getSecurityHeaderRules', () => {
  const rules = getSecurityHeaderRules(
    [...rewrites, { source: '/docs/:path*', destination: 'https://docs.example.com/:path*' }],
    PRODUCTION_ENV
  )
  const [wwwRule] = rules

  it.each(['/', '/pricing', '/blog/some-post', '/changelog', '/dashboarding-guide', '/docsearch'])(
    'applies to the www page %s',
    (path) => {
      expect(matches(wwwRule.source, path)).toBe(true)
    }
  )

  it.each([
    '/dashboard',
    '/dashboard/project/abc',
    '/docs',
    '/docs/guides/auth',
    '/library/example/password-based-auth',
    '/library.rsc',
    '/design-system/docs',
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

  it.each([
    '/changelog',
    '/changelog/some-entry',
    '/customers/acme',
    '/events/meetup',
    '/alternatives/acme',
    '/partners/catalog/acme',
  ])('allows eval on the MDX client page %s', (path) => {
    expect(scriptSrc(cspFor(rules, path)!)).toContain("'unsafe-eval'")
  })

  it.each(['/', '/blog/some-post', '/customers', '/events', '/partners/catalog'])(
    'does not allow eval on %s',
    (path) => {
      expect(scriptSrc(cspFor(rules, path)!)).not.toContain("'unsafe-eval'")
    }
  )

  it('covers every eval route', () => {
    expect(rules.slice(1).map((rule) => rule.source)).toEqual(EVAL_ROUTE_SOURCES)
  })
})
