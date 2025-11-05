import { InfraInstanceSize } from 'components/interfaces/DiskManagement/DiskManagement.types'
import {
  calculateComputeSizePrice,
  calculateDiskSizePrice,
} from 'components/interfaces/DiskManagement/DiskManagement.utils'
import { DiskType } from 'components/interfaces/DiskManagement/ui/DiskManagement.constants'
import { instanceSizeSpecs } from 'data/projects/new-project.constants'
import { PlanId } from 'data/subscriptions/types'

/**
 * @description
 *  Calculates the monthly price for a new project based on the target volume size and compute size
 *
 * @param targetVolumeSizeGb - The target volume size in GB
 * @param targetComputeSize - The target compute size
 * @returns The disk price and compute price for the new project
 */

export type NewProjectPrice = {
  diskPrice: number
  computePrice: number
}
export function projectSpecToMonthlyPrice({
  targetVolumeSizeGb,
  targetComputeSize,
  planId,
  storageType,
}: {
  targetVolumeSizeGb: number
  targetComputeSize: InfraInstanceSize
  planId: PlanId
  storageType: DiskType
}): NewProjectPrice {
  const diskPrice = calculateDiskSizePrice({
    planId,
    oldSize: 0,
    oldStorageType: storageType,
    newSize: targetVolumeSizeGb,
    newStorageType: storageType,
    numReplicas: 0,
  })

  const computePrice = calculateComputeSizePrice({
    availableOptions: [
      { identifier: targetComputeSize, price: getComputeHourlyPrice(targetComputeSize) },
    ],
    oldComputeSize: 'nano', // not used for r2np
    newComputeSize: targetComputeSize,
    plan: planId,
  })

  return {
    diskPrice: Number(diskPrice.newPrice) || 0,
    computePrice: Number(computePrice.newPrice) || 0,
  }
}

function getComputeHourlyPrice(computeSize: InfraInstanceSize): number {
  if (computeSize === 'pico' || computeSize === 'nano') {
    return 0
  }

  return instanceSizeSpecs[computeSize]?.priceHourly
}
