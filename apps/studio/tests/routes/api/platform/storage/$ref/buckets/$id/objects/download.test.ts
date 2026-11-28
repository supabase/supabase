import { http, HttpResponse } from 'msw'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

import { Route } from '@/routes/api/platform/storage/$ref/buckets/$id/objects/download'
import { mswServer } from '@/tests/lib/msw'
import { callRoute } from '@/tests/lib/server-route'

type StorageErrorResponse = { statusCode: string; error: string; message: string }

const SUPABASE_URL = 'http://supabase.test'

const downloadRequest = (path: string) =>
  new Request('http://localhost/api/platform/storage/default/buckets/avatars/objects/download', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path }),
  })

describe('/api/platform/storage/$ref/buckets/$id/objects/download', () => {
  beforeAll(() => {
    vi.stubEnv('SUPABASE_URL', SUPABASE_URL)
    vi.stubEnv('SUPABASE_SERVICE_KEY', 'test-service-role-key')
  })

  afterAll(() => {
    vi.unstubAllEnvs()
  })

  it('returns binary octet-stream bytes on POST success', async () => {
    const payload = new Uint8Array([0x89, 0x50, 0x4e, 0x47])
    mswServer.use(
      http.get(
        `${SUPABASE_URL}/storage/v1/object/avatars/logo.png`,
        () => new HttpResponse(payload, { headers: { 'Content-Type': 'image/png' } })
      )
    )

    const response = await callRoute(Route, downloadRequest('logo.png'), {
      ref: 'default',
      id: 'avatars',
    })

    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toBe('application/octet-stream')
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(payload)
  })

  it('returns 400 when storage download returns an error', async () => {
    mswServer.use(
      http.get(`${SUPABASE_URL}/storage/v1/object/avatars/missing.png`, () =>
        HttpResponse.json<StorageErrorResponse>(
          { statusCode: '404', error: 'not_found', message: 'Object not found' },
          { status: 400 }
        )
      )
    )

    const response = await callRoute(Route, downloadRequest('missing.png'), {
      ref: 'default',
      id: 'avatars',
    })

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: { message: 'Object not found' } })
  })
})
