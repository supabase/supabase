import { http, HttpResponse } from 'msw'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

import { Route as InviteRoute } from '@/routes/api/platform/auth/$ref/invite'
import { Route as MagicLinkRoute } from '@/routes/api/platform/auth/$ref/magiclink'
import { Route as OtpRoute } from '@/routes/api/platform/auth/$ref/otp'
import { Route as RecoverRoute } from '@/routes/api/platform/auth/$ref/recover'
import { mswServer, type APIErrorBody } from '@/tests/lib/msw'
import { getRouteHandler } from '@/tests/lib/server-route'

const SUPABASE_URL = 'http://supabase.test'

const routes = [
  { name: 'invite', route: InviteRoute, body: { email: 'user@example.com' } },
  { name: 'magiclink', route: MagicLinkRoute, body: { email: 'user@example.com' } },
  { name: 'otp', route: OtpRoute, body: { phone: '+15551234567' } },
  { name: 'recover', route: RecoverRoute, body: { email: 'user@example.com' } },
] as const

describe('self-hosted auth sender routes', () => {
  beforeAll(() => {
    vi.stubEnv('SUPABASE_URL', SUPABASE_URL)
    vi.stubEnv('SUPABASE_SERVICE_KEY', 'test-service-role-key')
  })

  afterAll(() => {
    vi.unstubAllEnvs()
  })

  it.each(routes)(
    '$name falls back to 500 when upstream fails with a network error',
    async ({ name, route, body }) => {
      mswServer.use(http.post(`${SUPABASE_URL}/auth/v1/${name}`, () => HttpResponse.error()))

      const response = await getRouteHandler(
        route,
        'POST'
      )({
        request: new Request(`http://localhost/api/platform/auth/default/${name}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }),
        params: { ref: 'default' },
      })

      expect(response.status).toBe(500)
      expect(await response.json()).toEqual({ message: expect.any(String) })
    }
  )

  it.each(routes)(
    '$name preserves explicit upstream error status codes',
    async ({ name, route, body }) => {
      const receivedBodies: unknown[] = []
      mswServer.use(
        http.post(`${SUPABASE_URL}/auth/v1/${name}`, async ({ request }) => {
          receivedBodies.push(await request.json())
          return HttpResponse.json<APIErrorBody>({ message: 'Rate limited' }, { status: 429 })
        })
      )

      const response = await getRouteHandler(
        route,
        'POST'
      )({
        request: new Request(`http://localhost/api/platform/auth/default/${name}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }),
        params: { ref: 'default' },
      })

      expect(receivedBodies).toEqual([body])
      expect(response.status).toBe(429)
      expect(await response.json()).toEqual({ message: 'Rate limited' })
    }
  )

  it.each(routes)('$name returns 405 with Allow: POST for GET', async ({ name, route }) => {
    const response = await getRouteHandler(
      route,
      'GET'
    )({
      request: new Request(`http://localhost/api/platform/auth/default/${name}`, { method: 'GET' }),
      params: { ref: 'default' },
    })

    expect(response.status).toBe(405)
    expect(response.headers.get('Allow')).toBe('POST')
  })
})
