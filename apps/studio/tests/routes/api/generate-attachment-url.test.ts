import { beforeEach, describe, expect, it, vi } from 'vitest'

import { Route } from '@/routes/api/generate-attachment-url'
import { getRouteHandler } from '@/tests/lib/server-route'

const mocks = vi.hoisted(() => ({
  getUserClaims: vi.fn(),
  createSignedUrls: vi.fn(),
}))

vi.mock('@/lib/constants', () => ({
  IS_PLATFORM: false,
  API_URL: 'https://api.example.com',
}))

vi.mock('@/lib/gotrue', () => ({
  getUserClaims: mocks.getUserClaims,
}))

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    storage: {
      from: vi.fn(() => ({
        createSignedUrls: mocks.createSignedUrls,
      })),
    },
  })),
}))

describe('/api/generate-attachment-url', () => {
  beforeEach(() => {
    mocks.getUserClaims.mockReset()
    mocks.createSignedUrls.mockReset()
  })

  it('parses text/plain JSON payloads and returns signed URLs for the user prefix', async () => {
    mocks.getUserClaims.mockResolvedValue({ claims: { sub: 'user-1' }, error: null })
    mocks.createSignedUrls.mockResolvedValue({
      data: [{ signedUrl: 'https://signed.example/a' }],
      error: null,
    })

    const response = await getRouteHandler(
      Route,
      'POST'
    )({
      request: new Request('http://localhost/api/generate-attachment-url', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer tok',
          'Content-Type': 'text/plain;charset=UTF-8',
        },
        body: JSON.stringify({ filenames: ['user-1/screenshot.png'] }),
      }),
    })

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual(['https://signed.example/a'])
  })

  it('returns 403 when a requested filename belongs to another user', async () => {
    mocks.getUserClaims.mockResolvedValue({ claims: { sub: 'user-1' }, error: null })

    const response = await getRouteHandler(
      Route,
      'POST'
    )({
      request: new Request('http://localhost/api/generate-attachment-url', {
        method: 'POST',
        headers: { Authorization: 'Bearer tok' },
        body: JSON.stringify({ filenames: ['user-2/secret.png'] }),
      }),
    })

    expect(response.status).toBe(403)
  })

  it('returns 400 on malformed JSON body', async () => {
    mocks.getUserClaims.mockResolvedValue({ claims: { sub: 'user-1' }, error: null })

    const response = await getRouteHandler(
      Route,
      'POST'
    )({
      request: new Request('http://localhost/api/generate-attachment-url', {
        method: 'POST',
        headers: { Authorization: 'Bearer tok', 'Content-Type': 'application/json' },
        body: '{invalid',
      }),
    })

    expect(response.status).toBe(400)
  })

  it('returns 405 with Allow: POST for unsupported methods', async () => {
    const response = await getRouteHandler(
      Route,
      'GET'
    )({
      request: new Request('http://localhost/api/generate-attachment-url', { method: 'GET' }),
    })

    expect(response.status).toBe(405)
    expect(response.headers.get('Allow')).toBe('POST')
  })
})
