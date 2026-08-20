import { describe, expect, it } from 'vitest'

import { DEFAULT_FALLBACK_PATH, getSignUpReturnTo } from '@/lib/gotrue'

describe('getSignUpReturnTo', () => {
  it('returns /new when returnTo is missing', () => {
    expect(getSignUpReturnTo(undefined)).toBe('/new')
  })

  it(`returns /new when returnTo is ${DEFAULT_FALLBACK_PATH}`, () => {
    expect(getSignUpReturnTo(DEFAULT_FALLBACK_PATH)).toBe('/new')
  })

  it('preserves explicit returnTo paths', () => {
    expect(getSignUpReturnTo('/join?token=abc&slug=acme')).toBe('/join?token=abc&slug=acme')
  })

  it('uses the first value when returnTo is an array', () => {
    expect(getSignUpReturnTo(['/organizations', '/ignored'])).toBe('/new')
  })
})
