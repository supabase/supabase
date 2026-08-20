import { describe, expect, test } from 'vitest'

import {
  createRefreshTokenSchema,
  createUserSessionsSchema,
  MAX_REFRESH_TOKEN_REUSE_INTERVAL_MESSAGE,
  MAX_REFRESH_TOKEN_REUSE_INTERVAL_SECONDS,
  MAX_SESSIONS_INACTIVITY_TIMEOUT_MESSAGE,
  MAX_SESSIONS_TIMEBOX_HOURS,
  MAX_SESSIONS_TIMEBOX_MESSAGE,
} from './SessionsAuthSettingsForm.utils'

const OVER_LIMIT_TIMEBOX = 20000

function parseUserSessions(
  values: Record<string, unknown>,
  saved: { savedTimebox: number; savedInactivityTimeout: number } = {
    savedTimebox: 0,
    savedInactivityTimeout: 0,
  }
) {
  return createUserSessionsSchema(saved).safeParse({
    SESSIONS_TIMEBOX: 0,
    SESSIONS_INACTIVITY_TIMEOUT: 0,
    SESSIONS_SINGLE_PER_USER: false,
    ...values,
  })
}

function parseRefreshToken(values: Record<string, unknown>, savedReuseInterval = 0) {
  return createRefreshTokenSchema({ savedReuseInterval }).safeParse({
    REFRESH_TOKEN_ROTATION_ENABLED: true,
    SECURITY_REFRESH_TOKEN_REUSE_INTERVAL: 0,
    ...values,
  })
}

function errorFor(
  result: ReturnType<typeof parseUserSessions> | ReturnType<typeof parseRefreshToken>,
  field: string
) {
  return result.success
    ? undefined
    : result.error.issues.find((issue) => issue.path[0] === field)?.message
}

describe('createUserSessionsSchema — SESSIONS_TIMEBOX', () => {
  test('accepts a value below the maximum', () => {
    expect(parseUserSessions({ SESSIONS_TIMEBOX: 24 }).success).toBe(true)
  })

  test('accepts a value exactly at the maximum', () => {
    expect(parseUserSessions({ SESSIONS_TIMEBOX: MAX_SESSIONS_TIMEBOX_HOURS }).success).toBe(true)
  })

  test('rejects a value above the maximum', () => {
    const result = parseUserSessions({ SESSIONS_TIMEBOX: MAX_SESSIONS_TIMEBOX_HOURS + 1 })

    expect(result.success).toBe(false)
    expect(errorFor(result, 'SESSIONS_TIMEBOX')).toBe(MAX_SESSIONS_TIMEBOX_MESSAGE)
  })

  test('accepts an over-limit value that matches the saved value', () => {
    const result = parseUserSessions(
      { SESSIONS_TIMEBOX: OVER_LIMIT_TIMEBOX },
      { savedTimebox: OVER_LIMIT_TIMEBOX, savedInactivityTimeout: 0 }
    )

    expect(result.success).toBe(true)
  })

  test('rejects a reduction that is still above the maximum', () => {
    const result = parseUserSessions(
      { SESSIONS_TIMEBOX: 15000 },
      { savedTimebox: OVER_LIMIT_TIMEBOX, savedInactivityTimeout: 0 }
    )

    expect(result.success).toBe(false)
    expect(errorFor(result, 'SESSIONS_TIMEBOX')).toBe(MAX_SESSIONS_TIMEBOX_MESSAGE)
  })

  test('accepts a reduction into the allowed range', () => {
    const result = parseUserSessions(
      { SESSIONS_TIMEBOX: 5000 },
      { savedTimebox: OVER_LIMIT_TIMEBOX, savedInactivityTimeout: 0 }
    )

    expect(result.success).toBe(true)
  })

  test('rejects a negative value', () => {
    const result = parseUserSessions({ SESSIONS_TIMEBOX: -1 })

    expect(result.success).toBe(false)
    expect(errorFor(result, 'SESSIONS_TIMEBOX')).toBe('Must be a positive number')
  })
})

describe('createUserSessionsSchema — SESSIONS_INACTIVITY_TIMEOUT', () => {
  test('accepts a fractional value within the maximum', () => {
    expect(parseUserSessions({ SESSIONS_INACTIVITY_TIMEOUT: 1.5 }).success).toBe(true)
  })

  test('rejects a value above the maximum', () => {
    const result = parseUserSessions({ SESSIONS_INACTIVITY_TIMEOUT: 10000 })

    expect(result.success).toBe(false)
    expect(errorFor(result, 'SESSIONS_INACTIVITY_TIMEOUT')).toBe(
      MAX_SESSIONS_INACTIVITY_TIMEOUT_MESSAGE
    )
  })

  test('accepts an over-limit value that matches the saved value', () => {
    const result = parseUserSessions(
      { SESSIONS_INACTIVITY_TIMEOUT: 10000 },
      { savedTimebox: 0, savedInactivityTimeout: 10000 }
    )

    expect(result.success).toBe(true)
  })

  test('rejects a reduction that is still above the maximum', () => {
    const result = parseUserSessions(
      { SESSIONS_INACTIVITY_TIMEOUT: 9500 },
      { savedTimebox: 0, savedInactivityTimeout: 10000 }
    )

    expect(result.success).toBe(false)
    expect(errorFor(result, 'SESSIONS_INACTIVITY_TIMEOUT')).toBe(
      MAX_SESSIONS_INACTIVITY_TIMEOUT_MESSAGE
    )
  })

  test('rejects a value that is not a multiple of 0.1', () => {
    const result = parseUserSessions({ SESSIONS_INACTIVITY_TIMEOUT: 1.55 })

    expect(result.success).toBe(false)
    expect(errorFor(result, 'SESSIONS_INACTIVITY_TIMEOUT')).toBe('Must be a multiple of 0.1')
  })
})

describe('createRefreshTokenSchema — SECURITY_REFRESH_TOKEN_REUSE_INTERVAL', () => {
  test('accepts a value exactly at the maximum', () => {
    expect(
      parseRefreshToken({
        SECURITY_REFRESH_TOKEN_REUSE_INTERVAL: MAX_REFRESH_TOKEN_REUSE_INTERVAL_SECONDS,
      }).success
    ).toBe(true)
  })

  test('rejects a value above the maximum', () => {
    const result = parseRefreshToken({ SECURITY_REFRESH_TOKEN_REUSE_INTERVAL: 600 })

    expect(result.success).toBe(false)
    expect(errorFor(result, 'SECURITY_REFRESH_TOKEN_REUSE_INTERVAL')).toBe(
      MAX_REFRESH_TOKEN_REUSE_INTERVAL_MESSAGE
    )
  })

  test('accepts an over-limit value that matches the saved value', () => {
    expect(parseRefreshToken({ SECURITY_REFRESH_TOKEN_REUSE_INTERVAL: 600 }, 600).success).toBe(
      true
    )
  })

  test('rejects a reduction that is still above the maximum', () => {
    const result = parseRefreshToken({ SECURITY_REFRESH_TOKEN_REUSE_INTERVAL: 500 }, 600)

    expect(result.success).toBe(false)
    expect(errorFor(result, 'SECURITY_REFRESH_TOKEN_REUSE_INTERVAL')).toBe(
      MAX_REFRESH_TOKEN_REUSE_INTERVAL_MESSAGE
    )
  })

  test('accepts a reduction into the allowed range', () => {
    expect(parseRefreshToken({ SECURITY_REFRESH_TOKEN_REUSE_INTERVAL: 10 }, 600).success).toBe(true)
  })

  test('rejects a negative value', () => {
    const result = parseRefreshToken({ SECURITY_REFRESH_TOKEN_REUSE_INTERVAL: -1 })

    expect(result.success).toBe(false)
    expect(errorFor(result, 'SECURITY_REFRESH_TOKEN_REUSE_INTERVAL')).toBe('Must be 0 or greater')
  })
})
