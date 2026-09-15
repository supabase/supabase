import { describe, expect, it } from 'vitest'

import { isUserVerified } from './Users.utils'

describe('isUserVerified', () => {
  it('is verified when confirmed_at is set', () => {
    expect(
      isUserVerified({ confirmed_at: '2024-01-01T00:00:00Z', last_sign_in_at: undefined })
    ).toBe(true)
  })

  it('is verified when last_sign_in_at is set, even without confirmed_at', () => {
    // e.g. a user who signed in via an OAuth/OIDC provider (like Telegram) configured to
    // allow users without an email or phone - confirmed_at is never set for them, but
    // they've successfully authenticated at least once.
    expect(
      isUserVerified({ confirmed_at: undefined, last_sign_in_at: '2024-01-01T00:00:00Z' })
    ).toBe(true)
  })

  it('is not verified when neither confirmed_at nor last_sign_in_at is set', () => {
    // e.g. a user who was invited but hasn't accepted/signed in yet.
    expect(isUserVerified({ confirmed_at: undefined, last_sign_in_at: undefined })).toBe(false)
  })
})
