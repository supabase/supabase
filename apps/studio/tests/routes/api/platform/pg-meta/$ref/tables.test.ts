import type { PGTable } from '@supabase/pg-meta'
import { http, HttpResponse } from 'msw'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

import { mswServer } from '@/tests/lib/msw'
import { callRoute } from '@/tests/lib/server-route'

const PG_META_URL = 'http://meta.test'

const mockTable: PGTable = {
  id: 1,
  schema: 'public',
  name: 'users',
  rls_enabled: true,
  rls_forced: false,
  replica_identity: 'DEFAULT',
  bytes: 8192,
  size: '8 kB',
  live_rows_estimate: 10,
  dead_rows_estimate: 0,
  comment: null,
  primary_keys: [],
  relationships: [],
}

describe('/api/platform/pg-meta/$ref/tables', () => {
  let Route: typeof import('@/routes/api/platform/pg-meta/$ref/tables').Route

  beforeAll(async () => {
    vi.stubEnv('NEXT_PUBLIC_IS_PLATFORM', 'false')
    vi.stubEnv('STUDIO_PG_META_URL', PG_META_URL)
    vi.resetModules()
    const mod = await import('@/routes/api/platform/pg-meta/$ref/tables')
    Route = mod.Route
  })

  afterAll(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it('forwards query params to pg-meta and returns the response', async () => {
    let includedSchemas: string[] = []
    let forwardedHeaders: Headers | undefined

    mswServer.use(
      http.get(`${PG_META_URL}/tables`, ({ request }) => {
        includedSchemas = new URL(request.url).searchParams.getAll('included_schemas')
        forwardedHeaders = request.headers
        return HttpResponse.json<PGTable[]>([mockTable])
      })
    )

    const response = await callRoute(
      Route,
      new Request(
        'http://localhost/api/platform/pg-meta/default/tables?included_schemas=public&included_schemas=auth',
        {
          headers: {
            authorization: 'Basic browser-credentials',
            cookie: 'session=abc',
            'x-connection-encrypted': 'encrypted-connection',
          },
        }
      ),
      { ref: 'default' }
    )

    expect(includedSchemas).toEqual(['public', 'auth'])
    // Only the cookie and connection headers are relayed, as with the Next API adapter
    expect(forwardedHeaders?.get('cookie')).toBe('session=abc')
    expect(forwardedHeaders?.get('x-connection-encrypted')).toBe('encrypted-connection')
    expect(forwardedHeaders?.get('authorization')).not.toBe('Basic browser-credentials')
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual([mockTable])
  })

  it('falls back to 500 when the upstream error has no status code', async () => {
    mswServer.use(http.get(`${PG_META_URL}/tables`, () => HttpResponse.error()))

    const response = await callRoute(
      Route,
      new Request('http://localhost/api/platform/pg-meta/default/tables'),
      { ref: 'default' }
    )

    expect(response.status).toBe(500)
    expect(await response.json()).toEqual({ message: expect.stringMatching(/\S/) })
  })
})
