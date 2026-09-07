import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { HandlerContext } from './auth'
import { routes } from './routes'

const mocks = vi.hoisted(() => ({ create: vi.fn(), token: vi.fn(), rateLimit: vi.fn() }))
vi.mock('../db/conversations', async (original) => ({
  ...(await original<typeof import('../db/conversations')>()),
  createConversation: mocks.create,
}))
vi.mock('../db/oauth-connections', async (original) => ({
  ...(await original<typeof import('../db/oauth-connections')>()),
  getValidAccessToken: mocks.token,
}))
vi.mock('../db/rate-limit', () => ({ checkRateLimit: mocks.rateLimit }))

const userId = '11111111-1111-4111-8111-111111111111'
const context = { userClaims: { id: userId } } as HandlerContext
const create = routes.find(
  (route) => route.method === 'POST' && route.pattern === '/v1/projects/:ref/conversations'
)!

function request(body: Record<string, unknown> = {}) {
  return new Request('https://assistant.example/v1/projects/project/conversations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ org_slug: 'org', name: 'Project help', ...body }),
  })
}

function mockPlatform(project = { ref: 'project', organization_slug: 'org' }) {
  const network = vi
    .fn()
    .mockResolvedValueOnce(Response.json(project))
    .mockResolvedValueOnce(Response.json({ entitlements: [] }))
  vi.stubGlobal('fetch', network)
  return network
}

beforeEach(() => {
  vi.resetAllMocks()
  vi.stubEnv('MANAGEMENT_API_URL', 'https://platform.example')
  mocks.token.mockResolvedValue('oauth-token')
  mocks.create.mockResolvedValue({ id: 'new-conversation', user_id: userId })
})
afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

describe('conversation creation project boundary', () => {
  it('requires OAuth before reading platform data or creating a conversation', async () => {
    const network = mockPlatform()
    mocks.token.mockResolvedValue(null)
    await expect(create.handler(request(), context, { ref: 'project' })).rejects.toMatchObject({
      status: 409,
      code: 'oauth_required',
      extra: { org_slug: 'org' },
    })
    expect(mocks.token).toHaveBeenCalledExactlyOnceWith(userId, 'org')
    expect(network).not.toHaveBeenCalled()
    expect(mocks.create).not.toHaveBeenCalled()
  })

  it.each([
    { ref: 'other-project', organization_slug: 'org' },
    { ref: 'project', organization_slug: 'other-org' },
  ])('rejects unverified project ownership before creating: %j', async (project) => {
    const network = mockPlatform(project)
    await expect(create.handler(request(), context, { ref: 'project' })).rejects.toMatchObject({
      status: 403,
      code: 'unauthorized',
    })
    expect(network).toHaveBeenCalledTimes(1)
    expect(mocks.create).not.toHaveBeenCalled()
  })

  it('binds the new conversation to the Assistant user and verified project', async () => {
    const network = mockPlatform()
    const response = await create.handler(
      request({ user_id: 'forged', project_ref: 'forged', oauthToken: 'forged' }),
      context,
      { ref: 'project' }
    )
    expect(response.status).toBe(201)
    expect(mocks.token).toHaveBeenCalledExactlyOnceWith(userId, 'org')
    expect(network.mock.calls.map(([url]) => url)).toEqual([
      'https://platform.example/v1/projects/project',
      'https://platform.example/v1/organizations/org/entitlements',
    ])
    for (const [, init] of network.mock.calls) {
      expect(init.headers.Authorization).toBe('Bearer oauth-token')
    }
    expect(mocks.create).toHaveBeenCalledExactlyOnceWith(
      userId,
      expect.objectContaining({ projectRef: 'project', orgSlug: 'org', name: 'Project help' })
    )
  })

  it('returns OAuth revocation before creating a conversation', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(null, { status: 401 }))
    )
    await expect(create.handler(request(), context, { ref: 'project' })).rejects.toMatchObject({
      status: 409,
      code: 'oauth_required',
      extra: { org_slug: 'org' },
    })
    expect(mocks.create).not.toHaveBeenCalled()
  })
})
