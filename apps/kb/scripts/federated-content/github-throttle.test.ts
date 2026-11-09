import { describe, expect, it, vi } from 'vitest'

import { createPacer, isRateLimitError, readMinIntervalMs } from './github-throttle.ts'

const requestError = (status: number, message = 'error', headers: Record<string, string> = {}) =>
  Object.assign(new Error(message), { status, response: { headers } })

describe('isRateLimitError', () => {
  it('recognizes a secondary rate limit 403 by its message', () => {
    expect(isRateLimitError(requestError(403, 'You have exceeded a secondary rate limit'))).toBe(
      true
    )
  })

  it('recognizes a 403 carrying Retry-After or an exhausted quota', () => {
    expect(isRateLimitError(requestError(403, 'Forbidden', { 'retry-after': '30' }))).toBe(true)
    expect(isRateLimitError(requestError(403, 'Forbidden', { 'x-ratelimit-remaining': '0' }))).toBe(
      true
    )
  })

  it('recognizes any 429', () => {
    expect(isRateLimitError(requestError(429))).toBe(true)
  })

  it('recognizes a GraphQL RATE_LIMITED response error', () => {
    const error = Object.assign(new Error('API rate limit already exceeded'), {
      errors: [{ type: 'RATE_LIMITED' }],
      headers: {},
    })

    expect(isRateLimitError(error)).toBe(true)
  })

  it('does not treat other failures as rate limits', () => {
    expect(isRateLimitError(requestError(403, 'Resource not accessible by integration'))).toBe(
      false
    )
    expect(isRateLimitError(requestError(404))).toBe(false)
    expect(isRateLimitError(requestError(502))).toBe(false)
    expect(isRateLimitError(new TypeError('fetch failed'))).toBe(false)
    expect(isRateLimitError('boom')).toBe(false)
    expect(isRateLimitError(null)).toBe(false)
  })
})

describe('createPacer', () => {
  it('waits out the remainder of the minimum interval between calls', async () => {
    let clock = 1_000
    const sleep = vi.fn(async (ms: number) => {
      clock += ms
    })
    const pace = createPacer(2_000, { now: () => clock, sleep })

    await pace() // the first call never waits
    clock += 500
    await pace()

    expect(sleep).toHaveBeenCalledTimes(1)
    expect(sleep).toHaveBeenCalledWith(1_500)
  })

  it('does not wait when the interval has already passed', async () => {
    let clock = 0
    const sleep = vi.fn(async () => {})
    const pace = createPacer(2_000, { now: () => clock, sleep })

    await pace()
    clock += 5_000
    await pace()

    expect(sleep).not.toHaveBeenCalled()
  })
})

describe('readMinIntervalMs', () => {
  it('defaults to 2s', () => {
    expect(readMinIntervalMs(['node', 'script'])).toBe(2000)
  })

  it('reads --delay-ms and ignores invalid values', () => {
    expect(readMinIntervalMs(['--delay-ms=5000'])).toBe(5000)
    expect(readMinIntervalMs(['--delay-ms=abc'])).toBe(2000)
    expect(readMinIntervalMs(['--delay-ms=-1'])).toBe(2000)
  })
})
