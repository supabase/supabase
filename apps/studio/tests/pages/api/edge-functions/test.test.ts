import { createMocks } from 'node-mocks-http'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import handler from '../../../../pages/api/edge-functions/test'
import { toWebHandler } from '@/compat/next/api'

const { deployment, getUserClaims } = vi.hoisted(() => ({
  deployment: { isPlatform: true },
  getUserClaims: vi.fn(),
}))

vi.mock('@/lib/constants', () => ({
  get IS_PLATFORM() {
    return deployment.isPlatform
  },
}))
vi.mock('@/lib/gotrue', () => ({ getUserClaims }))
vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn() }))

const createRequest = (
  url = 'https://abcdefghijklmnopqrst.supabase.co/functions/v1/test',
  headers: Record<string, string> = {}
) =>
  createMocks({
    method: 'POST',
    headers: { authorization: 'Bearer studio-session' },
    body: {
      url,
      method: 'POST',
      body: '{}',
      headers,
    },
  })

describe('/api/edge-functions/test', () => {
  beforeEach(() => {
    deployment.isPlatform = true
    getUserClaims.mockReset()
    getUserClaims.mockResolvedValue({ claims: { sub: 'user-id' }, error: null })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
  })

  it('rejects unauthenticated requests before fetching', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const { req, res } = createRequest(undefined, { Authorization: 'Bearer function-token' })
    delete req.headers.authorization

    await handler(req, res)

    expect(res._getStatusCode()).toBe(401)
    expect(getUserClaims).not.toHaveBeenCalled()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('enforces authentication through the TanStack API adapter', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const response = await toWebHandler(handler)({
      request: new Request('http://localhost/api/edge-functions/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createRequest().req.body),
      }),
    })

    expect(response.status).toBe(401)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it.each([undefined, null, 123, {}])('rejects a non-string URL: %s', async (url) => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const { req, res } = createRequest()
    req.body.url = url

    await handler(req, res)

    expect(res._getStatusCode()).toBe(400)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('rejects invalid sessions before fetching', async () => {
    getUserClaims.mockResolvedValue({ claims: null, error: new Error('Invalid token') })
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const { req, res } = createRequest()

    await handler(req, res)

    expect(res._getStatusCode()).toBe(401)
    expect(getUserClaims).toHaveBeenCalledWith('studio-session')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  describe('self-hosted destinations', () => {
    beforeEach(() => {
      deployment.isPlatform = false
      vi.stubEnv('SUPABASE_URL', 'http://kong:8000')
      vi.stubEnv('SUPABASE_PUBLIC_URL', 'https://supabase.example.com')
    })

    it.each([
      'https://supabase.example.com/functions/v1/test?name=value',
      'http://kong:8000/functions/v1/test?name=value',
    ])('forwards %s to the configured gateway', async (url) => {
      const fetchMock = vi.fn().mockResolvedValue(new Response(null))
      vi.stubGlobal('fetch', fetchMock)
      const { req, res } = createRequest(url)
      delete req.headers.authorization

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      expect(getUserClaims).not.toHaveBeenCalled()
      expect(fetchMock).toHaveBeenCalledWith(
        'http://kong:8000/functions/v1/test?name=value',
        expect.objectContaining({ redirect: 'manual' })
      )
    })

    it.each([
      'http://169.254.169.254/functions/v1/test',
      'http://127.0.0.1/functions/v1/test',
      'http://internal-service/functions/v1/test',
      'http://kong:8001/functions/v1/test',
      'https://supabase.example.com.evil.example/functions/v1/test',
      'https://supabase.example.com@evil.example/functions/v1/test',
      'https://evil.example/functions/v1/https://supabase.example.com',
      'https://supabase.example.com/functions/v1/../../rest/v1/test',
      'http://kong:8000/functions/v1/%2e%2e/%2e%2e/rest/v1/test',
      'https://user:password@supabase.example.com/functions/v1/test',
      'not a URL',
      '',
    ])('rejects %s without fetching', async (url) => {
      const fetchMock = vi.fn()
      vi.stubGlobal('fetch', fetchMock)
      const { req, res } = createRequest(url)

      await handler(req, res)

      expect(res._getStatusCode()).toBe(400)
      expect(fetchMock).not.toHaveBeenCalled()
    })

    it('fails closed when the internal URL is missing', async () => {
      vi.stubEnv('SUPABASE_URL', undefined)
      const fetchMock = vi.fn()
      vi.stubGlobal('fetch', fetchMock)
      const { req, res } = createRequest('https://supabase.example.com/functions/v1/test')

      await handler(req, res)

      expect(res._getStatusCode()).toBe(400)
      expect(fetchMock).not.toHaveBeenCalled()
    })

    it('clears the public port when the internal URL uses a default port', async () => {
      vi.stubEnv('SUPABASE_URL', 'http://gateway')
      vi.stubEnv('SUPABASE_PUBLIC_URL', 'https://supabase.example.com:8443/')
      const fetchMock = vi.fn().mockResolvedValue(new Response(null))
      vi.stubGlobal('fetch', fetchMock)
      const { req, res } = createRequest('https://supabase.example.com:8443/functions/v1/test')

      await handler(req, res)

      expect(fetchMock).toHaveBeenCalledWith('http://gateway/functions/v1/test', expect.anything())
    })
  })

  it('preserves unsuccessful edge function responses', async () => {
    const body = JSON.stringify({
      code: 'UNAUTHORIZED_NO_AUTH_HEADER',
      message: 'Missing authorization header',
    })
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(body, {
          status: 401,
          headers: {
            'content-type': 'application/json',
            'sb-error-code': 'UNAUTHORIZED_NO_AUTH_HEADER',
          },
        })
      )
    )
    const { req, res } = createRequest()

    await handler(req, res)

    expect(res._getStatusCode()).toBe(200)
    expect(JSON.parse(res._getData())).toEqual({
      status: 401,
      headers: {
        'content-type': 'application/json',
        'sb-error-code': 'UNAUTHORIZED_NO_AUTH_HEADER',
      },
      body,
    })
  })

  it('preserves multiple Set-Cookie headers', async () => {
    const headers = new Headers()
    headers.append('set-cookie', 'session=one; Path=/; HttpOnly')
    headers.append('set-cookie', 'csrf=two; Path=/; SameSite=Lax')
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { headers })))
    const { req, res } = createRequest()

    await handler(req, res)

    expect(JSON.parse(res._getData())).toEqual({
      status: 200,
      headers: {
        'set-cookie': ['session=one; Path=/; HttpOnly', 'csrf=two; Path=/; SameSite=Lax'],
      },
      body: '',
    })
  })

  it.each([
    ['successful JSON', JSON.stringify({ ok: true }), 'application/json', 200],
    [
      'gateway JSON',
      JSON.stringify({ message: 'Name resolution failed' }),
      'application/json',
      503,
    ],
    ['legacy JSON', JSON.stringify({ msg: 'Invalid JWT' }), 'application/json', 503],
    [
      'nested JSON',
      JSON.stringify({ error: { message: 'Function failed' } }),
      'application/json',
      503,
    ],
    ['arbitrary JSON', JSON.stringify({ details: ['Function failed'] }), 'application/json', 503],
    ['plain text', 'Bad Gateway', 'text/plain', 503],
    ['malformed JSON', '{"message": invalid json', 'application/json', 503],
  ])('preserves %s bodies without parsing them', async (_name, body, contentType, status) => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(body, {
          status,
          headers: { 'content-type': contentType },
        })
      )
    )
    const { req, res } = createRequest()

    await handler(req, res)

    expect(res._getStatusCode()).toBe(200)
    expect(JSON.parse(res._getData())).toEqual({
      status,
      headers: { 'content-type': contentType },
      body,
    })
  })

  it('rejects invalid URLs without making an upstream request', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const { req, res } = createRequest('https://example.com/functions/v1/test')

    await handler(req, res)

    expect(fetchMock).not.toHaveBeenCalled()
    expect(res._getStatusCode()).toBe(400)
    expect(JSON.parse(res._getData())).toEqual({
      status: 400,
      error: { message: 'Provided URL is not a valid Supabase edge function URL' },
    })
  })

  it('forwards the supplied headers without rewriting Authorization', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null))
    vi.stubGlobal('fetch', fetchMock)
    const { req, res } = createRequest(undefined, {
      apikey: 'sb_publishable_test_key',
      Authorization: 'Bearer user-token',
    })

    await handler(req, res)

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock.mock.calls[0][1].headers).toEqual({
      'Content-Type': 'application/json',
      apikey: 'sb_publishable_test_key',
      Authorization: 'Bearer user-token',
    })
  })

  it('lets a supplied header replace the default whatever its casing', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null))
    vi.stubGlobal('fetch', fetchMock)
    const { req, res } = createRequest(undefined, { 'content-type': 'text/plain' })

    await handler(req, res)

    expect(fetchMock.mock.calls[0][1].headers).toEqual({ 'content-type': 'text/plain' })
  })

  it('drops empty header values', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null))
    vi.stubGlobal('fetch', fetchMock)
    const { req, res } = createRequest(undefined, { apikey: '', 'x-kept': 'value' })

    await handler(req, res)

    expect(fetchMock.mock.calls[0][1].headers).toEqual({
      'Content-Type': 'application/json',
      'x-kept': 'value',
    })
  })

  it('returns fetch failures as proxy errors', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Connection refused')))
    const { req, res } = createRequest()

    await handler(req, res)

    expect(res._getStatusCode()).toBe(500)
    expect(JSON.parse(res._getData())).toEqual({
      status: 500,
      error: { message: 'Connection refused' },
    })
  })
})
