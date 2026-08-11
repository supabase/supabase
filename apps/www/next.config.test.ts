import type { NextConfig } from 'next'
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
})
