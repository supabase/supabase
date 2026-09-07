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
