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
    const rewrites = (await config.rewrites?.()) || []
    const redirects = (await config.redirects?.()) || []

    expect(rewrites).toEqual(
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

  it('redirects legacy svg wordmarks while leaving icon chips at the logos root', async () => {
    const { default: config } = (await import('./next.config.mjs')) as { default: NextConfig }
    const redirects = (await config.redirects?.()) || []

    const logoRedirects = redirects.filter((redirect) =>
      redirect.source.startsWith('/images/customers/logos')
    )
    const isRedirected = (url: string) =>
      logoRedirects.some((redirect) => getPathMatch(redirect.source)(url) !== false)

    // Wordmarks that moved from logos/ to logos/on-light/ have to keep resolving.
    expect(isRedirected('/images/customers/logos/accenture.svg')).toBe(true)
    expect(isRedirected('/images/customers/logos/stigg.svg')).toBe(true)
    // hyper.svg moved out of logos/light/, which the :path* rule already covers.
    expect(isRedirected('/images/customers/logos/light/hyper.svg')).toBe(true)

    // Icon chips and dreambase-mark.png deliberately stayed put, so they must not redirect.
    expect(isRedirected('/images/customers/logos/chatbase-icon.svg')).toBe(false)
    expect(isRedirected('/images/customers/logos/dreambase-mark.png')).toBe(false)
  })
})
