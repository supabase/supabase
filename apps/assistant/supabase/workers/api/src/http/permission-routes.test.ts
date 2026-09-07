import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ASSISTANT_CONSENT_VERSION } from '../permissions'
import type { HandlerContext } from './auth'
import { HttpError } from './errors'
import { permissionRoutes } from './permission-routes'

const mocks = vi.hoisted(() => ({ get: vi.fn(), set: vi.fn(), policy: vi.fn() }))
vi.mock('../db/project-permissions', () => ({
  getProjectPermissions: mocks.get,
  setProjectPermissions: mocks.set,
}))
vi.mock('./project-access', () => ({ requireProjectAccess: mocks.policy }))
const context = { userClaims: { id: 'user' } } as HandlerContext
const read = permissionRoutes.find((route) => route.method === 'GET')!
const write = permissionRoutes.find((route) => route.method === 'POST')!
const state = {
  level: 'schema',
  hasConsented: true,
  consentVersion: ASSISTANT_CONSENT_VERSION,
}
beforeEach(() => {
  vi.resetAllMocks()
  mocks.policy.mockResolvedValue({ oauthToken: 'oauth' })
  mocks.get.mockResolvedValue(state)
})
function request(selection: string, consentVersion = ASSISTANT_CONSENT_VERSION) {
  return new Request('https://assistant.example/v1/projects/project/permissions', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ org_slug: 'org', selection, consentVersion }),
  })
}
describe('Assistant-owned permissions API', () => {
  it('provides the host with choices, capabilities, and a consent version', async () => {
    const response = await read.handler(
      new Request('https://assistant.example/v1/projects/project/permissions?org_slug=org'),
      context,
      { ref: 'project' }
    )
    expect(await response.json()).toMatchObject({
      selection: 'schema',
      consentVersion: ASSISTANT_CONSENT_VERSION,
      capabilities: { includeContext: true },
      options: expect.arrayContaining([
        expect.objectContaining({ value: 'schema', label: 'Schema', disabled: false }),
      ]),
    })
    expect(mocks.get).toHaveBeenCalledWith('user', 'project', 'org')
  })
  it('keeps validation and enforcement in the service', async () => {
    await expect(
      write.handler(request('invented'), context, { ref: 'project' })
    ).rejects.toMatchObject({ status: 400 })
    await expect(
      write.handler(request('schema', ASSISTANT_CONSENT_VERSION + 1), context, { ref: 'project' })
    ).rejects.toMatchObject({ status: 400 })
    mocks.policy.mockRejectedValue(new HttpError(403, 'unauthorized', 'Project access denied.'))
    await expect(
      write.handler(request('schema'), context, { ref: 'project' })
    ).rejects.toMatchObject({ status: 403 })
    expect(mocks.set).not.toHaveBeenCalled()
  })
  it('writes a selection only for the authenticated user and verified project', async () => {
    expect((await write.handler(request('schema'), context, { ref: 'project' })).status).toBe(200)
    expect(mocks.set).toHaveBeenCalledWith('user', 'project', 'org', 'schema')
  })
  it('requires an OAuth connection before reading or saving permissions', async () => {
    mocks.policy.mockRejectedValue(
      new HttpError(409, 'oauth_required', 'Connect this organization to continue.', {
        org_slug: 'org',
      })
    )
    await expect(
      read.handler(
        new Request('https://assistant.example/v1/projects/project/permissions?org_slug=org'),
        context,
        { ref: 'project' }
      )
    ).rejects.toMatchObject({ status: 409, code: 'oauth_required' })
    await expect(
      write.handler(request('schema'), context, { ref: 'project' })
    ).rejects.toMatchObject({
      status: 409,
      code: 'oauth_required',
    })
    expect(mocks.get).not.toHaveBeenCalled()
    expect(mocks.set).not.toHaveBeenCalled()
  })
  it('offers permission choices but disables project context until the user consents', async () => {
    mocks.get.mockResolvedValue({
      ...state,
      level: 'disabled',
      hasConsented: false,
    })
    const response = await read.handler(
      new Request('https://assistant.example/v1/projects/project/permissions?org_slug=org'),
      context,
      { ref: 'project' }
    )
    expect(await response.json()).toMatchObject({
      capabilities: { includeContext: false },
      options: expect.arrayContaining([
        expect.objectContaining({ value: 'schema', disabled: false }),
      ]),
    })
  })
})
