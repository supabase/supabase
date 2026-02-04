import { useParams } from 'common'
import {
  calculateIOPSPrice,
  calculateThroughputPrice,
} from 'components/interfaces/DiskManagement/DiskManagement.utils'
import {
  DISK_PRICING,
  DiskType,
} from 'components/interfaces/DiskManagement/ui/DiskManagement.constants'
import { useDiskAttributesQuery } from 'data/config/disk-attributes-query'
import { useProjectAddonsQuery } from 'data/subscriptions/project-addons-query'
import { formatCurrency } from 'lib/helpers'

export const useGetReplicaCost = () => {
  const { ref: projectRef } = useParams()
  const { data: addons } = useProjectAddonsQuery({ projectRef })
  const { data: diskConfiguration } = useDiskAttributesQuery({ projectRef })

  const currentComputeAddon = addons?.selected_addons.find(
    (addon) => addon.type === 'compute_instance'
  )?.variant.identifier
  const computeAddons =
    addons?.available_addons.find((addon) => addon.type === 'compute_instance')?.variants ?? []
  const selectedComputeMeta = computeAddons.find(
    (addon) => addon.identifier === currentComputeAddon
  )
  const estComputeMonthlyCost = Math.floor((selectedComputeMeta?.price ?? 0) * 730) // 730 hours in a month

  // @ts-ignore API types issue
  const { size_gb, type, throughput_mbps, iops } = diskConfiguration?.attributes ?? {}
  const readReplicaDiskSizes = (size_gb ?? 0) * 1.25
  const additionalCostDiskSize =
    readReplicaDiskSizes * (DISK_PRICING[type as DiskType]?.storage ?? 0)
  const additionalCostIOPS = calculateIOPSPrice({
    oldStorageType: type as DiskType,
    newStorageType: type as DiskType,
    oldProvisionedIOPS: 0,
    newProvisionedIOPS: iops ?? 0,
    numReplicas: 0,
  }).newPrice
  const additionalCostThroughput =
    type === 'gp3'
      ? calculateThroughputPrice({
          storageType: type as DiskType,
          newThroughput: throughput_mbps ?? 0,
          oldThroughput: 0,
          numReplicas: 0,
        }).newPrice
      : 0

  const totalCost = formatCurrency(
    estComputeMonthlyCost +
      additionalCostDiskSize +
      Number(additionalCostIOPS) +
      Number(additionalCostThroughput)
  )

  return {
    totalCost,
    compute: {
      label: selectedComputeMeta?.name,
      cost: formatCurrency(estComputeMonthlyCost),
      priceDescription: selectedComputeMeta?.price_description,
    },
    disk: {
      type,
      label: `${((size_gb ?? 0) * 1.25).toLocaleString()} GB (${type})`,
      cost: formatCurrency(additionalCostDiskSize),
    },
    iops: {
      label: `${iops?.toLocaleString()} IOPS`,
      cost: formatCurrency(+additionalCostIOPS),
    },
    throughput: {
      label: `${throughput_mbps?.toLocaleString()} MB/s`,
      cost: formatCurrency(+additionalCostThroughput),
    },
  }
}
