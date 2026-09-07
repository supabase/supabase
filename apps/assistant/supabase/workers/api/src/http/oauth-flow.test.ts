import { createHash } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { HandlerContext } from './auth'
import { authRoutes } from './auth-routes'

const mocks = vi.hoisted(() => ({
  query: vi.fn(),
  exchange: vi.fn(),
  store: vi.fn(),
  organizations: vi.fn(),
  identity: vi.fn(),
}))
vi.mock('../db/postgres', () => ({
  adminQuery: mocks.query,
  withAdvisoryLock: (_key: string, work: () => Promise<unknown>) => work(),
}))
vi.mock('../db/oauth-connections', () => ({ storeOAuthTokens: mocks.store }))
vi.mock('../db/rate-limit', () => ({ checkRateLimit: vi.fn() }))
vi.mock('../platform/management-api', () => ({
  createManagementApi: () => ({ listOrganizations: mocks.organizations }),
}))
vi.mock('../platform/identity', () => ({ verifyPlatformIdentity: mocks.identity }))
vi.mock('../platform/oauth', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../platform/oauth')>()),
  exchangeCode: mocks.exchange,
}))
const userId = '11111111-1111-4111-8111-111111111111'
const verifier = 'a'.repeat(43)
const challenge = createHash('sha256').update(verifier).digest('base64url')
const supabase = createClient('https://assistant.example', 'key', {
  auth: { persistSession: false },
})
const context = { supabase, supabaseAdmin: supabase, userClaims: { id: userId } } as HandlerContext
const complete = authRoutes.find((route) => route.pattern === '/oauth/complete')!
const callback = authRoutes.find((route) => route.pattern === '/oauth/callback')!
const exchange = authRoutes.find((route) => route.pattern === '/auth/exchange')!
function request(codeVerifier = verifier) {
  return new Request('https://assistant.example/oauth/complete', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ code: 'code', state: 'state', code_verifier: codeVerifier }),
  })
}
beforeEach(() => {
  vi.resetAllMocks()
  mocks.exchange.mockResolvedValue({
    access_token: 'access',
    refresh_token: 'refresh',
    expires_in: 3600,
  })
  mocks.organizations.mockResolvedValue([{ slug: 'org' }])
  let consumed = false
  mocks.query.mockImplementation(async (sql: string, args: unknown[]) => {
    if (sql.startsWith('select return_to'))
      return [{ return_to: 'http://localhost:8082/project/ref' }]
    expect(sql).toContain('delete from public.oauth_states')
    expect(sql).toContain('state=$1 and user_id=$2 and code_challenge=$3 and expires_at>now()')
    if (consumed || args[0] !== 'state' || args[1] !== userId || args[2] !== challenge) return []
    consumed = true
    return [{ org_slug: 'org' }]
  })
})

describe('Studio session exchange', () => {
  const platformUserId = '22222222-2222-4222-8222-222222222222'
  const email = `${platformUserId}@platform.invalid`

  function exchangeContext() {
    const existing = vi.fn().mockResolvedValue({ data: { user_id: userId } })
    const upsert = vi.fn().mockResolvedValue({})
    const mappedUser = { id: userId, email, app_metadata: { platform_user_id: platformUserId } }
    const generateLink = vi.fn().mockResolvedValue({
      data: { user: mappedUser, properties: { hashed_token: 'one-time-token' } },
    })
    const createUser = vi.fn().mockResolvedValue({ data: { user: mappedUser } })
    const verifyOtp = vi.fn().mockResolvedValue({
      data: {
        session: {
          access_token: 'assistant-access',
          refresh_token: 'assistant-refresh',
          expires_at: 12345,
          user: { id: userId },
        },
      },
    })
    const admin = {
      from: vi.fn(() => ({
        select: () => ({ eq: () => ({ maybeSingle: existing }) }),
        upsert,
      })),
      auth: {
        admin: {
          getUserById: vi.fn().mockResolvedValue({ data: { user: mappedUser } }),
          createUser,
          generateLink,
        },
      },
    }
    return {
      ctx: { supabaseAdmin: admin, supabase: { auth: { verifyOtp } } } as unknown as HandlerContext,
      existing,
      upsert,
      generateLink,
      createUser,
      verifyOtp,
      admin,
    }
  }

  function exchangeRequest() {
    return new Request('https://assistant.example/auth/exchange', {
      method: 'POST',
      headers: { Authorization: 'Bearer studio-session', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        platform_user_id: 'browser-controlled',
        email: 'attacker@example.com',
      }),
    })
  }

  it('reuses the trusted platform identity without a second sign-in or a Studio policy call', async () => {
    mocks.identity.mockResolvedValue({ userId: platformUserId })
    const { ctx, upsert, createUser, generateLink } = exchangeContext()
    const response = await exchange.handler(exchangeRequest(), ctx, {})
    expect(mocks.identity).toHaveBeenCalledWith('studio-session', expect.any(AbortSignal))
    expect(createUser).not.toHaveBeenCalled()
    expect(generateLink).toHaveBeenCalledWith({ type: 'magiclink', email })
    expect(upsert).toHaveBeenCalledWith(
      { user_id: userId, platform_user_id: platformUserId },
      { onConflict: 'platform_user_id' }
    )
    expect(response.headers.get('cache-control')).toBe('no-store')
    expect(await response.json()).toMatchObject({
      access_token: 'assistant-access',
      user_id: userId,
      platform_user_id: platformUserId,
    })
  })

  it('does not create an Assistant identity when platform identity verification fails', async () => {
    mocks.identity.mockRejectedValue(new Error('Invalid platform session'))
    const { ctx, admin } = exchangeContext()
    await expect(exchange.handler(exchangeRequest(), ctx, {})).rejects.toThrow(
      'Invalid platform session'
    )
    expect(admin.from).not.toHaveBeenCalled()
  })

  it('creates an identity using trusted app metadata when there is no existing mapping', async () => {
    mocks.identity.mockResolvedValue({ userId: platformUserId })
    const { ctx, existing, createUser } = exchangeContext()
    existing.mockResolvedValue({ data: null })
    await exchange.handler(exchangeRequest(), ctx, {})
    expect(createUser).toHaveBeenCalledWith({
      email,
      email_confirm: true,
      app_metadata: { platform_user_id: platformUserId },
    })
  })

  it('refuses an existing account whose trusted metadata does not match the platform identity', async () => {
    mocks.identity.mockResolvedValue({ userId: platformUserId })
    const { ctx, generateLink, verifyOtp, upsert } = exchangeContext()
    generateLink.mockResolvedValue({
      data: {
        user: { id: userId, app_metadata: {}, user_metadata: { platform_user_id: platformUserId } },
        properties: { hashed_token: 'one-time-token' },
      },
    })
    await expect(exchange.handler(exchangeRequest(), ctx, {})).rejects.toThrow(
      'Unable to establish assistant identity'
    )
    expect(verifyOtp).not.toHaveBeenCalled()
    expect(upsert).not.toHaveBeenCalled()
  })
})

describe('authenticated OAuth completion protocol', () => {
  it('does not exchange credentials in an unauthenticated callback', async () => {
    const response = await callback.handler(
      new Request('https://assistant.example/oauth/callback?code=code&state=state'),
      context,
      {}
    )
    expect(response.status).toBe(200)
    expect(await response.text()).toContain('assistant-oauth-code')
    expect(mocks.exchange).not.toHaveBeenCalled()
    expect(mocks.store).not.toHaveBeenCalled()
  })
  it('rejects a browser-swapped verifier or account before exchanging or storing tokens', async () => {
    await expect(complete.handler(request('b'.repeat(43)), context, {})).rejects.toMatchObject({
      status: 400,
    })
    await expect(
      complete.handler(
        request(),
        { ...context, userClaims: { ...context.userClaims!, id: 'other' } },
        {}
      )
    ).rejects.toMatchObject({ status: 400 })
    expect(mocks.exchange).not.toHaveBeenCalled()
    expect(mocks.store).not.toHaveBeenCalled()
  })
  it('atomically consumes state once for two simultaneous callbacks and rejects replay', async () => {
    const outcomes = await Promise.allSettled([
      complete.handler(request(), context, {}),
      complete.handler(request(), context, {}),
    ])
    expect(outcomes.filter((outcome) => outcome.status === 'fulfilled')).toHaveLength(1)
    expect(mocks.exchange).toHaveBeenCalledOnce()
    expect(mocks.store).toHaveBeenCalledWith(
      expect.objectContaining({ userId, orgSlug: 'org', accessToken: 'access' })
    )
    await expect(complete.handler(request(), context, {})).rejects.toMatchObject({ status: 400 })
  })
  it.each([
    { organizations: [] },
    { organizations: [{ slug: 'another-org' }] },
    { organizations: [{ name: 'Malformed' }] },
  ])(
    'does not save a token with an unverified organization: $organizations',
    async ({ organizations }) => {
      mocks.organizations.mockResolvedValue(organizations)
      await expect(complete.handler(request(), context, {})).rejects.toThrow()
      expect(mocks.store).not.toHaveBeenCalled()
    }
  )
})
