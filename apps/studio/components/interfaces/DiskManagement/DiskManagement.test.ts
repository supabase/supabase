import { describe, expect, it } from 'vitest'

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
    it('maps known infra sizes to addon variant ids', () => {
      expect(mapComputeSizeNameToAddonVariantId('4xlarge')).toBe('ci_4xlarge')
    })

    it('falls back to nano for unknown infra sizes', () => {
      // @ts-expect-error intentional invalid value for runtime guard
      expect(mapComputeSizeNameToAddonVariantId('unknown-size')).toBe('ci_nano')
    })
  })

  describe('mapAddOnVariantIdToComputeSize', () => {
    it('maps known addon ids to display names', () => {
      expect(mapAddOnVariantIdToComputeSize('ci_4xlarge')).toBe('4XL')
    })

    it('falls back to Nano on invalid addon id', () => {
      // @ts-expect-error intentional invalid value for runtime guard
      expect(mapAddOnVariantIdToComputeSize('ci_invalid')).toBe('Nano')
    })
  })

  describe('calculateBaselineIopsForComputeSize / calculateMaxIopsForComputeSize', () => {
    it('returns 0 for invalid compute ids', () => {
      expect(calculateBaselineIopsForComputeSize('invalid')).toBe(0)
      expect(calculateMaxIopsForComputeSize('invalid')).toBe(0)
    })

    it('returns baseline and max for valid compute ids', () => {
      expect(calculateBaselineIopsForComputeSize('ci_2xlarge')).toBe(12000)
      expect(calculateMaxIopsForComputeSize('ci_2xlarge')).toBe(20000)
    })
  })

  describe('calculateComputeSizeRequiredForIops', () => {
    it('returns smallest size that satisfies requested IOPS', () => {
      expect(calculateComputeSizeRequiredForIops(500)).toBe('ci_nano')
      expect(calculateComputeSizeRequiredForIops(19000)).toBe('ci_large')
      expect(calculateComputeSizeRequiredForIops(45000)).toBe('ci_12xlarge')
    })

    it('falls back to largest size when exceeding known max', () => {
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
  it('GP3 with 8GB to GP3 with 10GB for pro plan', () => {
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
  it('IO2 with 8GB to IO2 with 10GB for pro plan', () => {
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
  it('GP3 with 8GB to GP3 with 10GB, with 2 replicas', () => {
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
  it('GP3 with 3000 to IO2 with 3000', () => {
    const result = calculateIOPSPrice({
      oldStorageType: DiskType.GP3,
      oldProvisionedIOPS: 3000,
      newStorageType: DiskType.IO2,
      newProvisionedIOPS: 3000,
    })
    expect(result.oldPrice).toBe('0.00')
    expect(result.newPrice).toBe('357.00')
  })
  it('GP3 with 3000 to GP3 with 5000', () => {
    const result = calculateIOPSPrice({
      oldStorageType: DiskType.GP3,
      oldProvisionedIOPS: 3000,
      newStorageType: DiskType.GP3,
      newProvisionedIOPS: 5000,
    })
    expect(result.oldPrice).toBe('0.00')
    expect(result.newPrice).toBe('48.00')
  })
  it('IO2 with 3000 to IO2 with 5000', () => {
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
  it('GP3 with 125 MB/s 150 MB/s', () => {
    const result = calculateThroughputPrice({
      storageType: DiskType.GP3,
      oldThroughput: 125,
      newThroughput: 150,
    })
    expect(result.oldPrice).toBe('0.00')
    expect(result.newPrice).toBe('2.38')
  })
  it('IO1 with 125 MB/s 150 MB/s', () => {
    const result = calculateThroughputPrice({
      storageType: DiskType.IO2,
      oldThroughput: 125,
      newThroughput: 150,
    })
    expect(result.oldPrice).toBe('0.00')
    expect(result.newPrice).toBe('0.00')
  })
})
