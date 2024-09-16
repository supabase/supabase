import { PlanType } from 'data/subscriptions/org-subscription-query'
import { AddonVariantId } from 'data/subscriptions/types'

export enum DiskType {
  GP3 = 'gp3',
  IO2 = 'io2',
}

export const DISK_PRICING = {
  [DiskType.GP3]: {
    storage: 0.125, // per GiB per month
    iops: 0.024, // per IOPS per month, charged after 3000 IOPS
    throughput: 0.095, // per MB/s per month, charged after 125 MB/s
  },
  [DiskType.IO2]: {
    storage: 0.195, // per GiB per month
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
    maxStorage: 16384,
    minIops: 100,
    maxIops: 256000,
  },
}

export const DISK_TYPE_LABELS = {
  [DiskType.GP3]: 'General Purpose SSD (gp3)',
  [DiskType.IO2]: 'Provisioned IOPS SSD (io2)',
}

interface PlanDetails {
  includedDiskGB: { gp3: number; io2: number }
}

export const PLAN_DETAILS: Record<PlanType, PlanDetails> = {
  free: { includedDiskGB: { gp3: 1, io2: 0 } },
  pro: { includedDiskGB: { gp3: 8, io2: 0 } },
  team: { includedDiskGB: { gp3: 8, io2: 0 } },
  enterprise: { includedDiskGB: { gp3: 8, io2: 0 } },
}

export const COMPUTE_SIZE_MAX_IOPS = {
  ci_micro: 11800,
  ci_small: 11800,
  ci_medium: 11800,
  ci_large: 4750,
  ci_xlarge: 20000,
  ci_2xlarge: 20000,
  ci_4xlarge: 20000,
  ci_8xlarge: 40000,
  ci_12xlarge: 50000,
  ci_16xlarge: 80000,
}

export const COMPUTE_SIZE_MAX_THROUGHPUT = {
  ci_micro: 2085,
  ci_small: 2085,
  ci_medium: 2085,
  ci_large: 4750,
  ci_xlarge: 4750,
  ci_2xlarge: 4750,
  ci_4xlarge: 4750,
  ci_8xlarge: 9500,
  ci_12xlarge: 14250,
  ci_16xlarge: 19000,
}
