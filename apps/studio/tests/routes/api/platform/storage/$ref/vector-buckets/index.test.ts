import { http, HttpResponse } from 'msw'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

import { Route } from '@/routes/api/platform/storage/$ref/vector-buckets/index'
import { mswServer } from '@/tests/lib/msw'
import { getRouteHandler } from '@/tests/lib/server-route'

const SUPABASE_URL = 'http://supabase.test'

describe('/api/platform/storage/$ref/vector-buckets', () => {
  beforeAll(() => {
    vi.stubEnv('SUPABASE_URL', SUPABASE_URL)
    vi.stubEnv('SUPABASE_SERVICE_KEY', 'test-service-role-key')
  })

  afterAll(() => {
    vi.unstubAllEnvs()
  })

  it('creates a vector bucket and returns 200 for a valid payload', async () => {
    const receivedBodies: unknown[] = []
    mswServer.use(
      http.post(`${SUPABASE_URL}/storage/v1/vector/CreateVectorBucket`, async ({ request }) => {
        receivedBodies.push(await request.json())
        return HttpResponse.json({ vectorBucketName: 'embeddings' })
      })
    )

    const response = await getRouteHandler(
      Route,
      'POST'
    )({
      request: new Request('http://localhost/api/platform/storage/default/vector-buckets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bucketName: 'embeddings' }),
      }),
      params: { ref: 'default' },
    })

    expect(receivedBodies).toEqual([{ vectorBucketName: 'embeddings' }])
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ vectorBucketName: 'embeddings' })
  })

  it('returns 400 when upstream createBucket fails', async () => {
    mswServer.use(
      http.post(`${SUPABASE_URL}/storage/v1/vector/CreateVectorBucket`, () =>
        HttpResponse.json(
          { message: 'Bucket already exists', code: 'ConflictException' },
          { status: 409 }
        )
      )
    )

    const response = await getRouteHandler(
      Route,
      'POST'
    )({
      request: new Request('http://localhost/api/platform/storage/default/vector-buckets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bucketName: 'embeddings' }),
      }),
      params: { ref: 'default' },
    })

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: { message: 'Bucket already exists' } })
  })

  it.each([
    ['JSON null', 'null'],
    ['missing bucketName', JSON.stringify({})],
    ['non-string bucketName', JSON.stringify({ bucketName: 123 })],
  ])('returns 400 without calling upstream for %s', async (_label, body) => {
    const upstreamSpy = vi.fn()
    mswServer.use(
      http.post(`${SUPABASE_URL}/storage/v1/vector/CreateVectorBucket`, () => {
        upstreamSpy()
        return HttpResponse.json({})
      })
    )

    const response = await getRouteHandler(
      Route,
      'POST'
    )({
      request: new Request('http://localhost/api/platform/storage/default/vector-buckets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      }),
      params: { ref: 'default' },
    })

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: { message: 'Invalid request body' } })
    expect(upstreamSpy).not.toHaveBeenCalled()
  })

  it('returns 405 with Allow: GET, POST for unsupported methods', async () => {
    const response = await getRouteHandler(
      Route,
      'DELETE'
    )({
      request: new Request('http://localhost/api/platform/storage/default/vector-buckets', {
        method: 'DELETE',
      }),
      params: { ref: 'default' },
    })

    expect(response.status).toBe(405)
    expect(response.headers.get('Allow')).toBe('GET, POST')
  })
})
