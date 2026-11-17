import { z } from 'zod'

import { INSTANCE_DISK_LIMITS } from './instance-disk-limits'

/**
 * Size-wide floor values for disk limits, derived per compute size as the
 * minimum across all configurations the size can run on (see
 * `instance-disk-limits.ts`, the single source for the underlying numbers).
 * Every project gets at least these limits; the actual limits of a given
 * project can be higher.
 *
 * These floors are published in the docs and on www — a change to the
 * configuration table that moves a floor changes public numbers, which is why
 * the derived values are pinned in `DiskManagement.test.ts`.
 */

export type ComputeDiskLimit = {
  name: string
  baselineIops: number
  maxIops: number
  baselineThroughputMBps: number
  maxThroughputMBps: number
}

const COMPUTE_SIZE_NAMES = {
  ci_nano: 'Nano (free)',
  ci_micro: 'Micro',
  ci_small: 'Small',
  ci_medium: 'Medium',
  ci_large: 'Large',
  ci_xlarge: 'XL',
  ci_2xlarge: '2XL',
  ci_4xlarge: '4XL',
  ci_8xlarge: '8XL',
  ci_12xlarge: '12XL',
  ci_16xlarge: '16XL',
  ci_24xlarge: '24XL',
  ci_24xlarge_optimized_cpu: '24XL - Optimized CPU',
  ci_24xlarge_optimized_memory: '24XL - Optimized Memory',
  ci_24xlarge_high_memory: '24XL - High Memory',
  ci_48xlarge: '48XL',
  ci_48xlarge_optimized_cpu: '48XL - Optimized CPU',
  ci_48xlarge_optimized_memory: '48XL - Optimized Memory',
  ci_48xlarge_high_memory: '48XL - High Memory',
} as const

export type ComputeDiskKey = keyof typeof COMPUTE_SIZE_NAMES

export const COMPUTE_DISK = Object.fromEntries(
  Object.entries(COMPUTE_SIZE_NAMES).map(([key, name]) => {
    const configurations = Object.values(INSTANCE_DISK_LIMITS).filter((entry) => entry.size === key)
    if (configurations.length === 0) {
      throw new Error(`No instance configurations found for compute size ${key}`)
    }
    return [
      key,
      {
        name,
        baselineIops: Math.min(...configurations.map((c) => c.baselineIops)),
        maxIops: Math.min(...configurations.map((c) => c.maxIops)),
        baselineThroughputMBps: Math.min(...configurations.map((c) => c.baselineThroughputMBps)),
        maxThroughputMBps: Math.min(...configurations.map((c) => c.maxThroughputMBps)),
      },
    ]
  })
) as Record<ComputeDiskKey, ComputeDiskLimit>

export const COMPUTE_BASELINE_IOPS = Object.fromEntries(
  Object.entries(COMPUTE_DISK).map(([key, value]) => [key, value.baselineIops])
)

export const COMPUTE_MAX_IOPS = Object.fromEntries(
  Object.entries(COMPUTE_DISK).map(([key, value]) => [key, value.maxIops])
)

export const COMPUTE_BASELINE_THROUGHPUT = Object.fromEntries(
  Object.entries(COMPUTE_DISK).map(([key, value]) => [key, value.baselineThroughputMBps])
)

export const COMPUTE_MAX_THROUGHPUT = Object.fromEntries(
  Object.entries(COMPUTE_DISK).map(([key, value]) => [key, value.maxThroughputMBps])
)

const computeInstanceAddonVariantIds = Object.keys(COMPUTE_SIZE_NAMES) as ComputeDiskKey[]

export const computeInstanceAddonVariantIdSchema = z.enum(
  computeInstanceAddonVariantIds as [ComputeDiskKey, ...ComputeDiskKey[]]
)
