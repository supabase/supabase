import { describe, expect, test } from 'vitest'

import { getFactorDisplayName, getFactorFriendlyName } from './SignInMfa.utils'

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
