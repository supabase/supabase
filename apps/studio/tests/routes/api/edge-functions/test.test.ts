import { afterEach, describe, expect, it, vi } from 'vitest'

import { Route } from '@/routes/api/edge-functions/test'
import { getRouteHandler } from '@/tests/lib/server-route'

vi.mock('common', () => ({ IS_PLATFORM: true }))

const testEdgeFunction = (
  url = 'https://abcdefghijklmnopqrst.supabase.co/functions/v1/test',
  headers: Record<string, string> = {}
) =>
  getRouteHandler(
    Route,
    'POST'
  )({
    request: new Request('http://localhost/api/edge-functions/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, method: 'POST', body: '{}', headers }),
    }),
  })

describe('/api/edge-functions/test', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
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
    const response = await testEdgeFunction()

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
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
    const response = await testEdgeFunction()

    expect(await response.json()).toEqual({
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
    const response = await testEdgeFunction()

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      status,
      headers: { 'content-type': contentType },
      body,
    })
  })

  it('rejects invalid URLs without making an upstream request', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const response = await testEdgeFunction('https://example.com/functions/v1/test')

    expect(fetchMock).not.toHaveBeenCalled()
    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({
      status: 400,
      error: { message: 'Provided URL is not a valid Supabase edge function URL' },
    })
  })

  it('forwards the supplied headers without rewriting Authorization', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null))
    vi.stubGlobal('fetch', fetchMock)
    await testEdgeFunction(undefined, {
      apikey: 'sb_publishable_test_key',
      Authorization: 'Bearer user-token',
    })

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
    await testEdgeFunction(undefined, { 'content-type': 'text/plain' })

    expect(fetchMock.mock.calls[0][1].headers).toEqual({ 'content-type': 'text/plain' })
  })

  it('drops empty header values', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null))
    vi.stubGlobal('fetch', fetchMock)
    await testEdgeFunction(undefined, { apikey: '', 'x-kept': 'value' })

    expect(fetchMock.mock.calls[0][1].headers).toEqual({
      'Content-Type': 'application/json',
      'x-kept': 'value',
    })
  })

  it('returns fetch failures as proxy errors', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Connection refused')))
    const response = await testEdgeFunction()

    expect(response.status).toBe(500)
    expect(await response.json()).toEqual({
      status: 500,
      error: { message: 'Connection refused' },
    })
  })
})
