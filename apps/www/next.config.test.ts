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
})
