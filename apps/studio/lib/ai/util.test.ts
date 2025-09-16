import { describe, it, expect } from 'vitest'
import { selectWeightedKey } from './util'

describe('selectWeightedKey', () => {
  it('should return a valid key from the weights object', async () => {
    const weights = { a: 10, b: 20, c: 30 }
    const result = await selectWeightedKey('test-input', weights)

    expect(Object.keys(weights)).toContain(result)
  })

  it('should return consistent results for the same input', async () => {
    const weights = { region1: 40, region2: 10, region3: 20 }
    const input = 'consistent-key'

    const result1 = await selectWeightedKey(input, weights)
    const result2 = await selectWeightedKey(input, weights)
    const result3 = await selectWeightedKey(input, weights)

    expect(result1).toBe(result2)
    expect(result2).toBe(result3)
  })

  it('should distribute keys according to weights', async () => {
    const weights = { a: 80, b: 10, c: 10 }
    const numSamples = 10000
    const samples = Array.from({ length: numSamples }, (_, i) => `sample-${i}`)

    const results = await Promise.all(samples.map((sample) => selectWeightedKey(sample, weights)))

    const counts = results.reduce<Record<string, number>>((acc, key) => {
      acc[key] = (acc[key] ?? 0) + 1
      return acc
    }, {})

    expect(counts.a / numSamples).toBeCloseTo(0.8, 1)
    expect(counts.b / numSamples).toBeCloseTo(0.1, 1)
    expect(counts.c / numSamples).toBeCloseTo(0.1, 1)
  })

  it('should handle equal weights', async () => {
    const weights = { x: 25, y: 25, z: 25, w: 25 }
    const numSamples = 8000
    const samples = Array.from({ length: numSamples }, (_, i) => `equal-${i}`)

    const results = await Promise.all(samples.map((sample) => selectWeightedKey(sample, weights)))

    const counts = results.reduce<Record<string, number>>((acc, key) => {
      acc[key] = (acc[key] ?? 0) + 1
      return acc
    }, {})

    // Each key should get roughly 25% of the samples
    Object.values(counts).forEach((count) => {
      expect(count / numSamples).toBeCloseTo(0.25, 1)
    })
  })

  it('should handle single key', async () => {
    const weights = { only: 100 }
    const result = await selectWeightedKey('any-input', weights)

    expect(result).toBe('only')
  })

  it('should handle empty string input', async () => {
    const weights = { a: 10, b: 20 }
    const result = await selectWeightedKey('', weights)

    expect(Object.keys(weights)).toContain(result)
  })

  it('should handle unicode characters in input', async () => {
    const weights = { option1: 50, option2: 50 }
    const unicodeInput = '🔑-unicode-key-测试'

    const result1 = await selectWeightedKey(unicodeInput, weights)
    const result2 = await selectWeightedKey(unicodeInput, weights)

    expect(result1).toBe(result2)
    expect(Object.keys(weights)).toContain(result1)
  })
})
