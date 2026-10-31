import type { ComputeDiskKey, ComputeDiskLimit } from './compute-disk-limits'

/**
 * Disk limits per database instance configuration, keyed by the identifier the
 * platform reports for a database. Unlike the size-wide floors in
 * `compute-disk-limits.ts` (the minimum across every configuration a compute
 * size can run on), these are the exact limits of one configuration, so Studio
 * can validate and display what a project actually supports.
 *
 * Values come from the AWS EBS-optimized performance tables
 * (https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ebs-optimized.html,
 * mirroring `aws ec2 describe-instance-types`). Throughput is stored in MB/s,
 * rounded to the nearest integer (AWS lists exact decimals).
 * Last verified: 2026-10-23.
 *
 * Keep this table in sync when new configurations are added to the fleet;
 * unknown identifiers fall back to the size-wide floors.
 */

export type InstanceDiskLimits = Omit<ComputeDiskLimit, 'name'>

type InstanceDiskLimitsEntry = InstanceDiskLimits & {
  /** Compute size the configuration belongs to; the per-size floors in `compute-disk-limits.ts` are derived from it */
  size: ComputeDiskKey
}

const limits = (
  size: ComputeDiskKey,
  baselineIops: number,
  maxIops: number,
  baselineThroughputMBps: number,
  maxThroughputMBps: number
): InstanceDiskLimitsEntry => ({
  size,
  baselineIops,
  maxIops,
  baselineThroughputMBps,
  maxThroughputMBps,
})

export const INSTANCE_DISK_LIMITS: Record<string, InstanceDiskLimitsEntry> = {
  't4g.nano': limits('ci_nano', 250, 11_800, 5, 261),
  't4g.micro': limits('ci_micro', 500, 11_800, 11, 261),
  't4g.small': limits('ci_small', 1_000, 11_800, 22, 261),
  't4g.medium': limits('ci_medium', 2_000, 11_800, 43, 261),
  't3a.nano': limits('ci_nano', 250, 11_800, 6, 261),
  't3a.micro': limits('ci_micro', 500, 11_800, 11, 261),
  't3a.small': limits('ci_small', 1_000, 11_800, 22, 261),
  't3a.medium': limits('ci_medium', 2_000, 11_800, 44, 261),
  't3.nano': limits('ci_nano', 250, 11_800, 5, 261),
  't3.micro': limits('ci_micro', 500, 11_800, 11, 261),
  't3.small': limits('ci_small', 1_000, 11_800, 22, 261),
  't3.medium': limits('ci_medium', 2_000, 11_800, 43, 261),
  'm6g.medium': limits('ci_medium', 2_500, 20_000, 39, 594),
  'm7g.medium': limits('ci_medium', 2_500, 40_000, 39, 1_250),
  'm8g.medium': limits('ci_medium', 2_500, 40_000, 39, 1_250),
  'm9g.medium': limits('ci_medium', 2_500, 48_000, 48, 1_500),
  'c6g.medium': limits('ci_medium', 2_500, 20_000, 39, 594),
  'm6g.large': limits('ci_large', 3_600, 20_000, 79, 594),
  'm6g.xlarge': limits('ci_xlarge', 6_000, 20_000, 149, 594),
  'm6g.2xlarge': limits('ci_2xlarge', 12_000, 20_000, 297, 594),
  'm6g.4xlarge': limits('ci_4xlarge', 20_000, 20_000, 594, 594),
  'm6g.8xlarge': limits('ci_8xlarge', 40_000, 40_000, 1_188, 1_188),
  'm6g.12xlarge': limits('ci_12xlarge', 50_000, 50_000, 1_781, 1_781),
  'm6g.16xlarge': limits('ci_16xlarge', 80_000, 80_000, 2_375, 2_375),
  'm6a.large': limits('ci_large', 3_600, 40_000, 81, 1_250),
  'm6a.xlarge': limits('ci_xlarge', 6_000, 40_000, 156, 1_250),
  'm6a.2xlarge': limits('ci_2xlarge', 12_000, 40_000, 313, 1_250),
  'm6a.4xlarge': limits('ci_4xlarge', 20_000, 40_000, 625, 1_250),
  'm6a.8xlarge': limits('ci_8xlarge', 40_000, 40_000, 1_250, 1_250),
  'm6a.12xlarge': limits('ci_12xlarge', 60_000, 60_000, 1_875, 1_875),
  'm6a.16xlarge': limits('ci_16xlarge', 80_000, 80_000, 2_500, 2_500),
  'm6i.large': limits('ci_large', 3_600, 40_000, 81, 1_250),
  'm6i.xlarge': limits('ci_xlarge', 6_000, 40_000, 156, 1_250),
  'm6i.2xlarge': limits('ci_2xlarge', 12_000, 40_000, 313, 1_250),
  'm6i.4xlarge': limits('ci_4xlarge', 20_000, 40_000, 625, 1_250),
  'm6i.8xlarge': limits('ci_8xlarge', 40_000, 40_000, 1_250, 1_250),
  'm6i.12xlarge': limits('ci_12xlarge', 60_000, 60_000, 1_875, 1_875),
  'm6i.16xlarge': limits('ci_16xlarge', 80_000, 80_000, 2_500, 2_500),
  'm7i.large': limits('ci_large', 3_600, 40_000, 81, 1_250),
  'm7i.xlarge': limits('ci_xlarge', 6_000, 40_000, 156, 1_250),
  'm7i.2xlarge': limits('ci_2xlarge', 12_000, 40_000, 313, 1_250),
  'm7i.4xlarge': limits('ci_4xlarge', 20_000, 40_000, 625, 1_250),
  'm7i.8xlarge': limits('ci_8xlarge', 40_000, 40_000, 1_250, 1_250),
  'm7i.12xlarge': limits('ci_12xlarge', 60_000, 60_000, 1_875, 1_875),
  'm7i.16xlarge': limits('ci_16xlarge', 80_000, 80_000, 2_500, 2_500),
  'm8i.large': limits('ci_large', 3_600, 40_000, 81, 1_250),
  'm8i.xlarge': limits('ci_xlarge', 6_000, 40_000, 156, 1_250),
  'm8i.2xlarge': limits('ci_2xlarge', 12_000, 40_000, 313, 1_250),
  'm8i.4xlarge': limits('ci_4xlarge', 20_000, 40_000, 625, 1_250),
  'm8i.8xlarge': limits('ci_8xlarge', 40_000, 40_000, 1_250, 1_250),
  'm8i.12xlarge': limits('ci_12xlarge', 60_000, 60_000, 1_875, 1_875),
  'm8i.16xlarge': limits('ci_16xlarge', 80_000, 80_000, 2_500, 2_500),
  'm7a.large': limits('ci_large', 3_600, 40_000, 81, 1_250),
  'm7a.xlarge': limits('ci_xlarge', 6_000, 40_000, 156, 1_250),
  'm7a.2xlarge': limits('ci_2xlarge', 12_000, 40_000, 313, 1_250),
  'm7a.4xlarge': limits('ci_4xlarge', 20_000, 40_000, 625, 1_250),
  'm7a.8xlarge': limits('ci_8xlarge', 40_000, 40_000, 1_250, 1_250),
  'm7a.12xlarge': limits('ci_12xlarge', 60_000, 60_000, 1_875, 1_875),
  'm7a.16xlarge': limits('ci_16xlarge', 80_000, 80_000, 2_500, 2_500),
  'm8a.large': limits('ci_large', 3_600, 40_000, 81, 1_250),
  'm8a.xlarge': limits('ci_xlarge', 6_000, 40_000, 156, 1_250),
  'm8a.2xlarge': limits('ci_2xlarge', 12_000, 40_000, 313, 1_250),
  'm8a.4xlarge': limits('ci_4xlarge', 20_000, 40_000, 625, 1_250),
  'm8a.8xlarge': limits('ci_8xlarge', 40_000, 40_000, 1_250, 1_250),
  'm8a.12xlarge': limits('ci_12xlarge', 60_000, 60_000, 1_875, 1_875),
  'm8a.16xlarge': limits('ci_16xlarge', 80_000, 80_000, 2_500, 2_500),
  'm8g.24xlarge': limits('ci_24xlarge', 120_000, 120_000, 3_750, 3_750),
  'm8g.48xlarge': limits('ci_48xlarge', 240_000, 240_000, 5_000, 5_000),
  'c8g.24xlarge': limits('ci_24xlarge_optimized_cpu', 120_000, 120_000, 3_750, 3_750),
  'c8g.48xlarge': limits('ci_48xlarge_optimized_cpu', 240_000, 240_000, 5_000, 5_000),
  'r8g.24xlarge': limits('ci_24xlarge_optimized_memory', 120_000, 120_000, 3_750, 3_750),
  'r8g.48xlarge': limits('ci_48xlarge_optimized_memory', 240_000, 240_000, 5_000, 5_000),
  'x8g.24xlarge': limits('ci_24xlarge_high_memory', 120_000, 120_000, 3_750, 3_750),
  'x8g.48xlarge': limits('ci_48xlarge_high_memory', 240_000, 240_000, 5_000, 5_000),
}

export const getInstanceDiskLimits = (
  instanceType: string | null | undefined
): InstanceDiskLimits | undefined => (instanceType ? INSTANCE_DISK_LIMITS[instanceType] : undefined)

/** Disk IO draws on a burst pool only when the baseline sits below the maximum */
export const hasBurstableDiskIO = (limits: InstanceDiskLimits | undefined): boolean =>
  limits !== undefined && limits.baselineIops < limits.maxIops
