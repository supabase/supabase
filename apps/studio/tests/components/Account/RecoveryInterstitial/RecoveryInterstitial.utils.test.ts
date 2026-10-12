import { describe, expect, it } from 'vitest'

import {
  getMockRecoveryGap,
  getRecoveryGap,
  getRecoveryReturnTo,
} from '@/components/interfaces/Account/RecoveryInterstitial/RecoveryInterstitial.utils'

describe('account recovery reminder selection', () => {
  it('selects missing and exhausted recovery codes', () => {
    expect(
      getRecoveryGap([
        { id: 'recovery-codes-missing', severity: 'warning', action: 'generate-codes' },
      ])
    ).toBe('missing')
    expect(
      getRecoveryGap([
        { id: 'recovery-codes-exhausted', severity: 'critical', action: 'regenerate-codes' },
      ])
    ).toBe('exhausted')
  })
  it('prioritizes exhausted codes if both findings are present', () => {
    expect(
      getRecoveryGap([
        { id: 'recovery-codes-missing', severity: 'warning', action: 'generate-codes' },
        { id: 'recovery-codes-exhausted', severity: 'critical', action: 'regenerate-codes' },
      ])
    ).toBe('exhausted')
  })
  it('does not interrupt for other recovery findings', () => {
    expect(getRecoveryGap([])).toBeNull()
    expect(
      getRecoveryGap([
        {
          id: 'recovery-codes-low',
          severity: 'warning',
          action: 'regenerate-codes',
          remainingCodes: 2,
        },
        { id: 'single-mfa-factor', severity: 'info', action: 'add-factor' },
        { id: 'single-oauth-identity', severity: 'warning', action: 'set-password' },
      ])
    ).toBeNull()
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
