import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { executeWithRetry } from './table-rows-query'

const rateLimitError = { status: 429, headers: { get: () => '1' } }

describe('executeWithRetry', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns the result of the function when successful', async () => {
    const mockFn = vi.fn().mockResolvedValue('success')
    await expect(executeWithRetry(mockFn)).resolves.toBe('success')
    expect(mockFn).toHaveBeenCalledTimes(1)
  })

  it('retries on 429 errors until the function succeeds', async () => {
    const mockFn = vi
      .fn()
      .mockRejectedValueOnce(rateLimitError)
      .mockRejectedValueOnce(rateLimitError)
      .mockResolvedValue('success')

    const result = executeWithRetry(mockFn)
    await vi.runAllTimersAsync()
    await expect(result).resolves.toBe('success')
    expect(mockFn).toHaveBeenCalledTimes(3)
  })

  it('throws after max retries', async () => {
    const mockFn = vi.fn().mockRejectedValue(rateLimitError)

    const result = executeWithRetry(mockFn, 2)
    const assertion = expect(result).rejects.toMatchObject({ status: 429 })
    await vi.runAllTimersAsync()
    await assertion
    expect(mockFn).toHaveBeenCalledTimes(3) // Initial attempt + 2 retries
  })

  it('throws non-429 errors immediately', async () => {
    const mockFn = vi.fn().mockRejectedValue(new Error('Some other error'))

    await expect(executeWithRetry(mockFn)).rejects.toThrow('Some other error')
    expect(mockFn).toHaveBeenCalledTimes(1)
  })
})
