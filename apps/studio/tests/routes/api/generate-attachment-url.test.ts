import type { User } from '@supabase/auth-js'
import { http, HttpResponse } from 'msw'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { Route } from '@/routes/api/generate-attachment-url'
import { mswServer } from '@/tests/lib/msw'
import { callRoute } from '@/tests/lib/server-route'

type GoTrueErrorResponse = { msg: string }
type CreateSignedUrlsResponse = Array<{
  error: string | null
  path: string | null
  signedURL: string | null
}>

const { GOTRUE_URL } = vi.hoisted(() => {
  const url = 'https://auth.example.test'
  vi.stubEnv('NEXT_PUBLIC_GOTRUE_URL', url)
  return { GOTRUE_URL: url }
})

const SUPPORT_API_URL = 'https://support.example.test'
const SUPPORT_SECRET_KEY = 'sb_secret_test_key'

function createJwt(sub: string): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')
  const payload = Buffer.from(
    JSON.stringify({
      sub,
      aud: 'authenticated',
      role: 'authenticated',
      exp: Math.floor(Date.now() / 1000) + 3600,
    })
  ).toString('base64url')
  const signature = Buffer.from('test-signature').toString('base64url')
  return `${header}.${payload}.${signature}`
}

function postAttachmentUrl(init: { headers?: HeadersInit; body: string }) {
  return callRoute(
    Route,
    new Request('http://localhost/api/generate-attachment-url', { method: 'POST', ...init })
  )
}

function mockGoTrueUser(token: string, userId: string) {
  mswServer.use(
    http.get<never, never, User | GoTrueErrorResponse>(`${GOTRUE_URL}/user`, ({ request }) => {
      if (request.headers.get('authorization') !== `Bearer ${token}`) {
        return HttpResponse.json<GoTrueErrorResponse>({ msg: 'Invalid JWT' }, { status: 401 })
      }
      return HttpResponse.json<User>({
        id: userId,
        aud: 'authenticated',
        app_metadata: {},
        user_metadata: {},
        created_at: '2026-01-01T00:00:00Z',
      })
    })
  )
}

describe('/api/generate-attachment-url', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_SUPPORT_API_URL', SUPPORT_API_URL)
    vi.stubEnv('SUPPORT_SUPABASE_SECRET_KEY', SUPPORT_SECRET_KEY)
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
  })

  it('parses text/plain JSON payloads and returns signed URLs for the user prefix', async () => {
    const token = createJwt('user-1')
    mockGoTrueUser(token, 'user-1')

    let capturedSignRequest: { apikey: string | null; body: unknown } | undefined
    mswServer.use(
      http.post(
        `${SUPPORT_API_URL}/storage/v1/object/sign/support-attachments`,
        async ({ request }) => {
          capturedSignRequest = {
            apikey: request.headers.get('apikey'),
            body: await request.json(),
          }
          return HttpResponse.json<CreateSignedUrlsResponse>([
            {
              error: null,
              path: 'user-1/screenshot.png',
              signedURL: '/object/sign/support-attachments/user-1/screenshot.png?token=abc',
            },
          ])
        }
      )
    )

    const response = await postAttachmentUrl({
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'text/plain;charset=UTF-8',
      },
      body: JSON.stringify({ filenames: ['user-1/screenshot.png'] }),
    })

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual([
      `${SUPPORT_API_URL}/storage/v1/object/sign/support-attachments/user-1/screenshot.png?token=abc`,
    ])
    expect(capturedSignRequest).toEqual({
      apikey: SUPPORT_SECRET_KEY,
      body: {
        paths: ['user-1/screenshot.png'],
        expiresIn: 10 * 365 * 24 * 60 * 60,
      },
    })
  })

  it('returns 401 when auth fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const token = createJwt('user-1')
    mswServer.use(
      http.get(`${GOTRUE_URL}/user`, () =>
        HttpResponse.json<GoTrueErrorResponse>({ msg: 'Invalid JWT' }, { status: 401 })
      )
    )

    const response = await postAttachmentUrl({
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ filenames: ['user-1/screenshot.png'] }),
    })

    expect(response.status).toBe(401)
  })

  it('returns 401 when the Authorization header is missing', async () => {
    const response = await postAttachmentUrl({
      body: JSON.stringify({ filenames: ['user-1/screenshot.png'] }),
    })

    expect(response.status).toBe(401)
  })

  it('returns 403 when a requested filename belongs to another user', async () => {
    const token = createJwt('user-1')
    mockGoTrueUser(token, 'user-1')

    const response = await postAttachmentUrl({
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ filenames: ['user-2/secret.png'] }),
    })

    expect(response.status).toBe(403)
  })
})
