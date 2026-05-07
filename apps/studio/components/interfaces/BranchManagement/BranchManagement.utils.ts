import { DiskAttributesData } from 'data/config/disk-attributes-query'
import { DesiredInstanceSize, instanceSizeSpecs } from 'data/projects/new-project.constants'
import {
  DISK_LIMITS,
  DISK_PRICING,
  DiskType,
  PLAN_DETAILS,
} from '../DiskManagement/ui/DiskManagement.constants'

// Ref: https://supabase.com/docs/guides/platform/compute-and-disk
const maxDiskForCompute = new Map([
  [10, instanceSizeSpecs.micro],
  [50, instanceSizeSpecs.small],
  [100, instanceSizeSpecs.medium],
  [200, instanceSizeSpecs.large],
  [500, instanceSizeSpecs.xlarge],
  [1_000, instanceSizeSpecs['2xlarge']],
  [2_000, instanceSizeSpecs['4xlarge']],
  [4_000, instanceSizeSpecs['8xlarge']],
  [6_000, instanceSizeSpecs['12xlarge']],
  [10_000, instanceSizeSpecs['16xlarge']],
])

export const estimateComputeSize = (
  projectDiskSize: number,
  branchComputeSize?: DesiredInstanceSize
) => {
  if (branchComputeSize) {
    return instanceSizeSpecs[branchComputeSize]
  }
  // Fallback to estimating based on volume size
  for (const [disk, compute] of maxDiskForCompute) {
    if (projectDiskSize <= disk) {
      return compute
    }
  }
  return instanceSizeSpecs['24xlarge']
}

export const estimateDiskCost = (disk: DiskAttributesData['attributes']) => {
  const diskType = disk.type as DiskType

  const pricing = DISK_PRICING[diskType]
  const includedGB = PLAN_DETAILS['pro'].includedDiskGB[diskType]
  const priceSize = Math.max(disk.size_gb - includedGB, 0) * pricing.storage
  const includedIOPS = DISK_LIMITS[diskType].includedIops
  const priceIOPS = Math.max(disk.iops - includedIOPS, 0) * pricing.iops

  const priceThroughput =
    diskType === DiskType.GP3 && 'throughput_mbps' in disk
      ? Math.max(disk.throughput_mbps - DISK_LIMITS[DiskType.GP3].includedThroughput, 0) *
        DISK_PRICING[DiskType.GP3].throughput
      : 0

  return {
    total: priceSize + priceIOPS + priceThroughput,
    size: priceSize,
    iops: priceIOPS,
    throughput: priceThroughput,
  }
}

export const estimateRestoreTime = (disk: DiskAttributesData['attributes']) => {
  // This is interpolated from real restore time
  return (720 / 21000) * disk.size_gb + 3
}
