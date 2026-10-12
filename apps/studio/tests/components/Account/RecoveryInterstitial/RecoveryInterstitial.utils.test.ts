import { describe, expect, it } from 'vitest'

import {
  evaluateRecoveryGap,
  getMockRecoveryGap,
  getRecoveryReturnTo,
} from '@/components/interfaces/Account/RecoveryInterstitial/RecoveryInterstitial.utils'

const eligible = {
  isEnabled: true,
  isReady: true,
  isManaged: false,
  verifiedFactorCount: 1,
  remainingCodes: null,
}

describe('account recovery eligibility', () => {
  it('prioritizes missing and exhausted recovery codes', () => {
    expect(evaluateRecoveryGap(eligible)).toBe('missing')
    expect(evaluateRecoveryGap({ ...eligible, remainingCodes: 0 })).toBe('exhausted')
  })
  it.each([1, 2, 10])('does not interrupt with %i usable codes', (remainingCodes) => {
    expect(evaluateRecoveryGap({ ...eligible, remainingCodes })).toBeNull()
  })
  it.each([
    { isEnabled: false },
    { isReady: false },
    { isManaged: true },
    { verifiedFactorCount: 0 },
    { verifiedFactorCount: 2 },
  ])('suppresses ineligible state %j', (state) => {
    expect(evaluateRecoveryGap({ ...eligible, ...state })).toBeNull()
  })
})

describe('return destination', () => {
  it('preserves internal routes, query strings and fragments', () => {
    expect(getRecoveryReturnTo('/project/abc?tab=1#tables')).toBe('/project/abc?tab=1#tables')
  })
  it.each([
    null,
    '',
    'https://evil.test',
    '//evil.test',
    '/\\evil.test',
    '/account-recovery?mockRecoveryInterstitial=missing',
    '/ /evil',
  ])('rejects unsafe or looping destination %s', (value) => {
    expect(getRecoveryReturnTo(value)).toBe('/organizations')
  })
})

describe('development preview', () => {
  it('accepts only known fixtures in development', () => {
    expect(getMockRecoveryGap('missing', true)).toBe('missing')
    expect(getMockRecoveryGap('exhausted', true)).toBe('exhausted')
    expect(getMockRecoveryGap('unknown', true)).toBeNull()
    expect(getMockRecoveryGap('exhausted', false)).toBeNull()
  })
})
