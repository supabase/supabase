import { beforeEach, describe, expect, it, vi } from 'vitest'

import { fetchPost } from '@/data/fetchers'
import { Route as InviteRoute } from '@/routes/api/platform/auth/$ref/invite'
import { Route as MagicLinkRoute } from '@/routes/api/platform/auth/$ref/magiclink'
import { Route as OtpRoute } from '@/routes/api/platform/auth/$ref/otp'
import { Route as RecoverRoute } from '@/routes/api/platform/auth/$ref/recover'
import { getRouteHandler } from '@/tests/lib/server-route'

vi.mock('@/data/fetchers', () => ({
  fetchPost: vi.fn(),
}))

const routes = [
  { name: 'invite', route: InviteRoute, body: { email: 'user@example.com' } },
  { name: 'magiclink', route: MagicLinkRoute, body: { email: 'user@example.com' } },
  { name: 'otp', route: OtpRoute, body: { phone: '+15551234567' } },
  { name: 'recover', route: RecoverRoute, body: { email: 'user@example.com' } },
] as const

describe('self-hosted auth sender routes', () => {
  beforeEach(() => {
    vi.mocked(fetchPost).mockReset()
  })

  it.each(routes)(
    '$name falls back to 500 when upstream error has no code',
    async ({ route, body }) => {
      vi.mocked(fetchPost).mockResolvedValue({
        error: { message: 'Network error', code: undefined },
      })

      const response = await getRouteHandler(
        route,
        'POST'
      )({
        request: new Request('http://localhost/api/platform/auth/default/sender', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }),
        params: { ref: 'default' },
      })

      expect(response.status).toBe(500)
      expect(await response.json()).toEqual({ message: 'Network error' })
    }
  )

  it.each(routes)(
    '$name preserves explicit upstream error status codes',
    async ({ route, body }) => {
      vi.mocked(fetchPost).mockResolvedValue({
        error: { message: 'Rate limited', code: 429 },
      })

      const response = await getRouteHandler(
        route,
        'POST'
      )({
        request: new Request('http://localhost/api/platform/auth/default/sender', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }),
        params: { ref: 'default' },
      })

      expect(response.status).toBe(429)
      expect(await response.json()).toEqual({ message: 'Rate limited' })
    }
  )

  it.each(routes)('$name returns 405 with Allow: POST for GET', async ({ route }) => {
    const response = await getRouteHandler(
      route,
      'GET'
    )({
      request: new Request('http://localhost/api/platform/auth/default/sender', { method: 'GET' }),
      params: { ref: 'default' },
    })

    expect(response.status).toBe(405)
    expect(response.headers.get('Allow')).toBe('POST')
  })
})
