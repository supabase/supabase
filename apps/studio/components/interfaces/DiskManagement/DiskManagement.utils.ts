import { DISK_LIMITS, DISK_PRICING, DiskType, PLAN_DETAILS } from './DiskManagement.constants'

// Included disk size only applies to primary, not replicas
export const calculateDiskSizePrice = ({
  planId,
  oldSize,
  oldStorageType,
  newSize,
  newStorageType,
  numReplicas = 0,
}: {
  planId: string
  oldSize: number
  oldStorageType: DiskType
  newSize: number
  newStorageType: DiskType
  numReplicas?: number
}) => {
  const oldPricePerGB = DISK_PRICING[oldStorageType]?.storage ?? 0
  const newPricePerGB = DISK_PRICING[newStorageType]?.storage ?? 0
  const { includedDiskGB } = PLAN_DETAILS?.[planId as keyof typeof PLAN_DETAILS] ?? {}

  const oldPrice = Math.max(oldSize - includedDiskGB[oldStorageType], 0) * oldPricePerGB
  const oldPriceReplica = oldSize * 1.25 * oldPricePerGB
  const newPrice = Math.max(newSize - includedDiskGB[newStorageType], 0) * newPricePerGB
  const newPriceReplica = newSize * 1.25 * newPricePerGB

  return {
    oldPrice: (oldPrice + numReplicas * oldPriceReplica).toFixed(2),
    newPrice: (newPrice + numReplicas * newPriceReplica).toFixed(2),
  }
}

// Included IOPS applies to both primary and replicas
export const calculateIOPSPrice = ({
  oldStorageType,
  oldProvisionedIOPS,
  newStorageType,
  newProvisionedIOPS,
  numReplicas = 0,
}: {
  oldStorageType: DiskType
  oldProvisionedIOPS: number
  newStorageType: DiskType
  newProvisionedIOPS: number
  numReplicas?: number
}) => {
  if (newStorageType === DiskType.GP3) {
    const oldChargeableIOPS = Math.max(
      0,
      oldProvisionedIOPS - DISK_LIMITS[DiskType.GP3].includedIops
    )
    const newChargeableIOPS = Math.max(
      0,
      newProvisionedIOPS - DISK_LIMITS[DiskType.GP3].includedIops
    )
    const oldPrice = oldChargeableIOPS * DISK_PRICING[oldStorageType]?.iops ?? 0

    const newPrice = newChargeableIOPS * DISK_PRICING[newStorageType]?.iops ?? 0

    return {
      oldPrice: (oldPrice * (1 + numReplicas)).toFixed(2),
      newPrice: (newPrice * (1 + numReplicas)).toFixed(2),
    }
  } else {
    const oldPrice =
      oldStorageType === 'gp3'
        ? (oldProvisionedIOPS - DISK_LIMITS[oldStorageType].includedIops) *
          DISK_PRICING[oldStorageType].iops
        : oldProvisionedIOPS * DISK_PRICING[oldStorageType]?.iops ?? 0
    const newPrice = newProvisionedIOPS * DISK_PRICING[newStorageType]?.iops ?? 0
    return {
      oldPrice: (oldPrice * (1 + numReplicas)).toFixed(2),
      newPrice: (newPrice * (1 + numReplicas)).toFixed(2),
    }
  }
}

// This is only applicable for GP3 storage type, no need to consider IO2 at all
// Also assumes that disk size is > 400 GB (separate requirement to update throughput)
// Also, included throughput applies to both primary and replicas
export const calculateThroughputPrice = ({
  storageType,
  newThroughput,
  oldThroughput,
  numReplicas = 0,
}: {
  storageType: DiskType
  newThroughput: number
  oldThroughput: number
  numReplicas?: number
}) => {
  if (storageType === DiskType.GP3 && newThroughput) {
    const oldChargeableThroughput = Math.max(
      0,
      oldThroughput - DISK_LIMITS[DiskType.GP3].includedThroughput
    )
    const newChargeableThroughput = Math.max(
      0,
      newThroughput - DISK_LIMITS[DiskType.GP3].includedThroughput
    )
    const oldPrice = oldChargeableThroughput * DISK_PRICING[DiskType.GP3].throughput
    const newPrice = newChargeableThroughput * DISK_PRICING[DiskType.GP3].throughput

    return {
      oldPrice: (oldPrice * (1 + numReplicas)).toFixed(2),
      newPrice: (newPrice * (1 + numReplicas)).toFixed(2),
    }
  }
  return { oldPrice: '0.00', newPrice: '0.00' }
}
