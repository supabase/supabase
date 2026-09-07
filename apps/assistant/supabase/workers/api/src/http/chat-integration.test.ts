import { MockLanguageModelV4, simulateReadableStream } from 'ai/test'
import { exportJWK, generateKeyPair, SignJWT } from 'jose'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { getProjectToolDefinitions } from '../ai/tools/project-tools'
import type { app as App } from './app'
import { HttpError } from './errors'

const mocks = vi.hoisted(() => ({
  consent: vi.fn(),
  events: vi.fn(),
  begin: vi.fn(),
  finish: vi.fn(),
  oauth: vi.fn(),
  tools: vi.fn(),
  close: vi.fn(),
  query: vi.fn(),
  model: vi.fn(),
  executeOnce: vi.fn(),
  network: vi.fn(),
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
vi.mock('../db/session-store', async (original) => ({
  ...(await original<typeof import('../db/session-store')>()),
  readRunEvents: mocks.events,
}))
vi.mock('../db/project-permissions', () => ({ getProjectPermissions: mocks.consent }))
vi.mock('../db/oauth-connections', () => ({ getValidAccessToken: mocks.oauth }))
vi.mock('../db/rate-limit', () => ({ checkRateLimit: vi.fn() }))
vi.mock('../db/tool-executions', () => ({ executeOnce: mocks.executeOnce }))
vi.mock('../ai/tools', () => ({ getTools: mocks.tools }))
vi.mock('../ai/model', () => ({ getAssistantModel: mocks.model }))
vi.mock('../platform/management-api', () => ({
  createManagementApi: () => ({ runQuery: mocks.query }),
}))

const userId = '11111111-1111-4111-8111-111111111111'
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
  vi.stubEnv('MANAGEMENT_API_URL', 'https://platform.example')
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
  vi.stubGlobal('fetch', mocks.network)
  ;({ app } = await import('./app'))
})
beforeEach(() => {
  vi.resetAllMocks()
  mocks.network.mockImplementation(async (input: string | URL | Request, init?: RequestInit) => {
    const url = input instanceof Request ? input.url : String(input)
    expect(new Headers(init?.headers).get('authorization')).toBe('Bearer oauth')
    if (url === 'https://platform.example/v1/projects/project')
      return Response.json({ ref: 'project', organization_slug: 'org' })
    if (url === 'https://platform.example/v1/organizations/org/entitlements')
      return Response.json({ entitlements: [] })
    throw new Error(`Unexpected request: ${url}`)
  })
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
      'content-type': 'application/json',
    },
    body: JSON.stringify({ messages, revision: 0, requestId }),
  })
}
describe('authenticated worker chat through the AI SDK', () => {
  it('routes an approved tool through application persistence and uses its cached result', async () => {
    const input = {
      sql: 'select 1',
      label: 'Test',
      chartConfig: { view: 'table' },
      isWriteQuery: false,
    }
    mocks.begin.mockResolvedValue({
      revision: 2,
      messages: [
        ...messages,
        {
          id: 'approval',
          role: 'assistant',
          parts: [
            {
              type: 'tool-execute_sql',
              toolCallId: 'stored-call',
              state: 'approval-responded',
              input,
              approval: { id: 'approval-id', approved: true },
            },
          ],
        },
      ],
    })
    mocks.tools.mockImplementation(async (context) => ({
      tools: getProjectToolDefinitions(context),
      close: mocks.close,
    }))
    mocks.executeOnce.mockResolvedValue([{ value: 'cached-private-result' }])
    const response = await request()
    expect(response.status).toBe(200)
    expect(response.headers.get('x-assistant-revision')).toBe('2')
    const body = await response.text()
    expect(body).toContain('cached-private-result')
    expect(mocks.executeOnce).toHaveBeenCalledExactlyOnceWith({
      sessionId: 'conversation',
      userId,
      runId: requestId,
      toolCallId: 'stored-call',
      toolName: 'execute_sql',
      input,
      execute: expect.any(Function),
    })
    expect(mocks.query).not.toHaveBeenCalled()
    expect(JSON.stringify(model.doStreamCalls)).not.toContain('cached-private-result')
    expect(mocks.finish).toHaveBeenCalledOnce()
  })

  it('streams with an Assistant session alone and avoids schema queries with no project data consent', async () => {
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
      }),
      'completed'
    )
    expect(mocks.query).not.toHaveBeenCalled()
    expect(mocks.close).toHaveBeenCalled()
    expect(model.doStreamCalls).toHaveLength(1)
    expect(mocks.network).toHaveBeenCalledTimes(2)
  })
  it('replays events using the verified identity and rejects invalid cursors', async () => {
    mocks.events.mockResolvedValue({ events: [], nextCursor: '10', hasMore: false })
    const read = (query: string) =>
      app.request(`https://assistant.example/v1/conversations/${requestId}/events${query}`, {
        headers: { authorization: `Bearer ${jwt}` },
      })
    const response = await read('?after=10&limit=20&userId=forged')
    expect(response.status).toBe(200)
    expect(response.headers.get('cache-control')).toBe('no-store')
    expect(await response.json()).toEqual({ events: [], nextCursor: '10', hasMore: false })
    expect(mocks.events).toHaveBeenCalledWith(
      userId,
      requestId,
      expect.objectContaining({ after: '10', limit: 20 })
    )
    mocks.events.mockClear()
    expect((await read('?after=-1')).status).toBe(400)
    expect((await read('?limit=501')).status).toBe(400)
    expect(mocks.events).not.toHaveBeenCalled()
    mocks.events.mockRejectedValue(new HttpError(404, 'not_found', 'Session not found.'))
    expect((await read('?after=0')).status).toBe(404)
  })
  it('requires OAuth before project consent, tool discovery, or model calls', async () => {
    mocks.oauth.mockResolvedValue(null)
    const response = await request()
    expect(response.status).toBe(409)
    expect(await response.json()).toMatchObject({ code: 'oauth_required', org_slug: 'org' })
    expect(mocks.network).not.toHaveBeenCalled()
    expect(mocks.consent).not.toHaveBeenCalled()
    expect(mocks.tools).not.toHaveBeenCalled()
    expect(mocks.begin).not.toHaveBeenCalled()
  })
  it('requires project consent after OAuth and before tool discovery or model calls', async () => {
    mocks.consent.mockResolvedValue({ level: 'disabled', hasConsented: false })
    const response = await request()
    expect(response.status).toBe(409)
    expect(await response.json()).toMatchObject({ code: 'consent_required' })
    expect(mocks.oauth).toHaveBeenCalledExactlyOnceWith(userId, 'org')
    expect(mocks.tools).not.toHaveBeenCalled()
    expect(mocks.begin).not.toHaveBeenCalled()
  })
  it('rejects inaccessible projects and revoked connections before reading grants or running tools', async () => {
    mocks.network.mockResolvedValueOnce(new Response(null, { status: 403 }))
    expect((await request()).status).toBe(403)
    expect(mocks.consent).not.toHaveBeenCalled()
    mocks.network.mockResolvedValueOnce(new Response(null, { status: 401 }))
    const response = await request()
    expect(response.status).toBe(409)
    expect(await response.json()).toMatchObject({ code: 'oauth_required', org_slug: 'org' })
    expect(mocks.consent).not.toHaveBeenCalled()
    expect(mocks.tools).not.toHaveBeenCalled()
    expect(mocks.model).not.toHaveBeenCalled()
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
