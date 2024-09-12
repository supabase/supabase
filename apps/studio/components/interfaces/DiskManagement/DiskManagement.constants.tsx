import { PlanType } from 'data/subscriptions/org-subscription-query'

export enum DiskType {
  GP3 = 'gp3',
  IO2 = 'io2',
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
  includedDiskGB: number
}

export const PLAN_DETAILS: Record<PlanType, PlanDetails> = {
  free: { includedDiskGB: 1 },
  pro: { includedDiskGB: 8 },
  team: { includedDiskGB: 8 },
  enterprise: { includedDiskGB: 8 },
}
