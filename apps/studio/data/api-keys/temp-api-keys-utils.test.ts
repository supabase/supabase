import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  createTemporaryApiKey,
  isTemporaryApiKeyValid,
  type TemporaryApiKey,
} from './temp-api-keys-utils'

const NOW = 1_700_000_000_000

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(NOW)
})

afterEach(() => {
  vi.useRealTimers()
})

describe('createTemporaryApiKey', () => {
  it('keeps the api key and sets the expiry relative to the current time', () => {
    expect(createTemporaryApiKey('test-api-key-123', 3600)).toEqual({
      apiKey: 'test-api-key-123',
      expiryTimeMs: NOW + 3600 * 1000,
    })
  })
})

describe('isTemporaryApiKeyValid', () => {
  it.each([null, undefined])('returns false for %s', (key) => {
    expect(isTemporaryApiKeyValid(key)).toBe(false)
  })

  // Keys need more than a 30s buffer so they don't expire mid-use.
  it.each([
    [120_000, true],
    [31_000, true],
    [30_000, false],
    [10_000, false],
    [-1_000, false],
  ])('with %ims remaining returns %s', (remainingMs, expected) => {
    const key: TemporaryApiKey = { apiKey: 'test-key', expiryTimeMs: NOW + remainingMs }
    expect(isTemporaryApiKeyValid(key)).toBe(expected)
  })

  it('returns false for a key missing expiryTimeMs', () => {
    const key = { apiKey: 'test-key' } as TemporaryApiKey
    expect(isTemporaryApiKeyValid(key)).toBe(false)
  })

  it('becomes invalid once time passes the 30s buffer', () => {
    const key = createTemporaryApiKey('test-api-key', 31)
    expect(isTemporaryApiKeyValid(key)).toBe(true)

    vi.advanceTimersByTime(1000)
    expect(isTemporaryApiKeyValid(key)).toBe(false)
  })
})
