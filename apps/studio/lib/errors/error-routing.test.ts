import { describe, expect, it } from 'vitest'

import {
  getErrorRouting,
  SAMPLE_NEVER,
  SAMPLE_OTHER,
  SAMPLE_OWNED,
  SAMPLE_USER_FAULT,
  sampleRateFromEnv,
} from './error-routing'
import {
  NetworkUnreachableError,
  PlatformError,
  RequestAbortedError,
  StudioSqlError,
  UnexpectedError,
  UserSqlError,
} from './studio-errors'

describe('sampleRateFromEnv', () => {
  it.each([
    ['0.5', 0.5],
    ['0', 0],
    ['1', 1],
  ])('uses a valid rate (%s)', (value, rate) => {
    expect(sampleRateFromEnv(value, 0.1)).toBe(rate)
  })

  it.each([undefined, '', ' ', 'abc', '-0.1', '1.5'])('falls back for %j', (value) => {
    expect(sampleRateFromEnv(value, 0.1)).toBe(0.1)
  })
})

describe('getErrorRouting', () => {
  it.each([
    ['StudioSqlError user_input', new StudioSqlError({ reason: 'user_input' }), SAMPLE_USER_FAULT],
    ['StudioSqlError studio_sql', new StudioSqlError({}), SAMPLE_OWNED],
    ['UserSqlError', new UserSqlError({}), SAMPLE_NEVER],
    ['RequestAborted', new RequestAbortedError({}), SAMPLE_NEVER],
    [
      'NetworkUnreachable offline',
      new NetworkUnreachableError({ reason: 'offline' }),
      SAMPLE_USER_FAULT,
    ],
    ['NetworkUnreachable', new NetworkUnreachableError({}), SAMPLE_OTHER],
    ['PlatformError', new PlatformError({}), SAMPLE_OTHER],
    ['UnexpectedError', new UnexpectedError({}), SAMPLE_OWNED],
  ])('routes %s', (_, error, rate) => {
    expect(getErrorRouting(error).sentrySampleRate).toBe(rate)
  })
})
