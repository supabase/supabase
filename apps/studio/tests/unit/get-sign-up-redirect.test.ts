import { describe, expect, it } from 'vitest'

import { DEFAULT_SIGNUP_RETURN_PATH, getSignUpRedirectPath } from '@/lib/gotrue'

describe('getSignUpRedirectPath', () => {
  it(`returns ${DEFAULT_SIGNUP_RETURN_PATH} when returnTo is missing`, () => {
    expect(getSignUpRedirectPath(undefined)).toBe(DEFAULT_SIGNUP_RETURN_PATH)
  })

  it('preserves explicit returnTo paths', () => {
    expect(getSignUpRedirectPath('/join?token=abc&slug=acme')).toBe('/join?token=abc&slug=acme')
  })

  it('uses the first value when returnTo is an array', () => {
    expect(getSignUpRedirectPath(['/join?token=abc', '/ignored'])).toBe('/join?token=abc')
  })
})
