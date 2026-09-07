import type { JwtPayload } from '@supabase/supabase-js'
import type { NextApiRequest, NextApiResponse } from 'next'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import assistantPolicy from '@/pages/api/ai/assistant-policy'

const mocks = vi.hoisted(() => ({
  flags: vi.fn(),
  details: vi.fn(),
  getUser: vi.fn(),
  claims: {
    sub: '11111111-1111-4111-8111-111111111111',
    aud: 'authenticated',
    aal: 'aal1',
    email: 'user@example.test',
    iss: 'https://auth.example.test',
    exp: 9999999999,
    iat: 1,
    role: 'authenticated',
    session_id: 'session',
  },
}))
vi.mock('@/lib/constants', () => ({ IS_PLATFORM: true }))
vi.mock('@/lib/gotrue', () => ({ auth: { getUser: mocks.getUser } }))
vi.mock('@/lib/server/configcat', () => ({
  getServerFlags: mocks.flags,
  trustedUserEmail: (email: string) => email,
}))
vi.mock('@/lib/assistant/project-access', () => ({ getAssistantProjectAccess: mocks.details }))
vi.mock('@/lib/api/apiWrapper', () => ({
  apiWrapper: (
    req: NextApiRequest,
    res: NextApiResponse,
    handler: (req: NextApiRequest, res: NextApiResponse, claims: JwtPayload) => unknown
  ) => handler(req, res, mocks.claims),
}))
beforeEach(() => {
  vi.resetAllMocks()
  mocks.claims.aud = 'authenticated'
  mocks.claims.aal = 'aal1'
  mocks.flags.mockResolvedValue([{ settingKey: 'assistantSupabaseBackend', settingValue: true }])
  mocks.getUser.mockResolvedValue({ data: { user: { id: mocks.claims.sub } } })
  mocks.details.mockResolvedValue({
    orgSlug: 'org',
    hasHipaaAddon: false,
    aiOptInLevel: 'schema',
    hasAccessToAdvanceModel: true,
  })
  vi.stubEnv('NEXT_PUBLIC_ENVIRONMENT', 'production')
  vi.stubEnv('NEXT_PUBLIC_ASSISTANT_BACKEND', 'true')
  vi.stubEnv('IS_THROTTLED', 'false')
})
afterEach(() => {
  vi.unstubAllEnvs()
})
async function request(body: unknown = {}) {
  let status = 200,
    payload: unknown
  const res = {
    setHeader: vi.fn(),
    status: vi.fn((value: number) => {
      status = value
      return res
    }),
    json: vi.fn((value: unknown) => {
      payload = value
      return res
    }),
  }
  await assistantPolicy(
    { method: 'POST', headers: { authorization: 'Bearer current' }, body } as NextApiRequest,
    res as unknown as NextApiResponse
  )
  return { status, payload }
}
describe('server admission and policy authority', () => {
  it('rejects non-cohort users even when a hosted environment override is set', async () => {
    mocks.flags.mockResolvedValue([])
    expect((await request()).status).toBe(403)
    expect(mocks.details).not.toHaveBeenCalled()
  })
  it('requires a live platform session, authenticated audience, and enrolled MFA', async () => {
    mocks.getUser.mockResolvedValueOnce({ data: { user: null }, error: new Error('Expired') })
    expect((await request()).status).toBe(401)
    mocks.claims.aud = 'other'
    expect((await request()).status).toBe(403)
    mocks.claims.aud = 'authenticated'
    mocks.getUser.mockResolvedValue({
      data: { user: { id: mocks.claims.sub, factors: [{ status: 'verified' }] } },
    })
    expect((await request()).status).toBe(403)
    mocks.claims.aal = 'aal2'
    expect((await request()).status).toBe(200)
  })
  it.each(['disabled', 'schema', 'schema_and_log', 'schema_and_log_and_data'])(
    'does not inherit legacy organization consent %s',
    async (level) => {
      mocks.details.mockResolvedValue({
        orgSlug: 'org',
        hasHipaaAddon: false,
        aiOptInLevel: level,
        hasAccessToAdvanceModel: true,
      })
      expect(
        (
          await request({
            projectRef: 'project',
            orgSlug: 'org',
            aiOptInLevel: 'schema_and_log_and_data',
          })
        ).payload
      ).toMatchObject({ canShareProjectData: true })
    }
  )
  it('rejects mismatched projects and fails closed on unknown privacy status', async () => {
    mocks.details.mockResolvedValueOnce({ orgSlug: undefined })
    expect((await request({ projectRef: 'project', orgSlug: 'org' })).status).toBe(403)
    mocks.details.mockResolvedValueOnce({
      orgSlug: 'org',
      aiOptInLevel: 'schema_and_log_and_data',
      hasHipaaAddon: undefined,
    })
    expect((await request({ projectRef: 'project', orgSlug: 'org' })).payload).toMatchObject({
      canShareProjectData: false,
    })
  })
  it('requires both the entitlement and the unthrottled rollout for advanced models', async () => {
    vi.stubEnv('IS_THROTTLED', 'true')
    expect((await request({ projectRef: 'project', orgSlug: 'org' })).payload).toMatchObject({
      hasAccessToAdvanceModel: false,
    })
    vi.stubEnv('IS_THROTTLED', 'false')
    mocks.details.mockResolvedValueOnce({
      orgSlug: 'org',
      hasHipaaAddon: false,
      aiOptInLevel: 'schema',
      hasAccessToAdvanceModel: false,
    })
    expect((await request({ projectRef: 'project', orgSlug: 'org' })).payload).toMatchObject({
      hasAccessToAdvanceModel: false,
    })
  })
})
