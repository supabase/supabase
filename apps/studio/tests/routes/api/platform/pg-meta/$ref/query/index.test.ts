import { http, HttpResponse } from 'msw'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

import { mswServer } from '@/tests/lib/msw'
import { getRouteHandler } from '@/tests/lib/server-route'

const PG_META_URL = 'http://meta.test'

describe('/api/platform/pg-meta/$ref/query', () => {
  let Route: typeof import('@/routes/api/platform/pg-meta/$ref/query/index').Route

  beforeAll(async () => {
    vi.stubEnv('NEXT_PUBLIC_IS_PLATFORM', 'false')
    vi.stubEnv('STUDIO_PG_META_URL', PG_META_URL)
    vi.resetModules()
    const mod = await import('@/routes/api/platform/pg-meta/$ref/query/index')
    Route = mod.Route
  })

  afterAll(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it('executes the query and returns 200 JSON', async () => {
    let capturedBody: unknown
    let capturedContentType: string | null = null
    let capturedEncryptedConnection: string | null = null

    mswServer.use(
      http.post(`${PG_META_URL}/query`, async ({ request }) => {
        capturedBody = await request.json()
        capturedContentType = request.headers.get('content-type')
        capturedEncryptedConnection = request.headers.get('x-connection-encrypted')
        return HttpResponse.json([{ one: 1 }])
      })
    )

    const response = await getRouteHandler(
      Route,
      'POST'
    )({
      request: new Request('http://localhost/api/platform/pg-meta/default/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: 'select 1 as one' }),
      }),
      params: { ref: 'default' },
    })

    expect(capturedBody).toEqual({ query: 'select 1 as one' })
    expect(capturedContentType).toBe('application/json')
    expect(capturedEncryptedConnection).toBeTruthy()
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual([{ one: 1 }])
  })

  it('preserves PgMetaDatabaseError status codes', async () => {
    mswServer.use(
      http.post(`${PG_META_URL}/query`, () =>
        HttpResponse.json(
          {
            message: 'syntax error',
            code: '42601',
            formattedError: 'ERROR: syntax error',
          },
          { status: 400 }
        )
      )
    )

    const response = await getRouteHandler(
      Route,
      'POST'
    )({
      request: new Request('http://localhost/api/platform/pg-meta/default/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: 'select from' }),
      }),
      params: { ref: 'default' },
    })

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({
      message: 'syntax error',
      formattedError: 'ERROR: syntax error',
    })
  })

  it('returns 400 for malformed JSON bodies', async () => {
    const response = await getRouteHandler(
      Route,
      'POST'
    )({
      request: new Request('http://localhost/api/platform/pg-meta/default/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{',
      }),
      params: { ref: 'default' },
    })

    expect(response.status).toBe(400)
  })

  it('returns 405 with Allow: POST for unsupported methods', async () => {
    const response = await getRouteHandler(
      Route,
      'GET'
    )({
      request: new Request('http://localhost/api/platform/pg-meta/default/query', {
        method: 'GET',
      }),
      params: { ref: 'default' },
    })

    expect(response.status).toBe(405)
    expect(response.headers.get('Allow')).toBe('POST')
  })
})
