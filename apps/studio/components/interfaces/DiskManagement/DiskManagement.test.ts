import { describe, expect, test } from 'vitest'

import { CreateDiskStorageSchema } from './DiskManagement.schema'
import {
  calculateBaselineIopsForComputeSize,
  calculateComputeSizeRequiredForIops,
  calculateDiskSizePrice,
  calculateIOPSPrice,
  calculateMaxIopsAllowedForDiskSizeWithGp3,
  calculateMaxIopsForComputeSize,
  calculateThroughputPrice,
  getDiskConfigEditability,
  isDiskConfigOverProvisioned,
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
  // which the platform rejects. The real ceiling is 500 IOPS/GB capped at 16 000.
  test('caps a sub-6 GB disk at the 3000 IOPS floor (not 3000 × size)', () => {
    expect(calculateMaxIopsAllowedForDiskSizeWithGp3(2)).toBe(3000)
  })

  test('caps large disks at 16 000 IOPS', () => {
    expect(calculateMaxIopsAllowedForDiskSizeWithGp3(100)).toBe(16000)
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
})

describe('isDiskConfigOverProvisioned', () => {
  test('io2 is always over-provisioned relative to the gp3 baseline', () => {
    expect(
      isDiskConfigOverProvisioned({
        storageType: DiskType.IO2,
        provisionedIOPS: 1500,
        throughput: undefined,
      })
    ).toBe(true)
  })

  test('gp3 at the 3000 IOPS / 125 MB/s baseline is not over-provisioned', () => {
    expect(
      isDiskConfigOverProvisioned({
        storageType: DiskType.GP3,
        provisionedIOPS: 3000,
        throughput: 125,
      })
    ).toBe(false)
  })

  test('gp3 with IOPS above the baseline is over-provisioned', () => {
    expect(
      isDiskConfigOverProvisioned({
        storageType: DiskType.GP3,
        provisionedIOPS: 8000,
        throughput: 125,
      })
    ).toBe(true)
  })

  test('gp3 with throughput above the baseline is over-provisioned', () => {
    expect(
      isDiskConfigOverProvisioned({
        storageType: DiskType.GP3,
        provisionedIOPS: 3000,
        throughput: 500,
      })
    ).toBe(true)
  })
})

describe('getDiskConfigEditability', () => {
  const base = {
    isHardBlocked: false,
    isComputeSizeGuardrailActive: false,
    isSpendCapEnabled: false,
    isDiskOverProvisioned: false,
  }

  test('no guardrail active — editable', () => {
    expect(getDiskConfigEditability(base)).toEqual({ status: 'editable' })
  })

  test('compute-size guardrail active, disk within bounds — locked', () => {
    expect(getDiskConfigEditability({ ...base, isComputeSizeGuardrailActive: true })).toEqual({
      status: 'locked',
      guardrails: ['computeSize'],
    })
  })

  test('compute-size guardrail active, disk over-provisioned — downsizeOnly', () => {
    expect(
      getDiskConfigEditability({
        ...base,
        isComputeSizeGuardrailActive: true,
        isDiskOverProvisioned: true,
      })
    ).toEqual({ status: 'downsizeOnly', guardrails: ['computeSize'] })
  })

  test('spend cap active, disk over-provisioned — downsizeOnly', () => {
    expect(
      getDiskConfigEditability({ ...base, isSpendCapEnabled: true, isDiskOverProvisioned: true })
    ).toEqual({ status: 'downsizeOnly', guardrails: ['spendCap'] })
  })

  test('both guardrails active, disk over-provisioned — downsizeOnly with both reasons', () => {
    expect(
      getDiskConfigEditability({
        ...base,
        isComputeSizeGuardrailActive: true,
        isSpendCapEnabled: true,
        isDiskOverProvisioned: true,
      })
    ).toEqual({ status: 'downsizeOnly', guardrails: ['computeSize', 'spendCap'] })
  })

  test('hard block wins even when the disk is over-provisioned — never a downsize carve-out', () => {
    expect(
      getDiskConfigEditability({
        ...base,
        isHardBlocked: true,
        isComputeSizeGuardrailActive: true,
        isDiskOverProvisioned: true,
      })
    ).toEqual({ status: 'locked', guardrails: ['computeSize'] })
  })

  test('hard block wins even with no guardrail active', () => {
    expect(getDiskConfigEditability({ ...base, isHardBlocked: true })).toEqual({
      status: 'locked',
      guardrails: [],
    })
  })
})

describe('CreateDiskStorageSchema with downsizeOnlyFrom', () => {
  const baseConfig = {
    storageType: DiskType.GP3,
    totalSize: 100,
    provisionedIOPS: 3000,
    throughput: 125,
    computeSize: 'ci_large' as const,
    growthPercent: null,
    minIncrementGb: null,
    maxSizeGb: null,
  }

  test('rejects an IOPS increase above the persisted ceiling', () => {
    const schema = CreateDiskStorageSchema({
      defaultTotalSize: 100,
      cloudProvider: 'AWS',
      isSpendCapEnabled: false,
      downsizeOnlyFrom: { storageType: DiskType.GP3, provisionedIOPS: 3000, throughput: 125 },
    })

    const result = schema.safeParse({ ...baseConfig, provisionedIOPS: 5000 })

    expect(result.success).toBe(false)
    if (result.success) return
    expect(result.error.issues).toContainEqual(
      expect.objectContaining({
        path: ['provisionedIOPS'],
        message: 'Maximum IOPS is 3,000 for your current configuration.',
      })
    )
  })

  test('accepts a reduced IOPS value', () => {
    const schema = CreateDiskStorageSchema({
      defaultTotalSize: 100,
      cloudProvider: 'AWS',
      isSpendCapEnabled: false,
      downsizeOnlyFrom: { storageType: DiskType.GP3, provisionedIOPS: 8000, throughput: 125 },
    })

    expect(schema.safeParse({ ...baseConfig, provisionedIOPS: 3000 }).success).toBe(true)
  })

  test('rejects switching to io2 when the persisted type was gp3', () => {
    const schema = CreateDiskStorageSchema({
      defaultTotalSize: 100,
      cloudProvider: 'AWS',
      isSpendCapEnabled: false,
      downsizeOnlyFrom: { storageType: DiskType.GP3, provisionedIOPS: 3000, throughput: 125 },
    })

    const result = schema.safeParse({
      ...baseConfig,
      storageType: DiskType.IO2,
      provisionedIOPS: 1500,
      throughput: undefined,
    })

    expect(result.success).toBe(false)
    if (result.success) return
    expect(result.error.issues).toContainEqual(
      expect.objectContaining({
        path: ['storageType'],
        message:
          'Switching to io2 is unsupported. Your project is over-provisioned for its size, and can only be downsized.',
      })
    )
  })

  test('accepts io2 with reduced IOPS when the persisted type was already io2', () => {
    const schema = CreateDiskStorageSchema({
      defaultTotalSize: 100,
      cloudProvider: 'AWS',
      isSpendCapEnabled: false,
      downsizeOnlyFrom: { storageType: DiskType.IO2, provisionedIOPS: 50_000 },
    })

    const result = schema.safeParse({
      ...baseConfig,
      storageType: DiskType.IO2,
      provisionedIOPS: 10_000,
      throughput: undefined,
    })

    expect(result.success).toBe(true)
  })

  test("io2@1500 moving to gp3 floors the IOPS ceiling at gp3's own 3000 minimum", () => {
    const schema = CreateDiskStorageSchema({
      defaultTotalSize: 100,
      cloudProvider: 'AWS',
      isSpendCapEnabled: false,
      downsizeOnlyFrom: { storageType: DiskType.IO2, provisionedIOPS: 1500 },
    })

    expect(schema.safeParse({ ...baseConfig, provisionedIOPS: 3000 }).success).toBe(true)

    const result = schema.safeParse({ ...baseConfig, provisionedIOPS: 3001 })
    expect(result.success).toBe(false)
    if (result.success) return
    expect(result.error.issues).toContainEqual(
      expect.objectContaining({
        path: ['provisionedIOPS'],
        message: 'Maximum IOPS is 3,000 for your current configuration.',
      })
    )
  })

  test('throughput is capped at the gp3 minimum when the persisted type was io2', () => {
    const schema = CreateDiskStorageSchema({
      defaultTotalSize: 100,
      cloudProvider: 'AWS',
      isSpendCapEnabled: false,
      downsizeOnlyFrom: { storageType: DiskType.IO2, provisionedIOPS: 1500 },
    })

    expect(schema.safeParse({ ...baseConfig, throughput: 125 }).success).toBe(true)

    const result = schema.safeParse({ ...baseConfig, throughput: 200 })
    expect(result.success).toBe(false)
    if (result.success) return
    expect(result.error.issues).toContainEqual(
      expect.objectContaining({
        path: ['throughput'],
        message: 'Maximum throughput is 125 MB/s for your current configuration.',
      })
    )
  })

  test('behaves like the schema without downsizeOnlyFrom when no guardrail is active', () => {
    const schema = CreateDiskStorageSchema({
      defaultTotalSize: 100,
      cloudProvider: 'AWS',
      isSpendCapEnabled: false,
    })

    expect(schema.safeParse({ ...baseConfig, provisionedIOPS: 10_000 }).success).toBe(true)
  })
})
