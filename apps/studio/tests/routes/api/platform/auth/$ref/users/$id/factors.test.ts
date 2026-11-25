import { http, HttpResponse } from 'msw'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

import { Route } from '@/routes/api/platform/auth/$ref/users/$id/factors'
import { mswServer } from '@/tests/lib/msw'
import { getRouteHandler } from '@/tests/lib/server-route'

const SUPABASE_URL = 'http://supabase.test'
const USER_ID = '11111111-1111-4111-8111-111111111111'
const FACTOR_1_ID = '22222222-2222-4222-8222-222222222222'
const FACTOR_2_ID = '33333333-3333-4333-8333-333333333333'

function createDeferred() {
  let resolve!: () => void
  const promise = new Promise<void>((res) => {
    resolve = res
  })
  return { promise, resolve }
}

describe('/api/platform/auth/$ref/users/$id/factors', () => {
  beforeAll(() => {
    vi.stubEnv('SUPABASE_URL', SUPABASE_URL)
    vi.stubEnv('SUPABASE_SERVICE_KEY', 'test-service-role-key')
  })

  afterAll(() => {
    vi.unstubAllEnvs()
  })

  it('awaits all factor deletions before returning 200', async () => {
    const firstStarted = createDeferred()
    const secondStarted = createDeferred()
    const firstDelete = createDeferred()
    const secondDelete = createDeferred()
    const deletedFactorIds: string[] = []

    mswServer.use(
      http.get(`${SUPABASE_URL}/auth/v1/admin/users/${USER_ID}/factors`, () =>
        HttpResponse.json([{ id: FACTOR_1_ID }, { id: FACTOR_2_ID }])
      ),
      http.delete(
        `${SUPABASE_URL}/auth/v1/admin/users/${USER_ID}/factors/:factorId`,
        async ({ params }) => {
          const factorId = String(params.factorId)
          if (factorId === FACTOR_1_ID) {
            firstStarted.resolve()
            await firstDelete.promise
          } else if (factorId === FACTOR_2_ID) {
            secondStarted.resolve()
            await secondDelete.promise
          }
          deletedFactorIds.push(factorId)
          return HttpResponse.json({ id: factorId })
        }
      )
    )

    let settled = false
    const responsePromise = getRouteHandler(
      Route,
      'DELETE'
    )({
      request: new Request(`http://localhost/api/platform/auth/default/users/${USER_ID}/factors`, {
        method: 'DELETE',
      }),
      params: { ref: 'default', id: USER_ID },
    })
    responsePromise.then(
      () => {
        settled = true
      },
      () => {
        settled = true
      }
    )

    await Promise.all([firstStarted.promise, secondStarted.promise])
    expect(settled).toBe(false)

    firstDelete.resolve()
    await Promise.resolve()
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(deletedFactorIds).toEqual([FACTOR_1_ID])
    expect(settled).toBe(false)

    secondDelete.resolve()
    const response = await responsePromise

    expect(settled).toBe(true)
    expect(deletedFactorIds).toEqual([FACTOR_1_ID, FACTOR_2_ID])
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ data: null, error: null })
  })

  it('returns 400 when any factor deletion fails', async () => {
    mswServer.use(
      http.get(`${SUPABASE_URL}/auth/v1/admin/users/${USER_ID}/factors`, () =>
        HttpResponse.json([{ id: FACTOR_1_ID }, { id: FACTOR_2_ID }])
      ),
      http.delete(
        `${SUPABASE_URL}/auth/v1/admin/users/${USER_ID}/factors/:factorId`,
        ({ params }) => {
          if (params.factorId === FACTOR_2_ID) {
            return HttpResponse.json({ msg: 'Delete failed' }, { status: 400 })
          }
          return HttpResponse.json({ id: String(params.factorId) })
        }
      )
    )

    const response = await getRouteHandler(
      Route,
      'DELETE'
    )({
      request: new Request(`http://localhost/api/platform/auth/default/users/${USER_ID}/factors`, {
        method: 'DELETE',
      }),
      params: { ref: 'default', id: USER_ID },
    })

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: { message: 'Delete failed' } })
  })

  it('returns 405 with Allow: DELETE for unsupported methods', async () => {
    const response = await getRouteHandler(
      Route,
      'GET'
    )({
      request: new Request(`http://localhost/api/platform/auth/default/users/${USER_ID}/factors`, {
        method: 'GET',
      }),
      params: { ref: 'default', id: USER_ID },
    })

    expect(response.status).toBe(405)
    expect(response.headers.get('Allow')).toBe('DELETE')
  })
})
