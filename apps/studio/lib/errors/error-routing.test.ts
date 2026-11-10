import { describe, expect, it } from 'vitest'

import { sampleRateFromEnv } from './error-routing'

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
