import type { SupabaseEnv } from '@supabase/server'
import { bodyLimit } from 'hono/body-limit'
import { cors } from 'hono/cors'
import { HTTPException } from 'hono/http-exception'
import { exportJWK, generateKeyPair, SignJWT } from 'jose'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { createAgentWorker, type AgentWorkerOptions, type AgentWorkerRoute } from './workers'

type Extension = { workspaceId?: string }
type Options = AgentWorkerOptions<unknown, Extension>

const userId = '11111111-1111-4111-8111-111111111111'
let privateKey: CryptoKey
let env: SupabaseEnv
const network = vi.fn(() => {
  throw new Error('Unexpected network request')
})

beforeAll(async () => {
  const keys = await generateKeyPair('ES256')
  privateKey = keys.privateKey
  env = {
    url: 'https://worker.example',
    publishableKeys: { default: 'sb_publishable_test' },
    secretKeys: { default: 'sb_secret_test' },
    jwks: { keys: [{ ...(await exportJWK(keys.publicKey)), kid: 'test', alg: 'ES256' }] },
  }
})

beforeEach(() => {
  network.mockClear()
  vi.stubGlobal('fetch', network)
})

afterEach(() => vi.unstubAllGlobals())

async function token(
  options: { role?: string; aud?: string; subject?: string; expired?: boolean } = {}
) {
  return new SignJWT({ role: options.role ?? 'authenticated' })
    .setProtectedHeader({ alg: 'ES256', kid: 'test' })
    .setSubject(options.subject ?? userId)
    .setAudience(options.aud ?? 'authenticated')
    .setIssuedAt()
    .setExpirationTime(options.expired ? 1 : '5m')
    .sign(privateKey)
}

function createWorker(options: Partial<Options> = {}) {
  return createAgentWorker<unknown, Extension>({
    env,
    routes: [
      {
        method: 'GET',
        pattern: '/protected/:id',
        auth: 'user',
        handler: (_request, context, params) =>
          Response.json({
            userId: context.userClaims?.id,
            id: params.id,
            workspaceId: context.workspaceId,
          }),
      },
      {
        method: 'GET',
        pattern: '/health',
        auth: 'none',
        handler: (_request, context) =>
          Response.json({ status: 'ok', authMode: context.authMode, user: context.userClaims }),
      },
    ],
    ...options,
  })
}

describe('createAgentWorker', () => {
  it('verifies a user JWT before application authorization and passes route parameters and context', async () => {
    const authorize = vi.fn<NonNullable<Options['authorize']>>((_request, context, route) => {
      expect(context.authMode).toBe('user')
      expect(context.userClaims?.id).toBe(userId)
      expect(route.pattern).toBe('/protected/:id')
      context.workspaceId = 'workspace-1'
    })
    const worker = createWorker({ authorize })

    const response = await worker.request('/protected/conversation-1', {
      headers: { authorization: `Bearer ${await token()}` },
    })

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      userId,
      id: 'conversation-1',
      workspaceId: 'workspace-1',
    })
    expect(authorize).toHaveBeenCalledOnce()
    expect(network).not.toHaveBeenCalled()
  })

  it('rejects missing, malformed, expired, and incorrectly signed JWTs before authorization or handlers', async () => {
    const authorize = vi.fn()
    const handler = vi.fn(() => Response.json({ ok: true }))
    const worker = createWorker({
      authorize,
      routes: [{ method: 'GET', pattern: '/protected', auth: 'user', handler }],
    })
    const otherKeys = await generateKeyPair('ES256')
    const wrongSignature = await new SignJWT({ role: 'authenticated' })
      .setProtectedHeader({ alg: 'ES256', kid: 'test' })
      .setSubject(userId)
      .setAudience('authenticated')
      .setExpirationTime('5m')
      .sign(otherKeys.privateKey)

    for (const jwt of [undefined, 'malformed', await token({ expired: true }), wrongSignature]) {
      const response = await worker.request('/protected', {
        headers: jwt ? { authorization: `Bearer ${jwt}` } : {},
      })
      expect(response.status).toBe(401)
      expect(await response.json()).toMatchObject({
        source: '@supabase/server',
        code: expect.any(String),
      })
    }
    expect(authorize).not.toHaveBeenCalled()
    expect(handler).not.toHaveBeenCalled()
    expect(network).not.toHaveBeenCalled()
  })

  it('requires authenticated audience and role and a nonempty user identity', async () => {
    const authorize = vi.fn()
    const worker = createWorker({ authorize })
    for (const claims of [{ aud: 'another-app' }, { role: 'service_role' }, { subject: '' }]) {
      const response = await worker.request('/protected/id', {
        headers: { authorization: `Bearer ${await token(claims)}` },
      })
      expect(response.status).toBe(401)
    }
    expect(authorize).not.toHaveBeenCalled()
  })

  it('serves only explicitly public routes without credentials or application authorization', async () => {
    const authorize = vi.fn()
    const worker = createWorker({ authorize })
    const response = await worker.request('/health')

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ status: 'ok', authMode: 'none', user: null })
    expect(authorize).not.toHaveBeenCalled()
    expect((await worker.request('/protected/id')).status).toBe(401)
    expect((await worker.request('/unregistered')).status).toBe(404)
  })

  it('rejects routes without an explicit authentication mode', () => {
    const route = { method: 'GET', pattern: '/implicit', handler: () => new Response('ok') }
    expect(() =>
      createWorker({ routes: [route as unknown as AgentWorkerRoute<unknown, Extension>] })
    ).toThrow('requires an explicit auth mode')
  })

  it('preserves application authorization errors through a custom error formatter', async () => {
    class AccessError extends Error {}
    const error = new AccessError('Workspace access required')
    const handler = vi.fn(() => new Response('ok'))
    const onError = vi.fn<NonNullable<Options['onError']>>((failure, request) => {
      expect(request.url).toContain('/protected')
      return failure instanceof AccessError
        ? Response.json({ code: 'workspace_denied', message: failure.message }, { status: 403 })
        : undefined
    })
    const worker = createWorker({
      routes: [{ method: 'GET', pattern: '/protected', auth: 'user', handler }],
      authorize: () => {
        throw error
      },
      onError,
    })

    const response = await worker.request('/protected', {
      headers: { authorization: `Bearer ${await token()}` },
    })
    expect(response.status).toBe(403)
    expect(await response.json()).toEqual({ code: 'workspace_denied', message: error.message })
    expect(onError).toHaveBeenCalledWith(error, expect.any(Request))
    expect(handler).not.toHaveBeenCalled()
  })

  it('returns JSON for unknown paths and unsupported methods', async () => {
    const worker = createWorker()
    const unsupported = await worker.request('/protected/id', { method: 'POST' })
    expect(unsupported.status).toBe(405)
    expect(unsupported.headers.get('allow')).toBe('GET, HEAD')
    expect(await unsupported.json()).toEqual({
      code: 'invalid_request',
      message: 'Method not allowed',
    })

    const missing = await worker.request('/missing')
    expect(missing.status).toBe(404)
    expect(await missing.json()).toEqual({ code: 'not_found', message: 'Not found' })
  })

  it('supports Hono middleware for CORS and body limits', async () => {
    const worker = createWorker({
      middleware: [cors({ origin: 'https://client.example' }), bodyLimit({ maxSize: 4 })],
      routes: [
        { method: 'POST', pattern: '/upload', auth: 'none', handler: () => new Response('ok') },
      ],
    })
    const preflight = await worker.request('/upload', {
      method: 'OPTIONS',
      headers: { origin: 'https://client.example', 'access-control-request-method': 'POST' },
    })
    expect(preflight.status).toBe(204)
    expect(preflight.headers.get('access-control-allow-origin')).toBe('https://client.example')
    const oversized = await worker.request('/upload', {
      method: 'POST',
      headers: { 'content-length': '5' },
      body: '12345',
    })
    expect(oversized.status).toBe(413)
  })

  it('preserves HTTPException responses and hides unhandled error details', async () => {
    const worker = createWorker({
      routes: [
        {
          method: 'GET',
          pattern: '/limited',
          auth: 'none',
          handler: () => {
            throw new HTTPException(429, {
              res: Response.json({ code: 'rate_limited' }, { status: 429 }),
            })
          },
        },
        {
          method: 'GET',
          pattern: '/failure',
          auth: 'none',
          handler: () => {
            throw new Error('Secret implementation detail')
          },
        },
      ],
    })
    const limited = await worker.request('/limited')
    expect(limited.status).toBe(429)
    expect(await limited.json()).toEqual({ code: 'rate_limited' })
    const failure = await worker.request('/failure')
    expect(failure.status).toBe(500)
    expect(await failure.json()).toEqual({
      code: 'internal',
      message: 'Unable to complete the request. Try again.',
    })
  })
})
