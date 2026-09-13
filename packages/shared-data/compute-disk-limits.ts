import { z } from 'zod'

/**
 * [Jordi] Use instances.vantage.sh as source of truth for compute disk limits.
 * Eg: https://instances.vantage.sh/aws/ec2/t4g.nano?currency=USD
 *
 * All compute from medium down are t4g and the bigger ones are m6g.
 *
 * Throughput values are stored in MB/s (AWS lists Mbps, so we convert with toMBps).
 */

export type ComputeDiskLimit = {
  name: string
  baselineIops: number
  maxIops: number
  baselineThroughputMBps: number
  maxThroughputMBps: number
}

const toMBps = (throughputMbps: number) => Math.round(throughputMbps / 8)

export const COMPUTE_DISK = {
  ci_nano: {
    name: 'Nano (free)',
    baselineIops: 250,
    maxIops: 11800,
    baselineThroughputMBps: toMBps(43),
    maxThroughputMBps: toMBps(2085),
  },
  ci_micro: {
    name: 'Micro',
    baselineIops: 500,
    maxIops: 11800,
    baselineThroughputMBps: toMBps(87),
    maxThroughputMBps: toMBps(2085),
  },
  ci_small: {
    name: 'Small',
    baselineIops: 1000,
    maxIops: 11800,
    baselineThroughputMBps: toMBps(174),
    maxThroughputMBps: toMBps(2085),
  },
  ci_medium: {
    name: 'Medium',
    baselineIops: 2000,
    maxIops: 11800,
    baselineThroughputMBps: toMBps(347),
    maxThroughputMBps: toMBps(2085),
  },
  ci_large: {
    name: 'Large',
    baselineIops: 3600,
    maxIops: 20000,
    baselineThroughputMBps: toMBps(630),
    maxThroughputMBps: toMBps(4750),
  },
  ci_xlarge: {
    name: 'XL',
    baselineIops: 6000,
    maxIops: 20000,
    baselineThroughputMBps: toMBps(1188),
    maxThroughputMBps: toMBps(4750),
  },
  ci_2xlarge: {
    name: '2XL',
    baselineIops: 12000,
    maxIops: 20000,
    baselineThroughputMBps: toMBps(2375),
    maxThroughputMBps: toMBps(4750),
  },
  ci_4xlarge: {
    name: '4XL',
    baselineIops: 20000,
    maxIops: 20000,
    baselineThroughputMBps: toMBps(4750),
    maxThroughputMBps: toMBps(4750),
  },
  ci_8xlarge: {
    name: '8XL',
    baselineIops: 40000,
    maxIops: 40000,
    baselineThroughputMBps: toMBps(9500),
    maxThroughputMBps: toMBps(9500),
  },
  ci_12xlarge: {
    name: '12XL',
    baselineIops: 50000,
    maxIops: 50000,
    baselineThroughputMBps: toMBps(14250),
    maxThroughputMBps: toMBps(14250),
  },
  ci_16xlarge: {
    name: '16XL',
    baselineIops: 80000,
    maxIops: 80000,
    baselineThroughputMBps: toMBps(19000),
    maxThroughputMBps: toMBps(19000),
  },
  ci_24xlarge: {
    name: '24XL',
    baselineIops: 120000,
    maxIops: 120000,
    baselineThroughputMBps: toMBps(30000),
    maxThroughputMBps: toMBps(30000),
  },
  ci_24xlarge_optimized_cpu: {
    name: '24XL - Optimized CPU',
    baselineIops: 120000,
    maxIops: 120000,
    baselineThroughputMBps: toMBps(30000),
    maxThroughputMBps: toMBps(30000),
  },
  ci_24xlarge_optimized_memory: {
    name: '24XL - Optimized Memory',
    baselineIops: 120000,
    maxIops: 120000,
    baselineThroughputMBps: toMBps(30000),
    maxThroughputMBps: toMBps(30000),
  },
  ci_24xlarge_high_memory: {
    name: '24XL - High Memory',
    baselineIops: 120000,
    maxIops: 120000,
    baselineThroughputMBps: toMBps(30000),
    maxThroughputMBps: toMBps(30000),
  },
  ci_48xlarge: {
    name: '48XL',
    baselineIops: 240000,
    maxIops: 240000,
    baselineThroughputMBps: toMBps(40000),
    maxThroughputMBps: toMBps(40000),
  },
  ci_48xlarge_optimized_cpu: {
    name: '48XL - Optimized CPU',
    baselineIops: 240000,
    maxIops: 240000,
    baselineThroughputMBps: toMBps(40000),
    maxThroughputMBps: toMBps(40000),
  },
  ci_48xlarge_optimized_memory: {
    name: '48XL - Optimized Memory',
    baselineIops: 240000,
    maxIops: 240000,
    baselineThroughputMBps: toMBps(40000),
    maxThroughputMBps: toMBps(40000),
  },
  ci_48xlarge_high_memory: {
    name: '48XL - High Memory',
    baselineIops: 240000,
    maxIops: 240000,
    baselineThroughputMBps: toMBps(40000),
    maxThroughputMBps: toMBps(40000),
  },
} as const satisfies Record<string, ComputeDiskLimit>

export type ComputeDiskKey = keyof typeof COMPUTE_DISK

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

const computeInstanceAddonVariantIds = Object.keys(COMPUTE_DISK) as ComputeDiskKey[]

export const computeInstanceAddonVariantIdSchema = z.enum(
  computeInstanceAddonVariantIds as [ComputeDiskKey, ...ComputeDiskKey[]]
)
