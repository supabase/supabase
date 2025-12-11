import { z } from 'zod'

/**
 * [Jordi] Use instances.vantage.sh as source of truth for compute disk limits.
 * Eg: https://instances.vantage.sh/aws/ec2/t4g.nano?currency=USD
 *
 * All compute from medium down are t4g and the bigger ones are m6g
 */

export type ComputeDiskLimit = {
  baselineIops: number
  maxIops: number
  baselineThroughputMBps: number
  maxThroughputMBps: number
}

const toMBps = (throughputMbps: number) => Math.round(throughputMbps / 8)

export const COMPUTE_DISK_LIMITS: Record<string, ComputeDiskLimit> = {
  ci_nano: {
    baselineIops: 250,
    maxIops: 11800,
    baselineThroughputMBps: toMBps(43),
    maxThroughputMBps: toMBps(2085),
  },
  ci_micro: {
    baselineIops: 500,
    maxIops: 11800,
    baselineThroughputMBps: toMBps(87),
    maxThroughputMBps: toMBps(2085),
  },
  ci_small: {
    baselineIops: 1000,
    maxIops: 11800,
    baselineThroughputMBps: toMBps(174),
    maxThroughputMBps: toMBps(2085),
  },
  ci_medium: {
    baselineIops: 2000,
    maxIops: 11800,
    baselineThroughputMBps: toMBps(347),
    maxThroughputMBps: toMBps(2085),
  },
  ci_large: {
    baselineIops: 3600,
    maxIops: 20000,
    baselineThroughputMBps: toMBps(630),
    maxThroughputMBps: toMBps(4750),
  },
  ci_xlarge: {
    baselineIops: 6000,
    maxIops: 20000,
    baselineThroughputMBps: toMBps(1188),
    maxThroughputMBps: toMBps(4750),
  },
  ci_2xlarge: {
    baselineIops: 12000,
    maxIops: 20000,
    baselineThroughputMBps: toMBps(2375),
    maxThroughputMBps: toMBps(4750),
  },
  ci_4xlarge: {
    baselineIops: 20000,
    maxIops: 20000,
    baselineThroughputMBps: toMBps(4750),
    maxThroughputMBps: toMBps(4750),
  },
  ci_8xlarge: {
    baselineIops: 40000,
    maxIops: 40000,
    baselineThroughputMBps: toMBps(9500),
    maxThroughputMBps: toMBps(9500),
  },
  ci_12xlarge: {
    baselineIops: 50000,
    maxIops: 50000,
    baselineThroughputMBps: toMBps(14250),
    maxThroughputMBps: toMBps(14250),
  },
  ci_16xlarge: {
    baselineIops: 80000,
    maxIops: 80000,
    baselineThroughputMBps: toMBps(19000),
    maxThroughputMBps: toMBps(19000),
  },
  ci_24xlarge: {
    baselineIops: 120000,
    maxIops: 120000,
    baselineThroughputMBps: toMBps(30000),
    maxThroughputMBps: toMBps(30000),
  },
  ci_24xlarge_optimized_cpu: {
    baselineIops: 120000,
    maxIops: 120000,
    baselineThroughputMBps: toMBps(30000),
    maxThroughputMBps: toMBps(30000),
  },
  ci_24xlarge_optimized_memory: {
    baselineIops: 120000,
    maxIops: 120000,
    baselineThroughputMBps: toMBps(30000),
    maxThroughputMBps: toMBps(30000),
  },
  ci_24xlarge_high_memory: {
    baselineIops: 120000,
    maxIops: 120000,
    baselineThroughputMBps: toMBps(30000),
    maxThroughputMBps: toMBps(30000),
  },
  ci_48xlarge: {
    baselineIops: 240000,
    maxIops: 240000,
    baselineThroughputMBps: toMBps(40000),
    maxThroughputMBps: toMBps(40000),
  },
  ci_48xlarge_optimized_cpu: {
    baselineIops: 240000,
    maxIops: 240000,
    baselineThroughputMBps: toMBps(40000),
    maxThroughputMBps: toMBps(40000),
  },
  ci_48xlarge_optimized_memory: {
    baselineIops: 240000,
    maxIops: 240000,
    baselineThroughputMBps: toMBps(40000),
    maxThroughputMBps: toMBps(40000),
  },
  ci_48xlarge_high_memory: {
    baselineIops: 240000,
    maxIops: 240000,
    baselineThroughputMBps: toMBps(40000),
    maxThroughputMBps: toMBps(40000),
  },
}

export const COMPUTE_BASELINE_IOPS = Object.fromEntries(
  Object.entries(COMPUTE_DISK_LIMITS).map(([key, value]) => [key, value.baselineIops])
)

export const COMPUTE_MAX_IOPS = Object.fromEntries(
  Object.entries(COMPUTE_DISK_LIMITS).map(([key, value]) => [key, value.maxIops])
)

export const COMPUTE_BASELINE_THROUGHPUT = Object.fromEntries(
  Object.entries(COMPUTE_DISK_LIMITS).map(([key, value]) => [key, value.baselineThroughputMBps])
)

export const COMPUTE_MAX_THROUGHPUT = Object.fromEntries(
  Object.entries(COMPUTE_DISK_LIMITS).map(([key, value]) => [key, value.maxThroughputMBps])
)

export const computeInstanceAddonVariantIdSchema = z.enum([
  'ci_nano',
  'ci_micro',
  'ci_small',
  'ci_medium',
  'ci_large',
  'ci_xlarge',
  'ci_2xlarge',
  'ci_4xlarge',
  'ci_8xlarge',
  'ci_12xlarge',
  'ci_16xlarge',
  'ci_24xlarge',
  'ci_24xlarge_optimized_cpu',
  'ci_24xlarge_optimized_memory',
  'ci_24xlarge_high_memory',
  'ci_48xlarge',
  'ci_48xlarge_optimized_cpu',
  'ci_48xlarge_optimized_memory',
  'ci_48xlarge_high_memory',
])
