import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getValidAccessToken } from '../db/oauth-connections'
import { getProjectPolicy } from '../platform/policy'
import { HttpError } from './errors'
import { requireProjectAccess } from './project-access'

vi.mock('../db/oauth-connections', () => ({ getValidAccessToken: vi.fn() }))
vi.mock('../platform/policy', () => ({ getProjectPolicy: vi.fn() }))

beforeEach(() => {
  vi.resetAllMocks()
})

describe('Assistant project access', () => {
  it('requests OAuth consent before checking project policy when no connection exists', async () => {
    vi.mocked(getValidAccessToken).mockResolvedValue(null)
    await expect(requireProjectAccess('user', 'project', 'org')).rejects.toMatchObject({
      status: 409,
      code: 'oauth_required',
      extra: { org_slug: 'org' },
    })
    expect(getValidAccessToken).toHaveBeenCalledExactlyOnceWith('user', 'org')
    expect(getProjectPolicy).not.toHaveBeenCalled()
  })

  it('uses the authenticated user connection and verified project policy for every surface', async () => {
    const signal = new AbortController().signal
    const policy = { projectRef: 'project', orgSlug: 'org', hasAccessToAdvanceModel: false }
    vi.mocked(getValidAccessToken).mockResolvedValue('oauth-token')
    vi.mocked(getProjectPolicy).mockResolvedValue(policy)
    await expect(requireProjectAccess('user', 'project', 'org', signal)).resolves.toEqual({
      ...policy,
      oauthToken: 'oauth-token',
    })
    expect(getProjectPolicy).toHaveBeenCalledExactlyOnceWith(
      'oauth-token',
      { projectRef: 'project', orgSlug: 'org' },
      signal
    )
  })

  it('preserves reconnect and access-denied errors instead of bypassing OAuth', async () => {
    vi.mocked(getValidAccessToken).mockRejectedValueOnce(
      new HttpError(409, 'oauth_expired', 'Reconnect', { org_slug: 'org' })
    )
    await expect(requireProjectAccess('user', 'project', 'org')).rejects.toMatchObject({
      code: 'oauth_expired',
    })
    expect(getProjectPolicy).not.toHaveBeenCalled()
    vi.mocked(getValidAccessToken).mockResolvedValue('oauth-token')
    vi.mocked(getProjectPolicy).mockRejectedValue(new HttpError(403, 'unauthorized', 'Denied'))
    await expect(requireProjectAccess('user', 'project', 'org')).rejects.toMatchObject({
      status: 403,
    })
  })
})
