import { PlanId } from 'data/subscriptions/types'

// Disk Storage expands automatically when the database reaches 90% of the disk size
export const AUTOSCALING_THRESHOLD = 0.9

export enum DiskType {
  GP3 = 'gp3',
  IO2 = 'io2',
}

// [Joshen] As per https://github.com/supabase/platform/pull/20478
export const DISK_AUTOSCALE_CONFIG_DEFAULTS = {
  growthPercent: 50,
  minIncrementSize: 4,
  maxSizeGb: 60000,
}

export const DISK_PRICING = {
  [DiskType.GP3]: {
    storage: 0.125, // per GB per month
    iops: 0.024, // per IOPS per month, charged after 3000 IOPS
    throughput: 0.095, // per MB/s per month, charged after 125 MB/s
  },
  [DiskType.IO2]: {
    storage: 0.195, // per GB per month
    iops: 0.119, // per IOPS per month
  },
}

export const DISK_LIMITS = {
  [DiskType.GP3]: {
    minStorage: 1,
    maxStorage: 16384,
    minIops: 3000,
    maxIops: 16000,
    minThroughput: 125,
    maxThroughput: 1000,
    includedIops: 3000,
    includedThroughput: 125,
  },
  [DiskType.IO2]: {
    minStorage: 4,
    maxStorage: 61440,
    minIops: 1500,
    maxIops: 256000,
    includedIops: 0,
    includedThroughput: 0,
  },
}

interface PlanDetails {
  includedDiskGB: { gp3: number; io2: number }
}

export const PLAN_DETAILS: Record<PlanId, PlanDetails> = {
  free: { includedDiskGB: { gp3: 1, io2: 0 } },
  pro: { includedDiskGB: { gp3: 8, io2: 0 } },
  team: { includedDiskGB: { gp3: 8, io2: 0 } },
  enterprise: { includedDiskGB: { gp3: 8, io2: 0 } },
  platform: { includedDiskGB: { gp3: 8, io2: 0 } },
}

export const RESTRICTED_COMPUTE_FOR_IOPS_ON_GP3 = ['ci_nano', 'ci_micro', 'ci_small', 'ci_medium']

export const RESTRICTED_COMPUTE_FOR_THROUGHPUT_ON_GP3 = [
  'ci_nano',
  'ci_micro',
  'ci_small',
  'ci_medium',
]

export const DISK_TYPE_OPTIONS = [
  {
    type: 'gp3',
    name: 'General Purpose SSD',
    description: 'Balance between price and performance',
  },
  {
    type: 'io2',
    name: 'High Performance SSD',
    description: 'High performance for mission critical applications',
  },
]
