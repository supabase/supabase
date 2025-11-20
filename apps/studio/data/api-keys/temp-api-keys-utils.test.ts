import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createTemporaryApiKey,
  isTemporaryApiKeyValid,
  type TemporaryApiKey,
} from './temp-api-keys-utils'

describe('createTemporaryUploadKey', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should create a temporary upload key with correct apiKey', () => {
    const apiKey = 'test-api-key-123'
    const expiryInSeconds = 3600

    const result = createTemporaryApiKey(apiKey, expiryInSeconds)

    expect(result.apiKey).toBe(apiKey)
  })

  it('should create a temporary upload key with expiry time 1 hour in the future', () => {
    const now = Date.now()
    vi.setSystemTime(now)

    const apiKey = 'test-api-key-123'
    const expiryInSeconds = 3600 // 1 hour

    const result = createTemporaryApiKey(apiKey, expiryInSeconds)

    expect(result.expiryTime).toBe(now + 3600 * 1000)
  })

  it('should handle short expiry durations', () => {
    const now = Date.now()
    vi.setSystemTime(now)

    const apiKey = 'test-api-key-123'
    const expiryInSeconds = 60 // 1 minute

    const result = createTemporaryApiKey(apiKey, expiryInSeconds)

    expect(result.expiryTime).toBe(now + 60 * 1000)
  })

  it('should create keys with different expiry times when called at different times', () => {
    const apiKey = 'test-api-key-123'
    const expiryInSeconds = 3600

    const now1 = 1000000
    vi.setSystemTime(now1)
    const result1 = createTemporaryApiKey(apiKey, expiryInSeconds)

    const now2 = 2000000
    vi.setSystemTime(now2)
    const result2 = createTemporaryApiKey(apiKey, expiryInSeconds)

    expect(result1.expiryTime).toBe(now1 + expiryInSeconds * 1000)
    expect(result2.expiryTime).toBe(now2 + expiryInSeconds * 1000)
    expect(result1.expiryTime).not.toBe(result2.expiryTime)
  })
})

describe('isTemporaryUploadKeyValid', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should return false for null key', () => {
    const result = isTemporaryApiKeyValid(null)

    expect(result).toBe(false)
  })

  it('should return false for undefined key', () => {
    const result = isTemporaryApiKeyValid(undefined)

    expect(result).toBe(false)
  })

  it('should return true for a key with more than 60 seconds remaining', () => {
    const now = Date.now()
    vi.setSystemTime(now)

    const key: TemporaryApiKey = {
      apiKey: 'test-key',
      expiryTime: now + 120000, // 2 minutes from now
    }

    const result = isTemporaryApiKeyValid(key)

    expect(result).toBe(true)
  })

  it('should return false for a key with exactly 60 seconds remaining', () => {
    const now = Date.now()
    vi.setSystemTime(now)

    const key: TemporaryApiKey = {
      apiKey: 'test-key',
      expiryTime: now + 60000, // Exactly 60 seconds
    }

    const result = isTemporaryApiKeyValid(key)

    expect(result).toBe(false)
  })

  it('should return false for a key with less than 60 seconds remaining', () => {
    const now = Date.now()
    vi.setSystemTime(now)

    const key: TemporaryApiKey = {
      apiKey: 'test-key',
      expiryTime: now + 30000, // 30 seconds from now
    }

    const result = isTemporaryApiKeyValid(key)

    expect(result).toBe(false)
  })

  it('should return false for an expired key', () => {
    const now = Date.now()
    vi.setSystemTime(now)

    const key: TemporaryApiKey = {
      apiKey: 'test-key',
      expiryTime: now - 1000, // 1 second ago
    }

    const result = isTemporaryApiKeyValid(key)

    expect(result).toBe(false)
  })

  it('should return false for a key that expired long ago', () => {
    const now = Date.now()
    vi.setSystemTime(now)

    const key: TemporaryApiKey = {
      apiKey: 'test-key',
      expiryTime: now - 3600000, // 1 hour ago
    }

    const result = isTemporaryApiKeyValid(key)

    expect(result).toBe(false)
  })

  it('should return true for a key with exactly 61 seconds remaining', () => {
    const now = Date.now()
    vi.setSystemTime(now)

    const key: TemporaryApiKey = {
      apiKey: 'test-key',
      expiryTime: now + 61000, // 61 seconds from now
    }

    const result = isTemporaryApiKeyValid(key)

    expect(result).toBe(true)
  })

  it('should handle time advancing correctly', () => {
    const now = Date.now()
    vi.setSystemTime(now)

    const key: TemporaryApiKey = {
      apiKey: 'test-key',
      expiryTime: now + 120000, // 2 minutes from now
    }

    // Initially valid
    expect(isTemporaryApiKeyValid(key)).toBe(true)

    // Advance time by 59 seconds (should still be valid - 61 seconds remaining)
    vi.advanceTimersByTime(59000)
    expect(isTemporaryApiKeyValid(key)).toBe(true)

    // Advance time by 2 more seconds (should be invalid - 59 seconds remaining)
    vi.advanceTimersByTime(2000)
    expect(isTemporaryApiKeyValid(key)).toBe(false)
  })

  it('should return true for a key missing apiKey property', () => {
    const now = Date.now()
    vi.setSystemTime(now)

    const key = {
      expiryTime: now + 120000,
    } as TemporaryApiKey

    const result = isTemporaryApiKeyValid(key)

    // While the key has expiryTime, it's missing apiKey, but since we're checking
    // the structure, we expect it to still pass the time check if the expiryTime exists
    // Actually, the function only checks time, not the apiKey presence
    // Let's verify the actual behavior
    expect(result).toBe(true)
  })

  it('should return false for a key missing expiryTime property', () => {
    const key = {
      apiKey: 'test-key',
    } as TemporaryApiKey

    const result = isTemporaryApiKeyValid(key)

    // Without expiryTime, the calculation will be NaN and fail the > 60000 check
    expect(result).toBe(false)
  })
})

describe('integration: createTemporaryUploadKey and isTemporaryUploadKeyValid', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should create a key that is immediately valid', () => {
    const now = Date.now()
    vi.setSystemTime(now)

    const key = createTemporaryApiKey('test-api-key', 3600)

    expect(isTemporaryApiKeyValid(key)).toBe(true)
  })

  it('should create a key that becomes invalid after expiry time minus 60 seconds', () => {
    const now = Date.now()
    vi.setSystemTime(now)

    const expiryInSeconds = 120 // 2 minutes
    const key = createTemporaryApiKey('test-api-key', expiryInSeconds)

    // Initially valid
    expect(isTemporaryApiKeyValid(key)).toBe(true)

    // Advance to 59 seconds before expiry (should still be valid - 61 seconds remaining)
    vi.advanceTimersByTime((expiryInSeconds - 61) * 1000)
    expect(isTemporaryApiKeyValid(key)).toBe(true)

    // Advance to 60 seconds before expiry (should be invalid - 60 seconds remaining)
    vi.advanceTimersByTime(1000)
    expect(isTemporaryApiKeyValid(key)).toBe(false)
  })

  it('should handle very short expiry durations', () => {
    const now = Date.now()
    vi.setSystemTime(now)

    // Create a key that expires in 30 seconds (less than the 60 second buffer)
    const key = createTemporaryApiKey('test-api-key', 30)

    // Should be invalid immediately because it will expire in less than 60 seconds
    expect(isTemporaryApiKeyValid(key)).toBe(false)
  })

  it('should handle expiry duration of exactly 60 seconds', () => {
    const now = Date.now()
    vi.setSystemTime(now)

    // Create a key that expires in exactly 60 seconds
    const key = createTemporaryApiKey('test-api-key', 60)

    // Should be invalid because it has exactly 60 seconds remaining (not more than 60)
    expect(isTemporaryApiKeyValid(key)).toBe(false)
  })

  it('should handle expiry duration of 61 seconds', () => {
    const now = Date.now()
    vi.setSystemTime(now)

    // Create a key that expires in 61 seconds
    const key = createTemporaryApiKey('test-api-key', 61)

    // Should be valid because it has 61 seconds remaining (more than 60)
    expect(isTemporaryApiKeyValid(key)).toBe(true)

    // Advance by 1 second
    vi.advanceTimersByTime(1000)

    // Should now be invalid because it has exactly 60 seconds remaining
    expect(isTemporaryApiKeyValid(key)).toBe(false)
  })
})
