import type { User } from '@supabase/auth-js'
import { http, HttpResponse } from 'msw'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

import { Route } from '@/routes/api/platform/auth/$ref/users/$id/index'
import { mswServer } from '@/tests/lib/msw'
import { getRouteHandler } from '@/tests/lib/server-route'

const SUPABASE_URL = 'http://supabase.test'
const USER_ID = '11111111-1111-4111-8111-111111111111'

const mockUser: User = {
  id: USER_ID,
  aud: 'authenticated',
  app_metadata: {},
  user_metadata: {},
  created_at: '2026-01-01T00:00:00Z',
}

describe('/api/platform/auth/$ref/users/$id', () => {
  beforeAll(() => {
    vi.stubEnv('SUPABASE_URL', SUPABASE_URL)
    vi.stubEnv('SUPABASE_SERVICE_KEY', 'test-service-role-key')
  })

  afterAll(() => {
    vi.unstubAllEnvs()
  })

  it('updates ban_duration on PATCH', async () => {
    const receivedBodies: unknown[] = []
    mswServer.use(
      http.put(`${SUPABASE_URL}/auth/v1/admin/users/${USER_ID}`, async ({ request }) => {
        receivedBodies.push(await request.json())
        return HttpResponse.json<User>(mockUser)
      })
    )

    const response = await getRouteHandler(
      Route,
      'PATCH'
    )({
      request: new Request(`http://localhost/api/platform/auth/default/users/${USER_ID}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ban_duration: '24h' }),
      }),
      params: { ref: 'default', id: USER_ID },
    })

    expect(receivedBodies).toEqual([{ ban_duration: '24h' }])
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual(mockUser)
  })

  it('deletes the user on DELETE', async () => {
    const deletedUserIds: string[] = []
    mswServer.use(
      http.delete(`${SUPABASE_URL}/auth/v1/admin/users/:id`, ({ params }) => {
        deletedUserIds.push(String(params.id))
        return HttpResponse.json<Record<string, never>>({})
      })
    )

    const response = await getRouteHandler(
      Route,
      'DELETE'
    )({
      request: new Request(`http://localhost/api/platform/auth/default/users/${USER_ID}`, {
        method: 'DELETE',
      }),
      params: { ref: 'default', id: USER_ID },
    })

    expect(deletedUserIds).toEqual([USER_ID])
    expect(response.status).toBe(200)
  })

  it('returns 405 with Allow: PATCH, DELETE for unsupported methods', async () => {
    const response = await getRouteHandler(
      Route,
      'GET'
    )({
      request: new Request(`http://localhost/api/platform/auth/default/users/${USER_ID}`, {
        method: 'GET',
      }),
      params: { ref: 'default', id: USER_ID },
    })

    expect(response.status).toBe(405)
    expect(response.headers.get('Allow')).toBe('PATCH, DELETE')
  })
})
