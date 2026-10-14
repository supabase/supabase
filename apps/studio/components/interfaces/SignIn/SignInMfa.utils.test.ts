import { describe, expect, test } from 'vitest'

import {
  getFactorDisplayName,
  getFactorFriendlyName,
  MFA_SUPPORT_EMAIL_HREF,
} from './SignInMfa.utils'

describe('getFactorFriendlyName', () => {
  test('returns the trimmed friendly name', () => {
    expect(getFactorFriendlyName({ friendly_name: '  iPhone Passwords  ' })).toBe(
      'iPhone Passwords'
    )
  })

  test.each([
    ['null factor', null],
    ['undefined factor', undefined],
    ['missing name', { friendly_name: undefined }],
    ['empty name', { friendly_name: '' }],
    ['whitespace-only name', { friendly_name: '   ' }],
  ])('returns undefined for %s', (_label, factor) => {
    expect(getFactorFriendlyName(factor)).toBeUndefined()
  })
})

describe('getFactorDisplayName', () => {
  test('returns the friendly name when present', () => {
    expect(getFactorDisplayName({ friendly_name: 'Work phone' })).toBe('Work phone')
  })

  test('falls back to a generic label when the name is blank', () => {
    expect(getFactorDisplayName({ friendly_name: ' ' })).toBe('your authenticator app')
  })
})

describe('MFA_SUPPORT_EMAIL_HREF', () => {
  test('targets support with an encoded subject', () => {
    const url = new URL(MFA_SUPPORT_EMAIL_HREF)

    expect(url.protocol).toBe('mailto:')
    expect(url.pathname).toBe('support@supabase.com')
    expect(url.searchParams.get('subject')).toBe('Unable to sign in via MFA')
  })
})
