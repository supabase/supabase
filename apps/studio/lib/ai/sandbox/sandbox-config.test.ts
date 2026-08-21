import { describe, expect, it } from 'vitest'

import { isSandboxConfigured } from './sandbox-config'

describe('isSandboxConfigured', () => {
  it('accepts Vercel OIDC', () => {
    expect(isSandboxConfigured({ VERCEL_OIDC_TOKEN: 'token' })).toBe(true)
  })

  it('accepts explicit local credentials only when complete', () => {
    expect(
      isSandboxConfigured({
        VERCEL_TEAM_ID: 'team',
        VERCEL_PROJECT_ID: 'project',
        VERCEL_TOKEN: 'token',
      })
    ).toBe(true)
    expect(isSandboxConfigured({ VERCEL_TEAM_ID: 'team' })).toBe(false)
  })
})
