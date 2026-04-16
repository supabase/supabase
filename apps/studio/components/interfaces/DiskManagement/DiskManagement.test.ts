import { describe, expect, test } from 'vitest'

import {
  calculateBaselineIopsForComputeSize,
  calculateComputeSizeRequiredForIops,
  calculateDiskSizePrice,
  calculateIOPSPrice,
  calculateMaxIopsForComputeSize,
  calculateThroughputPrice,
  mapAddOnVariantIdToComputeSize,
  mapComputeSizeNameToAddonVariantId,
} from './DiskManagement.utils'
import { DiskType } from './ui/DiskManagement.constants'

describe('DiskManagement utils', () => {
  describe('mapComputeSizeNameToAddonVariantId', () => {
    test('maps known infra sizes to addon variant ids', () => {
      expect(mapComputeSizeNameToAddonVariantId('4xlarge')).toBe('ci_4xlarge')
    })

    test('falls back to nano for unknown infra sizes', () => {
      // @ts-expect-error intentional invalid value for runtime guard
      expect(mapComputeSizeNameToAddonVariantId('unknown-size')).toBe('ci_nano')
    })
  })

  describe('mapAddOnVariantIdToComputeSize', () => {
    test('maps known addon ids to display names', () => {
      expect(mapAddOnVariantIdToComputeSize('ci_4xlarge')).toBe('4XL')
    })

    test('falls back to Nano on invalid addon id', () => {
      // @ts-expect-error intentional invalid value for runtime guard
      expect(mapAddOnVariantIdToComputeSize('ci_invalid')).toBe('Nano')
    })
  })

  describe('calculateBaselineIopsForComputeSize / calculateMaxIopsForComputeSize', () => {
    test('returns 0 for invalid compute ids', () => {
      expect(calculateBaselineIopsForComputeSize('invalid')).toBe(0)
      expect(calculateMaxIopsForComputeSize('invalid')).toBe(0)
    })

    test('returns baseline and max for valid compute ids', () => {
      expect(calculateBaselineIopsForComputeSize('ci_2xlarge')).toBe(12000)
      expect(calculateMaxIopsForComputeSize('ci_2xlarge')).toBe(20000)
    })
  })

  describe('calculateComputeSizeRequiredForIops', () => {
    test('returns smallest size that satisfies requested IOPS', () => {
      expect(calculateComputeSizeRequiredForIops(500)).toBe('ci_nano')
      expect(calculateComputeSizeRequiredForIops(19000)).toBe('ci_large')
      expect(calculateComputeSizeRequiredForIops(45000)).toBe('ci_12xlarge')
    })

    test('falls back to largest size when exceeding known max', () => {
      const fallback = calculateComputeSizeRequiredForIops(500000)
      expect([
        'ci_48xlarge',
        'ci_48xlarge_optimized_cpu',
        'ci_48xlarge_optimized_memory',
        'ci_48xlarge_high_memory',
      ]).toContain(fallback)
    })
  })
})

describe('DiskManagement.utils.ts:calculateDiskSizePrice', () => {
  test('GP3 with 8GB to GP3 with 10GB for pro plan', () => {
    const result = calculateDiskSizePrice({
      planId: 'pro',
      oldSize: 8,
      oldStorageType: DiskType.GP3,
      newSize: 10,
      newStorageType: DiskType.GP3,
    })
    expect(result.oldPrice).toBe('0.00')
    expect(result.newPrice).toBe('0.25')
  })
  test('IO2 with 8GB to IO2 with 10GB for pro plan', () => {
    const result = calculateDiskSizePrice({
      planId: 'pro',
      oldSize: 8,
      oldStorageType: DiskType.IO2,
      newSize: 10,
      newStorageType: DiskType.IO2,
    })
    expect(result.oldPrice).toBe('1.56')
    expect(result.newPrice).toBe('1.95')
  })
  test('GP3 with 8GB to GP3 with 10GB, with 2 replicas', () => {
    const result = calculateDiskSizePrice({
      planId: 'pro',
      oldSize: 8,
      oldStorageType: DiskType.GP3,
      newSize: 10,
      newStorageType: DiskType.GP3,
      numReplicas: 2,
    })
    expect(result.oldPrice).toBe('2.50')
    expect(result.newPrice).toBe('3.38')
  })
})

describe('DiskManagement.utils.ts:calculateIOPSPrice', () => {
  test('GP3 with 3000 to IO2 with 3000', () => {
    const result = calculateIOPSPrice({
      oldStorageType: DiskType.GP3,
      oldProvisionedIOPS: 3000,
      newStorageType: DiskType.IO2,
      newProvisionedIOPS: 3000,
    })
    expect(result.oldPrice).toBe('0.00')
    expect(result.newPrice).toBe('357.00')
  })
  test('GP3 with 3000 to GP3 with 5000', () => {
    const result = calculateIOPSPrice({
      oldStorageType: DiskType.GP3,
      oldProvisionedIOPS: 3000,
      newStorageType: DiskType.GP3,
      newProvisionedIOPS: 5000,
    })
    expect(result.oldPrice).toBe('0.00')
    expect(result.newPrice).toBe('48.00')
  })
  test('IO2 with 3000 to IO2 with 5000', () => {
    const result = calculateIOPSPrice({
      oldStorageType: DiskType.IO2,
      oldProvisionedIOPS: 3000,
      newStorageType: DiskType.IO2,
      newProvisionedIOPS: 5000,
    })
    expect(result.oldPrice).toBe('357.00')
    expect(result.newPrice).toBe('595.00')
  })
})

describe('DiskManagement.utils.ts:calculateThroughputPrice', () => {
  test('GP3 with 125 MB/s 150 MB/s', () => {
    const result = calculateThroughputPrice({
      storageType: DiskType.GP3,
      oldThroughput: 125,
      newThroughput: 150,
    })
    expect(result.oldPrice).toBe('0.00')
    expect(result.newPrice).toBe('2.38')
  })
  test('IO1 with 125 MB/s 150 MB/s', () => {
    const result = calculateThroughputPrice({
      storageType: DiskType.IO2,
      oldThroughput: 125,
      newThroughput: 150,
    })
    expect(result.oldPrice).toBe('0.00')
    expect(result.newPrice).toBe('0.00')
  })
})
