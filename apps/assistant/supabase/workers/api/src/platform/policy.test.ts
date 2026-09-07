import { afterEach, describe, expect, it, vi } from 'vitest'

import { getProjectPolicy } from './policy'

const context = { projectRef: 'project', orgSlug: 'org' }
const project = { ref: 'project', organization_slug: 'org' }
const entitlements = {
  entitlements: [{ feature: { key: 'assistant.advance_model' }, hasAccess: true }],
}

function mockManagementApi(projectResponse: unknown = project, entitlementResponse = entitlements) {
  const fetch = vi
    .fn()
    .mockResolvedValueOnce(Response.json(projectResponse))
    .mockResolvedValueOnce(Response.json(entitlementResponse))
  vi.stubGlobal('fetch', fetch)
  return fetch
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

describe('OAuth project policy', () => {
  it('verifies project access and model entitlement directly with the OAuth connection', async () => {
    vi.stubEnv('MANAGEMENT_API_URL', 'https://api.example')
    const fetch = mockManagementApi()

    await expect(getProjectPolicy('oauth-token', context)).resolves.toEqual({
      ...context,
      hasAccessToAdvanceModel: true,
    })
    expect(fetch.mock.calls.map(([url]) => url)).toEqual([
      'https://api.example/v1/projects/project',
      'https://api.example/v1/organizations/org/entitlements',
    ])
    for (const [, init] of fetch.mock.calls) {
      expect(init).toMatchObject({
        redirect: 'error',
        headers: { Authorization: 'Bearer oauth-token' },
      })
    }
  })

  it.each([
    { ref: 'different', organization_slug: 'org' },
    { ref: 'project', organization_slug: 'different' },
    { ref: 'project' },
    null,
  ])('rejects unverified project ownership: %j', async (response) => {
    const fetch = mockManagementApi(response)
    await expect(getProjectPolicy('oauth-token', context)).rejects.toMatchObject({
      status: 403,
      code: 'unauthorized',
    })
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('requires an OAuth connection before making requests', async () => {
    const fetch = mockManagementApi()
    await expect(getProjectPolicy('', context)).rejects.toMatchObject({
      status: 409,
      code: 'oauth_required',
      extra: { org_slug: 'org' },
    })
    expect(fetch).not.toHaveBeenCalled()
  })

  it.each([
    { status: 401, expectedStatus: 409, code: 'oauth_required' },
    { status: 403, expectedStatus: 403, code: 'unauthorized' },
    { status: 404, expectedStatus: 403, code: 'unauthorized' },
    { status: 429, expectedStatus: 502, code: 'internal' },
    { status: 500, expectedStatus: 502, code: 'internal' },
  ])('fails closed on Management API status $status', async ({ status, expectedStatus, code }) => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('private upstream error', { status }))
    )
    await expect(getProjectPolicy('oauth-token', context)).rejects.toMatchObject({
      status: expectedStatus,
      code,
    })
    await expect(getProjectPolicy('oauth-token', context)).rejects.not.toThrow('private upstream')
  })

  it('rejects a connection revoked between project and entitlement verification', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(Response.json(project))
        .mockResolvedValueOnce(new Response('', { status: 401 }))
    )
    await expect(getProjectPolicy('oauth-token', context)).rejects.toMatchObject({
      status: 409,
      code: 'oauth_required',
      extra: { org_slug: 'org' },
    })
  })

  it.each([
    { entries: [] },
    { entries: [{ feature: { key: 'assistant.advance_model' }, hasAccess: false }] },
    { entries: [{ feature: { key: 'other_feature' }, hasAccess: true }] },
  ])('does not grant the advanced model without its entitlement: $entries', async ({ entries }) => {
    mockManagementApi(project, { entitlements: entries })
    await expect(getProjectPolicy('oauth-token', context)).resolves.toMatchObject({
      hasAccessToAdvanceModel: false,
    })
  })

  it('rejects malformed entitlements', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(Response.json(project))
        .mockResolvedValueOnce(Response.json({ entitlements: [{ hasAccess: 'true' }] }))
    )
    await expect(getProjectPolicy('oauth-token', context)).rejects.toMatchObject({
      status: 502,
      code: 'internal',
    })
  })

  it('encodes project and organization identifiers as individual path segments', async () => {
    const fetch = mockManagementApi({ ref: 'project/other', organization_slug: 'org/other' })
    await getProjectPolicy('oauth-token', { projectRef: 'project/other', orgSlug: 'org/other' })
    expect(fetch.mock.calls[0][0]).toContain('/v1/projects/project%2Fother')
    expect(fetch.mock.calls[1][0]).toContain('/v1/organizations/org%2Fother/entitlements')
  })

  it('propagates request cancellation to the platform requests', async () => {
    const abort = new AbortController()
    const fetch = mockManagementApi()
    await getProjectPolicy('oauth-token', context, abort.signal)
    abort.abort()
    for (const [, init] of fetch.mock.calls) expect(init.signal.aborted).toBe(true)
  })
})
