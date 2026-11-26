import { uninstall } from '@stripe/sync-engine/supabase'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { Route } from '@/routes/api/integrations/stripe-sync'
import { callRoute } from '@/tests/lib/server-route'

vi.mock('@vercel/functions', () => ({
  waitUntil: vi.fn(),
}))

vi.mock('@stripe/sync-engine/supabase', () => ({
  install: vi.fn().mockResolvedValue(undefined),
  uninstall: vi.fn().mockResolvedValue(undefined),
}))

describe('/api/integrations/stripe-sync', () => {
  afterEach(() => {
    vi.clearAllMocks()
    vi.unstubAllGlobals()
  })

  it('returns 401 when Authorization header is missing on POST', async () => {
    const response = await callRoute(
      Route,
      new Request('http://localhost/api/integrations/stripe-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectRef: 'ref', stripeSecretKey: 'sk_test_123' }),
      })
    )

    expect(response.status).toBe(401)
  })

  it('returns 200 on DELETE with valid bearer token and body', async () => {
    const response = await callRoute(
      Route,
      new Request('http://localhost/api/integrations/stripe-sync', {
        method: 'DELETE',
        headers: {
          Authorization: 'Bearer supa-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ projectRef: 'ref' }),
      })
    )

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      data: { message: 'Stripe Sync uninstallation initiated' },
      error: null,
    })
    expect(uninstall).toHaveBeenCalledWith(
      expect.objectContaining({
        supabaseAccessToken: 'supa-token',
        supabaseProjectRef: 'ref',
      })
    )
  })
})
