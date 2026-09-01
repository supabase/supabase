import type { NextConfig } from 'next'
import { getPathMatch } from 'next/dist/shared/lib/router/utils/path-match'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@sentry/nextjs', () => ({
  withSentryConfig: (configFn: any) => (typeof configFn === 'function' ? configFn() : configFn),
}))

describe('next.config.mjs', () => {
  it('expect the headers to always have X-Robots-Tag', async () => {
    const { default: config } = (await import('./next.config.mjs')) as { default: NextConfig }
    const headers = (await config.headers?.()) || []

    expect(headers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          source: '/(docs|blog)/:path*',
          headers: [{ key: 'X-Robots-Tag', value: 'all' }],
        }),
        expect.objectContaining({
          source: '/dashboard/:path*',
          headers: [{ key: 'X-Robots-Tag', value: 'noindex' }],
        }),
      ])
    )
  })

  it('routes the library and permanently redirects the legacy UI URLs', async () => {
    const { default: config } = (await import('./next.config.mjs')) as { default: NextConfig }
    const rewrites = await config.rewrites?.()
    const afterFiles = (rewrites && 'afterFiles' in rewrites && rewrites.afterFiles) || []
    const redirects = (await config.redirects?.()) || []

    expect(afterFiles).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ source: '/library' }),
        expect.objectContaining({ source: '/library/:path*' }),
      ])
    )
    expect(redirects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          source: '/images/customers/logos/light/:path*',
          destination: '/images/customers/logos/on-dark/:path*',
          permanent: true,
        }),
        expect.objectContaining({
          source: '/images/customers/logos/:slug((?!dreambase-mark\\.png)[^/.]+).png',
          destination: '/images/customers/logos/on-light/:slug.png',
          permanent: true,
        }),
        expect.objectContaining({ source: '/ui', destination: '/library', permanent: true }),
        expect.objectContaining({
          source: '/ui/:path*',
          destination: '/library/:path*',
          permanent: true,
        }),
      ])
    )
    expect(
      redirects.findIndex((redirect) => redirect.source === '/ui/docs/ai-editors-rules/prompts')
    ).toBeLessThan(redirects.findIndex((redirect) => redirect.source === '/ui/:path*'))
  })

  it('routes unmatched markdown-negotiated paths to the md-404 handler via fallback rewrites', async () => {
    const { default: config } = (await import('./next.config.mjs')) as { default: NextConfig }
    const rewrites = await config.rewrites?.()
    const fallback = (rewrites && 'fallback' in rewrites && rewrites.fallback) || []

    const mdSuffixRule = fallback.find((rule) => rule.destination === '/api-v2/md-404/:path')
    const acceptRule = fallback.find((rule) => rule.destination === '/api-v2/md-404/:path*')

    expect(mdSuffixRule).toBeDefined()
    expect(acceptRule?.has).toEqual([
      { type: 'header', key: 'accept', value: '.*text/(markdown|\\*).*' },
    ])

    expect(getPathMatch(mdSuffixRule!.source)('/definitely-not-a-page.md')).toBeTruthy()
    expect(getPathMatch(mdSuffixRule!.source)('/nested/definitely/not-a-page.md')).toBeTruthy()
    expect(getPathMatch(mdSuffixRule!.source)('/definitely-not-a-page')).toBe(false)
    expect(getPathMatch(acceptRule!.source)('/definitely-not-a-page')).toBeTruthy()

    const acceptHeaderRegex = new RegExp(`^${acceptRule!.has![0].value}$`)
    expect(acceptHeaderRegex.test('text/markdown')).toBe(true)
    expect(acceptHeaderRegex.test('text/html, text/markdown;q=0.9')).toBe(true)
    expect(acceptHeaderRegex.test('text/*')).toBe(true)
    expect(
      acceptHeaderRegex.test('text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8')
    ).toBe(false)
  })

  it('permanently redirects the legacy root markdown aliases to /index.md', async () => {
    const { default: config } = (await import('./next.config.mjs')) as { default: NextConfig }
    const redirects = (await config.redirects?.()) || []

    for (const source of ['/.md', '/homepage.md', '/llms/homepage.txt']) {
      expect(redirects).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ source, destination: '/index.md', permanent: true }),
        ])
      )
    }

    expect(getPathMatch('/.md')('/.md')).toBeTruthy()
    expect(getPathMatch('/.md')('/foo.md')).toBe(false)

    expect(redirects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ source: '/index', destination: '/', permanent: true }),
      ])
    )
    expect(getPathMatch('/index')('/index.md')).toBe(false)
  })

  it('preserves the filename when redirecting legacy customer logos', async () => {
    const { default: config } = (await import('./next.config.mjs')) as { default: NextConfig }
    const redirects = (await config.redirects?.()) || []

    const darkModeRedirect = redirects.find(
      (redirect) => redirect.source === '/images/customers/logos/light/:path*'
    )
    const lightModeRedirect = redirects.find(
      (redirect) =>
        redirect.source === '/images/customers/logos/:slug((?!dreambase-mark\\.png)[^/.]+).png'
    )

    expect(darkModeRedirect).toBeDefined()
    expect(lightModeRedirect).toBeDefined()

    const matchLegacyDark = getPathMatch(darkModeRedirect!.source)
    const matchLegacyLight = getPathMatch(lightModeRedirect!.source)

    expect(matchLegacyDark('/images/customers/logos/light/good-tape.png')).toEqual({
      path: ['good-tape.png'],
    })
    expect(matchLegacyLight('/images/customers/logos/good-tape.png')).toEqual({
      slug: 'good-tape',
    })
    expect(matchLegacyLight('/images/customers/logos/dreambase-mark.png')).toBe(false)
    expect(matchLegacyLight('/images/customers/logos/dreambase-marketing.png')).toEqual({
      slug: 'dreambase-marketing',
    })
  })
})
