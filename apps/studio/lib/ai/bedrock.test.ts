import { describe, it, expect } from 'vitest'
import { selectBedrockRegion, bedrockRegionMap } from './bedrock'

describe('selectBedrockRegion', () => {
  it('should return a valid region for a given routing key', async () => {
    const region = await selectBedrockRegion('test-key')
    const validRegions = Object.keys(bedrockRegionMap)

    expect(validRegions).toContain(region)
  })

  it('should return the same region for the same routing key', async () => {
    const routingKey = 'consistent-key'
    const region1 = await selectBedrockRegion(routingKey)
    const region2 = await selectBedrockRegion(routingKey)

    expect(region1).toBe(region2)
  })

  it('should distribute different keys across regions', async () => {
    const keys = Array.from({ length: 100 }, (_, i) => `key-${i}`)
    const regions = await Promise.all(keys.map((key) => selectBedrockRegion(key)))
    const uniqueRegions = new Set(regions)
    const validRegions = Object.keys(bedrockRegionMap)

    // Should use all regions for 100 different keys
    expect(uniqueRegions.size).toEqual(validRegions.length)
  })

  it('should distribute keys evenly across regions', async () => {
    const numKeys = 3000
    const keys = Array.from({ length: numKeys }, (_, i) => `key-${i}`)
    const regions = await Promise.all(keys.map((key) => selectBedrockRegion(key)))
    const validRegions = Object.keys(bedrockRegionMap)

    // Count occurrences of each region
    const regionCounts = regions.reduce<Record<string, number>>((acc, region) => {
      acc[region] = (acc[region] ?? 0) + 1
      return acc
    }, {})

    const expectedCountPerRegion = numKeys / validRegions.length
    const tolerance = expectedCountPerRegion * 0.2 // Allow 20% deviation

    // Each region should have roughly equal distribution
    for (const count of Object.values(regionCounts)) {
      expect(count).toBeGreaterThan(expectedCountPerRegion - tolerance)
      expect(count).toBeLessThan(expectedCountPerRegion + tolerance)
    }
  })

  it('should handle empty string', async () => {
    const region = await selectBedrockRegion('')
    const validRegions = Object.keys(bedrockRegionMap)

    expect(validRegions).toContain(region)
  })

  it('should handle special characters in routing key', async () => {
    const region = await selectBedrockRegion('key-with-special-chars!@#$%')
    const validRegions = Object.keys(bedrockRegionMap)

    expect(validRegions).toContain(region)
  })

  it('should return consistent results for unicode characters', async () => {
    const routingKey = '🔑-unicode-key-测试'
    const region1 = await selectBedrockRegion(routingKey)
    const region2 = await selectBedrockRegion(routingKey)

    expect(region1).toBe(region2)
  })
})
