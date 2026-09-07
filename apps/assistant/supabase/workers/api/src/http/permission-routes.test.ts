import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ASSISTANT_CONSENT_VERSION } from '../permissions'
import type { HandlerContext } from './auth'
import { permissionRoutes } from './permission-routes'

const mocks = vi.hoisted(() => ({ get: vi.fn(), set: vi.fn(), policy: vi.fn() }))
vi.mock('../db/project-permissions', () => ({
  getProjectPermissions: mocks.get,
  setProjectPermissions: mocks.set,
}))
vi.mock('../platform/policy', () => ({ getPlatformPolicy: mocks.policy }))
const context = { userClaims: { id: 'user' }, platformToken: 'platform' } as HandlerContext
const read = permissionRoutes.find((route) => route.method === 'GET')!
const write = permissionRoutes.find((route) => route.method === 'POST')!
const state = {
  level: 'schema',
  hasConsented: true,
  canShareProjectData: true,
  consentVersion: ASSISTANT_CONSENT_VERSION,
}
beforeEach(() => {
  vi.resetAllMocks()
  mocks.policy.mockResolvedValue({ canShareProjectData: true })
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
    expect(mocks.get).toHaveBeenCalledWith('user', 'project', 'org', true)
  })
  it('keeps validation and enforcement in the service', async () => {
    await expect(
      write.handler(request('invented'), context, { ref: 'project' })
    ).rejects.toMatchObject({ status: 400 })
    await expect(
      write.handler(request('schema', ASSISTANT_CONSENT_VERSION + 1), context, { ref: 'project' })
    ).rejects.toMatchObject({ status: 400 })
    mocks.policy.mockResolvedValue({ canShareProjectData: false })
    await expect(
      write.handler(request('schema'), context, { ref: 'project' })
    ).rejects.toMatchObject({ status: 403 })
    expect(mocks.set).not.toHaveBeenCalled()
  })
  it('writes a selection only for the authenticated user and verified project', async () => {
    expect((await write.handler(request('schema'), context, { ref: 'project' })).status).toBe(200)
    expect(mocks.set).toHaveBeenCalledWith('user', 'project', 'org', 'schema')
  })
  it('disables project context and choices for an unconsented or restricted project', async () => {
    mocks.get.mockResolvedValue({
      ...state,
      level: 'disabled',
      hasConsented: false,
      canShareProjectData: false,
    })
    const response = await read.handler(
      new Request('https://assistant.example/v1/projects/project/permissions?org_slug=org'),
      context,
      { ref: 'project' }
    )
    expect(await response.json()).toMatchObject({
      capabilities: { includeContext: false },
      notice: expect.any(String),
      options: expect.arrayContaining([
        expect.objectContaining({ value: 'schema', disabled: true }),
      ]),
    })
  })
})
