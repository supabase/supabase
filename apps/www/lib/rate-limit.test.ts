import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createRateLimiter } from './rate-limit'

const makeRequest = (ip?: string) =>
  new Request('http://localhost/test', {
    method: 'POST',
    headers: ip === undefined ? {} : { 'x-forwarded-for': ip },
  })

describe('createRateLimiter', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('allows up to max requests within the window', () => {
    const isRateLimited = createRateLimiter({ max: 3, windowMs: 60_000 })
    expect(isRateLimited(makeRequest('1.1.1.1'))).toBe(false)
    expect(isRateLimited(makeRequest('1.1.1.1'))).toBe(false)
    expect(isRateLimited(makeRequest('1.1.1.1'))).toBe(false)
    expect(isRateLimited(makeRequest('1.1.1.1'))).toBe(true)
  })

  it('resets after the window elapses', () => {
    const isRateLimited = createRateLimiter({ max: 1, windowMs: 60_000 })
    expect(isRateLimited(makeRequest('1.1.1.1'))).toBe(false)
    expect(isRateLimited(makeRequest('1.1.1.1'))).toBe(true)
    vi.advanceTimersByTime(60_000)
    expect(isRateLimited(makeRequest('1.1.1.1'))).toBe(false)
  })

  it('tracks ips independently', () => {
    const isRateLimited = createRateLimiter({ max: 1, windowMs: 60_000 })
    expect(isRateLimited(makeRequest('1.1.1.1'))).toBe(false)
    expect(isRateLimited(makeRequest('2.2.2.2'))).toBe(false)
  })

  it('keys on the first hop of a multi-hop x-forwarded-for', () => {
    const isRateLimited = createRateLimiter({ max: 1, windowMs: 60_000 })
    expect(isRateLimited(makeRequest('1.1.1.1, 10.0.0.1'))).toBe(false)
    expect(isRateLimited(makeRequest('1.1.1.1, 10.0.0.2'))).toBe(true)
  })

  it('buckets requests without x-forwarded-for together', () => {
    const isRateLimited = createRateLimiter({ max: 1, windowMs: 60_000 })
    expect(isRateLimited(makeRequest())).toBe(false)
    expect(isRateLimited(makeRequest())).toBe(true)
  })

  it('treats an empty x-forwarded-for like a missing one', () => {
    const isRateLimited = createRateLimiter({ max: 1, windowMs: 60_000 })
    expect(isRateLimited(makeRequest(''))).toBe(false)
    expect(isRateLimited(makeRequest())).toBe(true)
  })

  it('sweeps expired entries once the map grows large', () => {
    const isRateLimited = createRateLimiter({ max: 1, windowMs: 60_000 })
    for (let i = 0; i <= 10_000; i++) {
      isRateLimited(makeRequest(`10.0.${Math.floor(i / 256)}.${i % 256}`))
    }
    vi.advanceTimersByTime(60_000)
    expect(isRateLimited(makeRequest('10.0.0.0'))).toBe(false)
    expect(isRateLimited(makeRequest('10.0.0.0'))).toBe(true)
  })

  it('keeps separate buckets per limiter instance', () => {
    const a = createRateLimiter({ max: 1, windowMs: 60_000 })
    const b = createRateLimiter({ max: 1, windowMs: 60_000 })
    expect(a(makeRequest('1.1.1.1'))).toBe(false)
    expect(b(makeRequest('1.1.1.1'))).toBe(false)
  })
})
