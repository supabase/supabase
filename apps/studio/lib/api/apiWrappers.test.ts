import * as Sentry from '@sentry/react'
import type { JwtPayload } from '@supabase/supabase-js'
import type { NextApiRequest, NextApiResponse } from 'next'
import { describe, expect, it, vi } from 'vitest'

import { apiAuthenticate, authenticateRequest } from './apiAuthenticate'
import { InvalidJsonError } from './apiHelpers'
import { apiWrapper, createApiHandlers } from './apiWrapper'
import { classifyResponseError } from '@/data/error-classification'
import { callRoute } from '@/tests/lib/server-route'

vi.mock('@/lib/constants', () => ({
  IS_PLATFORM: true,
  API_URL: 'https://api.example.com',
}))

vi.mock('./apiAuthenticate', () => ({
  apiAuthenticate: vi.fn(),
  authenticateRequest: vi.fn(),
}))

vi.mock('@sentry/react', () => ({
  captureException: vi.fn(),
}))

describe('apiWrapper', () => {
  const mockReq = {} as NextApiRequest
  const mockRes = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as NextApiResponse
  const mockHandler = vi.fn()

  it('should call handler directly when withAuth is false', async () => {
    await apiWrapper(mockReq, mockRes, mockHandler, { withAuth: false })
    expect(mockHandler).toHaveBeenCalledWith(mockReq, mockRes, undefined)
    expect(apiAuthenticate).not.toHaveBeenCalled()
  })

  it('should pass JWT claims to handler when withAuth is true', async () => {
    const mockClaims: JwtPayload = {
      iss: 'supabase',
      sub: 'user-123',
      aud: 'authenticated',
      exp: 9999999999,
      iat: 1000000000,
      role: 'authenticated',
      aal: 'aal1',
      session_id: 'session-123',
    }
    vi.mocked(apiAuthenticate).mockResolvedValue(mockClaims)

    await apiWrapper(mockReq, mockRes, mockHandler, { withAuth: true })
    expect(apiAuthenticate).toHaveBeenCalledWith(mockReq, mockRes)
    expect(mockHandler).toHaveBeenCalledWith(mockReq, mockRes, mockClaims)
  })

  it('should return 401 when authentication fails', async () => {
    const mockError = { error: classifyResponseError({ message: 'Invalid token' }) }
    vi.mocked(apiAuthenticate).mockResolvedValue(mockError)

    await apiWrapper(mockReq, mockRes, mockHandler, { withAuth: true })
    expect(mockRes.status).toHaveBeenCalledWith(401)
    expect(mockHandler).not.toHaveBeenCalled()
  })

  it('should report to Sentry and return 500 when the handler throws', async () => {
    const mockError = new Error('boom')
    mockHandler.mockRejectedValue(mockError)

    await apiWrapper(mockReq, mockRes, mockHandler, { withAuth: false })
    expect(Sentry.captureException).toHaveBeenCalledWith(mockError)
    expect(mockRes.status).toHaveBeenCalledWith(500)
    expect(mockRes.json).toHaveBeenCalledWith({ error: mockError })
  })
})

describe('createApiHandlers', () => {
  const mockClaims: JwtPayload = {
    iss: 'supabase',
    sub: 'user-123',
    aud: 'authenticated',
    exp: 9999999999,
    iat: 1000000000,
    role: 'authenticated',
    aal: 'aal1',
    session_id: 'session-123',
  }

  it('calls the handler directly without auth when withAuth is omitted', async () => {
    vi.mocked(authenticateRequest).mockClear()
    const handler = vi.fn(({ params }) => Response.json({ id: params.id }))
    const handlers = createApiHandlers({ GET: handler })
    const request = new Request('http://localhost/api/test')

    const response = await handlers.GET({ request, params: { id: 'abc' } })

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ id: 'abc' })
    expect(handler).toHaveBeenCalledWith({ request, params: { id: 'abc' }, claims: undefined })
    expect(authenticateRequest).not.toHaveBeenCalled()
  })

  it('passes JWT claims to the handler when withAuth is true', async () => {
    vi.mocked(authenticateRequest).mockResolvedValue(mockClaims)
    const handler = vi.fn(({ claims }) => Response.json({ sub: claims?.sub }))
    const handlers = createApiHandlers({ POST: handler }, { withAuth: true })
    const request = new Request('http://localhost/api/test', { method: 'POST' })

    const response = await handlers.POST({ request })

    expect(authenticateRequest).toHaveBeenCalledWith(request)
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ sub: 'user-123' })
  })

  it('returns 401 when authentication fails', async () => {
    vi.mocked(authenticateRequest).mockResolvedValue({
      error: classifyResponseError({ message: 'Invalid token' }),
    })
    const handler = vi.fn()
    const handlers = createApiHandlers({ POST: handler }, { withAuth: true })

    const response = await handlers.POST({
      request: new Request('http://localhost/api/test', { method: 'POST' }),
    })

    expect(response.status).toBe(401)
    expect(await response.json()).toEqual({ error: { message: 'Unauthorized: Invalid token' } })
    expect(handler).not.toHaveBeenCalled()
  })

  it('returns 400 without reporting to Sentry when InvalidJsonError is thrown', async () => {
    vi.mocked(Sentry.captureException).mockClear()
    const handlers = createApiHandlers({
      POST: () => {
        throw new InvalidJsonError()
      },
    })

    const response = await handlers.POST({
      request: new Request('http://localhost/api/test', { method: 'POST' }),
    })

    expect(response.status).toBe(400)
    expect(await response.text()).toBe('Invalid JSON')
    expect(Sentry.captureException).not.toHaveBeenCalled()
  })

  it('reports to Sentry and returns generic 500 when the handler throws', async () => {
    vi.mocked(Sentry.captureException).mockClear()
    const error = new SyntaxError('Handler bug')
    const handlers = createApiHandlers({
      GET: () => {
        throw error
      },
    })

    const response = await handlers.GET({
      request: new Request('http://localhost/api/test'),
    })

    expect(Sentry.captureException).toHaveBeenCalledWith(error)
    expect(response.status).toBe(500)
    expect(await response.json()).toEqual({ error: { message: 'Internal Server Error' } })
  })

  it('returns 405 with an Allow header matching registered methods via ANY', async () => {
    const handlers = createApiHandlers({
      PATCH: () => Response.json({ ok: true }),
      DELETE: () => new Response(null, { status: 204 }),
    })

    const response = await handlers.ANY({
      request: new Request('http://localhost/api/test', { method: 'GET' }),
    })

    expect(response.status).toBe(405)
    expect(response.headers.get('Allow')).toBe('PATCH, DELETE')
    expect(await response.json()).toEqual({
      data: null,
      error: { message: 'Method GET Not Allowed' },
    })
  })

  it('returns 405 for a HEAD request dispatched to a GET-only handler', async () => {
    const handler = vi.fn(() => Response.json({ ok: true }))
    const route = { options: { server: { handlers: createApiHandlers({ GET: handler }) } } }

    const response = await callRoute(
      route,
      new Request('http://localhost/api/test', { method: 'HEAD' })
    )

    expect(response.status).toBe(405)
    expect(response.headers.get('Allow')).toBe('GET')
    expect(handler).not.toHaveBeenCalled()
  })

  it('calls an explicitly registered HEAD handler', async () => {
    const handlers = createApiHandlers({
      GET: () => Response.json({ ok: true }),
      HEAD: () => new Response(null),
    })
    const route = { options: { server: { handlers } } }

    const response = await callRoute(
      route,
      new Request('http://localhost/api/test', { method: 'HEAD' })
    )

    expect(response.status).toBe(200)
  })
})
