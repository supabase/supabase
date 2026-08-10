import { describe, expect, it } from 'vitest'

import { isHostedSupportedApiPath } from './hosted-api-allowlist'

describe('hosted API allowlist', () => {
  it('allows the GitHub config endpoint in hosted mode', () => {
    expect(isHostedSupportedApiPath('/api/github-config')).toBe(true)
  })

  it('continues to reject unsupported API endpoints', () => {
    expect(isHostedSupportedApiPath('/api/unsupported')).toBe(false)
  })
})
