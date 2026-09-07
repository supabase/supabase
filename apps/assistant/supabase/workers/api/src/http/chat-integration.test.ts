import { MockLanguageModelV4, simulateReadableStream } from 'ai/test'
import { exportJWK, generateKeyPair, SignJWT } from 'jose'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import type { app as App } from './app'
import { HttpError } from './errors'

const mocks = vi.hoisted(() => ({
  consent: vi.fn(),
  begin: vi.fn(),
  finish: vi.fn(),
  oauth: vi.fn(),
  tools: vi.fn(),
  close: vi.fn(),
  query: vi.fn(),
  model: vi.fn(),
}))
vi.mock('../db/conversations', async (original) => ({
  ...(await original<typeof import('../db/conversations')>()),
  getConversation: async () => ({
    id: 'conversation',
    project_ref: 'project',
    org_slug: 'org',
    name: 'Chat',
  }),
  beginTurn: mocks.begin,
  finishTurn: mocks.finish,
}))
vi.mock('../db/project-permissions', () => ({ getProjectPermissions: mocks.consent }))
vi.mock('../db/oauth-connections', () => ({ getValidAccessToken: mocks.oauth }))
vi.mock('../db/rate-limit', () => ({ checkRateLimit: vi.fn() }))
vi.mock('../ai/tools', () => ({ getTools: mocks.tools }))
vi.mock('../ai/model', () => ({ getAssistantModel: mocks.model }))
vi.mock('../platform/management-api', () => ({
  createManagementApi: () => ({ runQuery: mocks.query }),
}))

const userId = '11111111-1111-4111-8111-111111111111'
const platformId = '22222222-2222-4222-8222-222222222222'
const requestId = '33333333-3333-4333-8333-333333333333'
const messages = [{ id: 'user', role: 'user', parts: [{ type: 'text', text: 'Help with SQL' }] }]
let app: typeof App
let jwt: string
let model: MockLanguageModelV4
beforeAll(async () => {
  const keys = await generateKeyPair('ES256')
  vi.stubEnv('ASSISTANT_SUPABASE_URL', 'https://assistant.example')
  vi.stubEnv('ASSISTANT_PUBLISHABLE_KEY', 'sb_publishable_test')
  vi.stubEnv('ASSISTANT_SECRET_KEY', 'sb_secret_test')
  vi.stubEnv('ASSISTANT_POLICY_URL', 'https://studio.example/policy')
  vi.stubEnv(
    'ASSISTANT_JWKS',
    JSON.stringify({ keys: [{ ...(await exportJWK(keys.publicKey)), kid: 'test', alg: 'ES256' }] })
  )
  jwt = await new SignJWT({ role: 'authenticated' })
    .setProtectedHeader({ alg: 'ES256', kid: 'test' })
    .setSubject(userId)
    .setAudience('authenticated')
    .setIssuedAt()
    .setExpirationTime('5m')
    .sign(keys.privateKey)
  vi.stubGlobal('fetch', async (input: string | URL | Request) => {
    const url = input instanceof Request ? input.url : String(input)
    if (url === 'https://studio.example/policy')
      return Response.json({
        userId: platformId,
        projectRef: 'project',
        orgSlug: 'org',
        canShareProjectData: true,
        hasAccessToAdvanceModel: false,
      })
    if (url.includes('/rest/v1/platform_identities'))
      return Response.json({ platform_user_id: platformId })
    throw new Error(`Unexpected request: ${url}`)
  })
  ;({ app } = await import('./app'))
})
beforeEach(() => {
  vi.resetAllMocks()
  mocks.consent.mockResolvedValue({ level: 'disabled', hasConsented: true })
  mocks.oauth.mockResolvedValue('oauth')
  mocks.begin.mockResolvedValue({ revision: 1, messages })
  mocks.tools.mockResolvedValue({ tools: {}, close: mocks.close })
  mocks.query.mockResolvedValue([{ name: 'public' }])
  model = new MockLanguageModelV4({
    doStream: async () => ({
      stream: simulateReadableStream({
        chunks: [
          { type: 'stream-start', warnings: [] },
          { type: 'text-start', id: 't' },
          { type: 'text-delta', id: 't', delta: 'Hello from the worker' },
          { type: 'text-end', id: 't' },
          {
            type: 'finish',
            finishReason: { unified: 'stop', raw: 'stop' },
            usage: {
              inputTokens: { total: 1, noCache: 1, cacheRead: 0, cacheWrite: 0 },
              outputTokens: { total: 1, text: 1, reasoning: 0 },
            },
          },
        ],
      }),
    }),
  })
  mocks.model.mockReturnValue({ model })
})
afterAll(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})
function request() {
  return app.request('https://assistant.example/v1/conversations/conversation/chat', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${jwt}`,
      'x-platform-authorization': 'Bearer platform',
      'content-type': 'application/json',
    },
    body: JSON.stringify({ messages, revision: 0, requestId }),
  })
}
describe('authenticated worker chat through the AI SDK', () => {
  it('streams a response, persists it, and avoids schema queries with no project data consent', async () => {
    const response = await request()
    expect(response.status).toBe(200)
    expect(response.headers.get('x-assistant-revision')).toBe('1')
    const body = await response.text()
    expect(body).toContain('Hello from the worker')
    expect(body).toContain('data: [DONE]')
    expect(mocks.finish).toHaveBeenCalledWith(
      userId,
      'conversation',
      requestId,
      expect.objectContaining({
        role: 'assistant',
        parts: expect.arrayContaining([expect.objectContaining({ text: 'Hello from the worker' })]),
      })
    )
    expect(mocks.query).not.toHaveBeenCalled()
    expect(mocks.close).toHaveBeenCalled()
    expect(model.doStreamCalls).toHaveLength(1)
  })
  it('requires new consent before OAuth, tool discovery, or model calls', async () => {
    mocks.consent.mockResolvedValue({ level: 'disabled', hasConsented: false })
    const response = await request()
    expect(response.status).toBe(409)
    expect(await response.json()).toMatchObject({ code: 'consent_required' })
    expect(mocks.oauth).not.toHaveBeenCalled()
    expect(mocks.tools).not.toHaveBeenCalled()
    expect(mocks.begin).not.toHaveBeenCalled()
  })
  it('fetches schema context only with the new schema grant', async () => {
    mocks.consent.mockResolvedValue({ level: 'schema', hasConsented: true })
    const response = await request()
    await response.text()
    expect(mocks.query).toHaveBeenCalledOnce()
    expect(JSON.stringify(model.doStreamCalls[0])).toContain('public')
  })
  it('returns reconnect errors without starting a model and closes resources on stale revisions', async () => {
    mocks.oauth.mockRejectedValueOnce(new HttpError(409, 'oauth_expired', 'Reconnect'))
    expect(await (await request()).json()).toMatchObject({ code: 'oauth_expired' })
    expect(mocks.model).not.toHaveBeenCalled()
    mocks.begin.mockRejectedValueOnce(new HttpError(409, 'conflict', 'Reload'))
    expect((await request()).status).toBe(409)
    expect(mocks.close).toHaveBeenCalledOnce()
    expect(mocks.model).not.toHaveBeenCalled()
  })
})
