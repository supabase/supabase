import { describe, expect, it } from 'vitest'

import { AUTH_RATE_LIMIT_FIELD_COPY } from '@/components/interfaces/Auth/RateLimits/RateLimits.constants'

describe('Auth rate limit field copy', () => {
  it('describes RATE_LIMIT_OTP as OTP requests, not sign-ups or sign-ins', () => {
    const otpCopy = AUTH_RATE_LIMIT_FIELD_COPY.RATE_LIMIT_OTP

    expect(otpCopy.label).toBe('Rate limit for OTP requests')
    expect(otpCopy.description).toContain('OTP and magic link requests')
    expect(`${otpCopy.label} ${otpCopy.description}`).not.toMatch(/sign-?ups?|sign-?ins?/i)
  })

  it('uses the per-hour unit for RATE_LIMIT_OTP', () => {
    expect(AUTH_RATE_LIMIT_FIELD_COPY.RATE_LIMIT_OTP.unit).toBe('requests/h')
    expect(AUTH_RATE_LIMIT_FIELD_COPY.RATE_LIMIT_OTP.showHourlyEstimate).toBe(false)
  })
})
