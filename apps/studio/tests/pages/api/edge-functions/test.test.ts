import { createMocks } from 'node-mocks-http'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import handler from '../../../../pages/api/edge-functions/test'

const mocks = vi.hoisted(() => ({ isPlatform: true }))

vi.mock('common', () => ({
  get IS_PLATFORM() {
    return mocks.isPlatform
  },
}))

const createRequest = (
  url = 'https://abcdefghijklmnopqrst.supabase.co/functions/v1/test',
  headers: Record<string, string> = {}
) =>
  createMocks({
    method: 'POST',
    body: {
      url,
      method: 'POST',
      body: '{}',
      headers,
    },
  })

describe('/api/edge-functions/test', () => {
  afterEach(() => {
    mocks.isPlatform = true
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
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

  it.each([
    ['another host', 'https://example.com/functions/v1/test'],
    ['userinfo', 'https://abcdefghijklmnopqrst.supabase.co@example.com/functions/v1/test'],
    ['a path outside functions', 'https://abcdefghijklmnopqrst.supabase.co/rest/v1/test'],
  ])('rejects %s without making an upstream request', async (_name, url) => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const { req, res } = createRequest(url)

    await handler(req, res)

    expect(fetchMock).not.toHaveBeenCalled()
    expect(res._getStatusCode()).toBe(400)
    expect(JSON.parse(res._getData())).toEqual({
      status: 400,
      error: { message: 'Provided URL is not a valid Supabase edge function URL' },
    })
  })

  describe('self-hosted', () => {
    beforeEach(() => {
      mocks.isPlatform = false
      vi.stubEnv('SUPABASE_URL', 'http://kong:8000')
      vi.stubEnv('SUPABASE_PUBLIC_URL', 'http://localhost:8000')
    })

    it('calls the public edge function URL through the internal API gateway', async () => {
      const fetchMock = vi.fn().mockResolvedValue(new Response(null))
      vi.stubGlobal('fetch', fetchMock)
      const { req, res } = createRequest('http://localhost:8000/functions/v1/test?name=a')

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      expect(fetchMock.mock.calls[0][0]).toBe('http://kong:8000/functions/v1/test?name=a')
    })

    it('rejects hosts other than the API gateway', async () => {
      const fetchMock = vi.fn()
      vi.stubGlobal('fetch', fetchMock)
      const { req, res } = createRequest('http://example.com/functions/v1/test')

      await handler(req, res)

      expect(fetchMock).not.toHaveBeenCalled()
      expect(res._getStatusCode()).toBe(400)
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
