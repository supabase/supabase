import { afterEach, describe, expect, it, vi } from 'vitest'

import { getPlatformPolicy } from './policy'

const policy = {
  userId: '11111111-1111-4111-8111-111111111111',
  projectRef: 'project',
  orgSlug: 'org',
  canShareProjectData: true,
  hasAccessToAdvanceModel: false,
}
afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})
describe('trusted Studio policy', () => {
  it('uses the configured policy authority and validates project ownership', async () => {
    vi.stubEnv('ASSISTANT_POLICY_URL', 'https://studio.example/api/ai/assistant-policy')
    const fetch = vi.fn(async () => Response.json(policy))
    vi.stubGlobal('fetch', fetch)
    await expect(
      getPlatformPolicy('platform', { projectRef: 'project', orgSlug: 'org' })
    ).resolves.toEqual(policy)
    expect(fetch).toHaveBeenCalledWith(
      'https://studio.example/api/ai/assistant-policy',
      expect.objectContaining({
        redirect: 'error',
        headers: expect.objectContaining({ Authorization: 'Bearer platform' }),
      })
    )
    await expect(
      getPlatformPolicy('platform', { projectRef: 'different', orgSlug: 'org' })
    ).rejects.toThrow()
  })
  it.each([401, 403, 500])('fails closed on policy status %s', async (status) => {
    vi.stubEnv('ASSISTANT_POLICY_URL', 'https://studio.example/api/ai/assistant-policy')
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('', { status }))
    )
    await expect(getPlatformPolicy('platform')).rejects.toThrow()
  })
  it('fails closed on malformed policy and insecure configuration', async () => {
    vi.stubEnv('ASSISTANT_POLICY_URL', 'https://studio.example/api/ai/assistant-policy')
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Response.json({ aiOptInLevel: 'schema_and_log_and_data' }))
    )
    await expect(getPlatformPolicy('platform')).rejects.toThrow()
    vi.stubEnv('ASSISTANT_POLICY_URL', 'http://untrusted.example')
    await expect(getPlatformPolicy('platform')).rejects.toThrow()
  })
})
