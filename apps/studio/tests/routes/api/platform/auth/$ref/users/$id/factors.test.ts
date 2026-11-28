import type { AuthMFAAdminDeleteFactorResponse, Factor } from '@supabase/auth-js'
import { delay, http, HttpResponse } from 'msw'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

import { Route } from '@/routes/api/platform/auth/$ref/users/$id/factors'
import { mswServer } from '@/tests/lib/msw'
import { callRoute } from '@/tests/lib/server-route'

type DeleteFactorResponse = NonNullable<AuthMFAAdminDeleteFactorResponse['data']>
type GoTrueErrorResponse = { msg: string }

const SUPABASE_URL = 'http://supabase.test'
const USER_ID = '11111111-1111-4111-8111-111111111111'
const FACTOR_1_ID = '22222222-2222-4222-8222-222222222222'
const FACTOR_2_ID = '33333333-3333-4333-8333-333333333333'

function makeFactor(id: string): Factor {
  return {
    id,
    factor_type: 'totp',
    status: 'verified',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  }
}

function deleteFactors() {
  return callRoute(
    Route,
    new Request(`http://localhost/api/platform/auth/default/users/${USER_ID}/factors`, {
      method: 'DELETE',
    }),
    { ref: 'default', id: USER_ID }
  )
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
    const deletedFactorIds: string[] = []
    mswServer.use(
      http.get(`${SUPABASE_URL}/auth/v1/admin/users/${USER_ID}/factors`, () =>
        HttpResponse.json<Factor[]>([makeFactor(FACTOR_1_ID), makeFactor(FACTOR_2_ID)])
      ),
      http.delete(
        `${SUPABASE_URL}/auth/v1/admin/users/${USER_ID}/factors/:factorId`,
        async ({ params }) => {
          // Record only after a delay so the test fails if the route returns before deletes finish
          await delay(20)
          deletedFactorIds.push(String(params.factorId))
          return HttpResponse.json<DeleteFactorResponse>({ id: String(params.factorId) })
        }
      )
    )

    const response = await deleteFactors()

    expect(deletedFactorIds.sort()).toEqual([FACTOR_1_ID, FACTOR_2_ID])
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ data: null, error: null })
  })

  it('returns 400 when any factor deletion fails', async () => {
    mswServer.use(
      http.get(`${SUPABASE_URL}/auth/v1/admin/users/${USER_ID}/factors`, () =>
        HttpResponse.json<Factor[]>([makeFactor(FACTOR_1_ID), makeFactor(FACTOR_2_ID)])
      ),
      http.delete<{ factorId: string }, never, DeleteFactorResponse | GoTrueErrorResponse>(
        `${SUPABASE_URL}/auth/v1/admin/users/${USER_ID}/factors/:factorId`,
        ({ params }) => {
          if (params.factorId === FACTOR_2_ID) {
            return HttpResponse.json<GoTrueErrorResponse>({ msg: 'Delete failed' }, { status: 400 })
          }
          return HttpResponse.json<DeleteFactorResponse>({ id: String(params.factorId) })
        }
      )
    )

    const response = await deleteFactors()

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: { message: 'Delete failed' } })
  })
})
