import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const authRateLimitsPartial = readFileSync(
  join(process.cwd(), 'content/_partials/auth_rate_limits.mdx'),
  'utf8'
)

describe('auth rate limits docs partial', () => {
  it('documents the configurable sign-up and sign-in IP rate limit', () => {
    expect(authRateLimitsPartial).toContain('Sign-ups and sign-ins')
    expect(authRateLimitsPartial).toContain('`/auth/v1/signup` `/auth/v1/token`')
    expect(authRateLimitsPartial).toContain('Defaults to 30 requests per 5 minutes')
    expect(authRateLimitsPartial).toContain('non-configurable burst limit of 30 requests')
    expect(authRateLimitsPartial).toContain(
      'configured in the Dashboard or in `config.toml` as `auth.rate_limit.sign_in_sign_ups`'
    )
  })
})
