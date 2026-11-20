import {
  COMPUTE_DISK,
  getInstanceDiskLimits,
  hasBurstableDiskIO,
  INSTANCE_DISK_LIMITS,
} from 'shared-data'
import { describe, expect, test } from 'vitest'

import { CreateDiskStorageSchema } from './DiskManagement.schema'
import {
  calculateBaselineIopsForComputeSize,
  calculateComputeSizeRequiredForIops,
  calculateDiskSizePrice,
  calculateIOPSPrice,
  calculateMaxIopsAllowedForDiskSizeWithGp3,
  calculateMaxIopsForComputeSize,
  calculateMaxThroughput,
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

describe('calculateMaxIopsAllowedForDiskSizeWithGp3', () => {
  // Regression: old code returned `3000 * size`, letting a 2 GB disk request 6000 IOPS
  // which the platform rejects. The real ceiling is 500 IOPS/GB capped at DISK_LIMITS.gp3.maxIops.
  test('caps a sub-6 GB disk at the 3000 IOPS floor (not 3000 × size)', () => {
    expect(calculateMaxIopsAllowedForDiskSizeWithGp3(2)).toBe(3000)
  })

  test('scales linearly with disk size below the gp3 max IOPS ceiling', () => {
    expect(calculateMaxIopsAllowedForDiskSizeWithGp3(100)).toBe(50000)
  })

  test('caps large disks at the gp3 max IOPS ceiling (80 000)', () => {
    expect(calculateMaxIopsAllowedForDiskSizeWithGp3(1000)).toBe(80000)
  })
})

describe('calculateMaxThroughput', () => {
  // Regression: the ceiling was hardcoded to 1000 MB/s while DISK_LIMITS.gp3.maxThroughput moved
  // to 2000, so large gp3 disks were rejected with a misleading "need more IOPS" error.
  test('scales with provisioned IOPS below the gp3 max throughput ceiling', () => {
    expect(calculateMaxThroughput(4000)).toBe(1024)
  })

  test('caps at the gp3 max throughput ceiling (2000 MB/s)', () => {
    expect(calculateMaxThroughput(80000)).toBe(2000)
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
  test('includes IOPS charges for read replicas', () => {
    const result = calculateIOPSPrice({
      oldStorageType: DiskType.GP3,
      oldProvisionedIOPS: 3000,
      newStorageType: DiskType.GP3,
      newProvisionedIOPS: 5000,
      numReplicas: 2,
    })

    expect(result.oldPrice).toBe('0.00')
    expect(result.newPrice).toBe('144.00')
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
  test('includes throughput charges for read replicas', () => {
    const result = calculateThroughputPrice({
      storageType: DiskType.GP3,
      oldThroughput: 125,
      newThroughput: 150,
      numReplicas: 2,
    })

    expect(result.oldPrice).toBe('0.00')
    expect(result.newPrice).toBe('7.13')
  })
})

describe('CreateDiskStorageSchema', () => {
  const validGp3Config = {
    storageType: DiskType.GP3,
    totalSize: 8,
    provisionedIOPS: 3000,
    throughput: 125,
    computeSize: 'ci_large' as const,
    growthPercent: null,
    minIncrementGb: null,
    maxSizeGb: null,
  }

  test('enforces the GP3 500 IOPS per GB limit', () => {
    const schema = CreateDiskStorageSchema({
      defaultTotalSize: 8,
      cloudProvider: 'AWS',
      isSpendCapEnabled: false,
    })

    const result = schema.safeParse({
      ...validGp3Config,
      provisionedIOPS: 6000,
    })

    expect(result.success).toBe(false)
    if (result.success) return

    expect(result.error.issues).toContainEqual(
      expect.objectContaining({
        path: ['provisionedIOPS'],
        message: 'Larger Disk size of at least 12 GB required. Current max is 4,000 IOPS.',
      })
    )
  })

  test('allows gp3 throughput above 1000 MB/s when IOPS and compute support it', () => {
    const schema = CreateDiskStorageSchema({
      defaultTotalSize: 4096,
      cloudProvider: 'AWS',
      isSpendCapEnabled: false,
    })

    const result = schema.safeParse({
      ...validGp3Config,
      totalSize: 4096,
      provisionedIOPS: 80000,
      throughput: 2000,
      computeSize: 'ci_16xlarge' as const,
    })

    expect(result.error?.issues ?? []).toEqual([])
  })

  test('allows a legacy disk below 8 GB when its size is unchanged', () => {
    const schema = CreateDiskStorageSchema({
      defaultTotalSize: 2,
      cloudProvider: 'AWS',
      isSpendCapEnabled: false,
    })

    expect(
      schema.safeParse({
        ...validGp3Config,
        totalSize: 2,
      }).success
    ).toBe(true)
  })

  test('prevents disk growth above 8 GB while spend cap is enabled', () => {
    const schema = CreateDiskStorageSchema({
      defaultTotalSize: 8,
      cloudProvider: 'AWS',
      isSpendCapEnabled: true,
    })

    const result = schema.safeParse({
      ...validGp3Config,
      totalSize: 10,
    })

    expect(result.success).toBe(false)
    if (result.success) return

    expect(result.error.issues).toContainEqual(
      expect.objectContaining({
        path: ['totalSize'],
        message: 'Disable spend cap to increase disk above 8 GB.',
      })
    )
  })

  test.each(['AWS_NIMBUS', 'AWS_K8S'] as const)(
    'skips platform disk constraints for %s projects',
    (cloudProvider) => {
      const schema = CreateDiskStorageSchema({
        defaultTotalSize: 8,
        cloudProvider,
        isSpendCapEnabled: true,
      })

      expect(
        schema.safeParse({
          ...validGp3Config,
          totalSize: 1,
          provisionedIOPS: 100_000,
          throughput: 10_000,
        }).success
      ).toBe(true)
    }
  )

  describe('per-instance limits', () => {
    const schemaWithInstanceLimits = CreateDiskStorageSchema({
      defaultTotalSize: 100,
      cloudProvider: 'AWS',
      isSpendCapEnabled: false,
      currentComputeSize: 'ci_large',
      currentInstanceLimits: INSTANCE_DISK_LIMITS['m6i.large'],
    })

    test('allows provisioning up to the instance max, above the size floor', () => {
      // the ci_large floor blocks at 20,000 IOPS; an m6i.large supports 40,000
      const result = schemaWithInstanceLimits.safeParse({
        ...validGp3Config,
        totalSize: 100,
        provisionedIOPS: 40_000,
        throughput: 1_000,
      })
      expect(result.error?.issues ?? []).toEqual([])
    })

    test('still blocks above the instance max', () => {
      const result = schemaWithInstanceLimits.safeParse({
        ...validGp3Config,
        totalSize: 100,
        provisionedIOPS: 41_000,
      })
      expect(result.success).toBe(false)
      if (result.success) return
      expect(result.error.issues).toContainEqual(
        expect.objectContaining({ path: ['provisionedIOPS'] })
      )
    })

    test('blocks throughput above the instance ceiling (m6g.large regression anchor)', () => {
      // verified against a live m6g.large: 595 MB/s errors at the 594 MB/s ceiling
      const schema = CreateDiskStorageSchema({
        defaultTotalSize: 100,
        cloudProvider: 'AWS',
        isSpendCapEnabled: false,
        currentComputeSize: 'ci_large',
        currentInstanceLimits: INSTANCE_DISK_LIMITS['m6g.large'],
      })
      const result = schema.safeParse({
        ...validGp3Config,
        totalSize: 100,
        provisionedIOPS: 3_000,
        throughput: 595,
      })
      expect(result.success).toBe(false)
      if (result.success) return
      expect(result.error.issues).toContainEqual(
        expect.objectContaining({
          path: ['throughput'],
          message: 'Throughput cannot exceed 594 MB/s for the selected compute size.',
        })
      )
    })

    test('falls back to the size floors when a different compute size is selected', () => {
      // selecting XL means an unknown future instance, so the XL floor (20,000) applies
      const result = schemaWithInstanceLimits.safeParse({
        ...validGp3Config,
        totalSize: 100,
        provisionedIOPS: 40_000,
        computeSize: 'ci_xlarge' as const,
      })
      expect(result.success).toBe(false)
      if (result.success) return
      expect(result.error.issues).toContainEqual(
        expect.objectContaining({ path: ['provisionedIOPS'] })
      )
    })
  })
})

describe('instance disk limits data', () => {
  test('resolves known instance identifiers and rejects unknown ones', () => {
    expect(getInstanceDiskLimits('m6i.large')).toEqual({
      size: 'ci_large',
      baselineIops: 3_600,
      maxIops: 40_000,
      baselineThroughputMBps: 81,
      maxThroughputMBps: 1_250,
    })
    expect(getInstanceDiskLimits('unknown.type')).toBeUndefined()
    expect(getInstanceDiskLimits(null)).toBeUndefined()
    expect(getInstanceDiskLimits(undefined)).toBeUndefined()
  })

  test('derives burstability from the data instead of a size list', () => {
    // every size up to 2XL bursts on every configuration
    expect(hasBurstableDiskIO(INSTANCE_DISK_LIMITS['t4g.nano'])).toBe(true)
    expect(hasBurstableDiskIO(INSTANCE_DISK_LIMITS['m6g.2xlarge'])).toBe(true)
    // at 4XL it depends on the configuration
    expect(hasBurstableDiskIO(INSTANCE_DISK_LIMITS['m6g.4xlarge'])).toBe(false)
    expect(hasBurstableDiskIO(INSTANCE_DISK_LIMITS['m6i.4xlarge'])).toBe(true)
    // from 8XL up, baseline equals maximum everywhere
    expect(hasBurstableDiskIO(INSTANCE_DISK_LIMITS['m6a.8xlarge'])).toBe(false)
    expect(hasBurstableDiskIO(INSTANCE_DISK_LIMITS['m8g.48xlarge'])).toBe(false)
    expect(hasBurstableDiskIO(undefined)).toBe(false)
  })

  // The floors are published in the docs and on www. They are derived from
  // INSTANCE_DISK_LIMITS, so a configuration-table edit can move them — this
  // pin makes any change to the public numbers a deliberate, visible diff.
  test('derived size-wide floors match the published values', () => {
    const published: Record<string, [number, number, number, number]> = {
      ci_nano: [250, 11_800, 5, 261],
      ci_micro: [500, 11_800, 11, 261],
      ci_small: [1_000, 11_800, 22, 261],
      ci_medium: [2_000, 11_800, 39, 261],
      ci_large: [3_600, 20_000, 79, 594],
      ci_xlarge: [6_000, 20_000, 149, 594],
      ci_2xlarge: [12_000, 20_000, 297, 594],
      ci_4xlarge: [20_000, 20_000, 594, 594],
      ci_8xlarge: [40_000, 40_000, 1_188, 1_188],
      ci_12xlarge: [50_000, 50_000, 1_781, 1_781],
      ci_16xlarge: [80_000, 80_000, 2_375, 2_375],
      ci_24xlarge: [120_000, 120_000, 3_750, 3_750],
      ci_24xlarge_optimized_cpu: [120_000, 120_000, 3_750, 3_750],
      ci_24xlarge_optimized_memory: [120_000, 120_000, 3_750, 3_750],
      ci_24xlarge_high_memory: [120_000, 120_000, 3_750, 3_750],
      ci_48xlarge: [240_000, 240_000, 5_000, 5_000],
      ci_48xlarge_optimized_cpu: [240_000, 240_000, 5_000, 5_000],
      ci_48xlarge_optimized_memory: [240_000, 240_000, 5_000, 5_000],
      ci_48xlarge_high_memory: [240_000, 240_000, 5_000, 5_000],
    }
    expect(Object.keys(COMPUTE_DISK)).toEqual(Object.keys(published))
    for (const [key, floor] of Object.entries(COMPUTE_DISK)) {
      const [baselineIops, maxIops, baselineThroughputMBps, maxThroughputMBps] = published[key]
      expect.soft({ key, ...floor }, key).toEqual(
        expect.objectContaining({
          baselineIops,
          maxIops,
          baselineThroughputMBps,
          maxThroughputMBps,
        })
      )
    }
  })
})
