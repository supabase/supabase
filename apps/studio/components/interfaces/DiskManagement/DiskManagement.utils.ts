import { ProjectDetail } from 'data/projects/project-detail-query'
import { PlanId, ProjectAddonVariantMeta } from 'data/subscriptions/types'
import { INSTANCE_MICRO_SPECS, INSTANCE_NANO_SPECS } from 'lib/constants'
import {
  ComputeInstanceAddonVariantId,
  ComputeInstanceSize,
  InfraInstanceSize,
} from './DiskManagement.types'
import {
  COMPUTE_BASELINE_IOPS,
  DISK_LIMITS,
  DISK_PRICING,
  DiskType,
  PLAN_DETAILS,
} from './ui/DiskManagement.constants'

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
  const { includedDiskGB } = PLAN_DETAILS?.[planId as keyof typeof PLAN_DETAILS]

  const oldPrice = Math.max(oldSize - includedDiskGB[oldStorageType], 0) * oldPricePerGB
  const oldPriceReplica = oldSize * 1.25 * oldPricePerGB
  const newPrice = Math.max(newSize - includedDiskGB[newStorageType], 0) * newPricePerGB
  const newPriceReplica = newSize * 1.25 * newPricePerGB

  return {
    oldPrice: (oldPrice + numReplicas * oldPriceReplica).toFixed(2),
    newPrice: (newPrice + numReplicas * newPriceReplica).toFixed(2),
  }
}

export const calculateComputeSizePrice = ({
  availableOptions,
  oldComputeSize,
  newComputeSize,
  plan,
}: {
  availableOptions: {
    identifier: string
    price: number
  }[]
  oldComputeSize: string
  newComputeSize: string
  plan: PlanId
}) => {
  let _oldComputeSize = oldComputeSize

  if (plan !== 'free' && oldComputeSize === 'ci_nano') {
    /**
     * override the old compute size to micro if the plan is not free
     * this is to handle the case in which nano compute is a paid entity
     */
    _oldComputeSize = 'ci_micro'
  }

  const oldPrice = availableOptions?.find((x) => x.identifier === _oldComputeSize)?.price ?? 0
  const newPrice = availableOptions?.find((x) => x.identifier === newComputeSize)?.price ?? 0

  const oldPriceMonthly = oldPrice * 720
  const newPriceMonthly = newPrice * 720

  return {
    oldPrice: oldPriceMonthly.toFixed(2),
    newPrice: newPriceMonthly.toFixed(2),
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

export function getAvailableComputeOptions(availableAddons: any[], projectCloudProvider?: string) {
  const computeOptions =
    availableAddons
      .find((addon) => addon.type === 'compute_instance')
      ?.variants.filter((option: { [key: string]: any }) => {
        if (!projectCloudProvider) {
          return true
        }

        const meta = option.meta as ProjectAddonVariantMeta

        return (
          !meta.supported_cloud_providers ||
          meta.supported_cloud_providers.includes(projectCloudProvider)
        )
      }) ?? []

  function hasMicroOptionFromApi() {
    return (
      availableAddons.find((addon) => addon.type === 'compute_instance')?.variants ?? []
    ).some((variant: any) => variant.identifier === 'ci_micro')
  }

  // Backwards comp until API is deployed
  if (!hasMicroOptionFromApi) {
    // Unshift to push to start of array
    computeOptions.unshift({
      identifier: 'ci_micro',
      name: 'Micro',
      price_description: '$0.01344/hour (~$10/month)',
      price: 0.01344,
      price_interval: 'hourly',
      price_type: 'usage',
      meta: {
        cpu_cores: INSTANCE_MICRO_SPECS.cpu_cores,
        cpu_dedicated: INSTANCE_MICRO_SPECS.cpu_dedicated,
        memory_gb: INSTANCE_MICRO_SPECS.memory_gb,
        baseline_disk_io_mbs: INSTANCE_MICRO_SPECS.baseline_disk_io_mbs,
        max_disk_io_mbs: INSTANCE_MICRO_SPECS.max_disk_io_mbs,
        connections_direct: INSTANCE_MICRO_SPECS.connections_direct,
        connections_pooler: INSTANCE_MICRO_SPECS.connections_pooler,
      } as ProjectAddonVariantMeta,
    })
  }

  computeOptions.unshift({
    identifier: 'ci_nano',
    name: 'Nano',
    price_description: '$0/hour (~$0/month)',
    price: 0,
    price_interval: 'hourly',
    price_type: 'usage',
    // @ts-ignore API types it as Record<string, never>
    meta: {
      cpu_cores: INSTANCE_NANO_SPECS.cpu_cores,
      cpu_dedicated: INSTANCE_NANO_SPECS.cpu_dedicated,
      memory_gb: INSTANCE_NANO_SPECS.memory_gb,
      baseline_disk_io_mbs: INSTANCE_NANO_SPECS.baseline_disk_io_mbs,
      max_disk_io_mbs: INSTANCE_NANO_SPECS.max_disk_io_mbs,
      connections_direct: INSTANCE_NANO_SPECS.connections_direct,
      connections_pooler: INSTANCE_NANO_SPECS.connections_pooler,
    } as ProjectAddonVariantMeta,
  })

  return computeOptions
}

export const calculateMaxIopsAllowedForDiskSizeWithGp3 = (totalSize: number) => {
  return Math.min(3000 * totalSize, 16000)
}

export const calculateDiskSizeRequiredForIopsWithGp3 = (iops: number) => {
  return Math.max(1, Math.ceil(iops / 500))
}

export const calculateMaxIopsAllowedForDiskSizeWithio2 = (totalSize: number) => {
  return Math.min(500 * totalSize, 256000)
}

export const calculateDiskSizeRequiredForIopsWithIo2 = (iops: number) => {
  return Math.max(4, Math.ceil(iops / 1000))
}

export const calculateMaxThroughput = (iops: number) => {
  return Math.min(0.256 * iops, 1000)
}

export const calculateIopsRequiredForThroughput = (throughput: number) => {
  return Math.max(125, Math.ceil(throughput / 0.256))
}

export const calculateMaxIopsAllowedForComputeSize = (computeSize: string): number => {
  return COMPUTE_BASELINE_IOPS[computeSize as keyof typeof COMPUTE_BASELINE_IOPS] || 0
}

export const calculateComputeSizeRequiredForIops = (
  iops: number
): ComputeInstanceAddonVariantId | undefined => {
  const computeSizes = Object.entries(COMPUTE_BASELINE_IOPS).sort((a, b) => a[1] - b[1])
  for (const [size, baselineIops] of computeSizes) {
    if (iops <= baselineIops) {
      return size as ComputeInstanceAddonVariantId
    }
  }

  // fallback to largest compute size - this should never happen though :-/
  return computeSizes[computeSizes.length - 1][0] as ComputeInstanceAddonVariantId
}

export const calculateDiskSizeRequiredForIops = (provisionedIOPS: number): number | undefined => {
  if (!provisionedIOPS) {
    console.error('IOPS is required')
    return undefined
  }

  if (isNaN(provisionedIOPS) || provisionedIOPS < 0) {
    console.error('IOPS must be a non-negative number')
    return undefined
  }

  if (provisionedIOPS > 256000) {
    console.error('Maximum allowed IOPS is 256000')
    return undefined
  }

  return Math.max(1, Math.ceil(provisionedIOPS / 1000))
}

export const formatComputeName = (compute: string) => {
  return compute.toUpperCase().replace('CI_', '')
}

export const mapComputeSizeNameToAddonVariantId = (
  computeSize: ProjectDetail['infra_compute_size']
): ComputeInstanceAddonVariantId => {
  return {
    nano: 'ci_nano',
    micro: 'ci_micro',
    small: 'ci_small',
    medium: 'ci_medium',
    large: 'ci_large',
    xlarge: 'ci_xlarge',
    '2xlarge': 'ci_2xlarge',
    '4xlarge': 'ci_4xlarge',
    '8xlarge': 'ci_8xlarge',
    '12xlarge': 'ci_12xlarge',
    '16xlarge': 'ci_16xlarge',
  }[computeSize ?? 'nano'] as ComputeInstanceAddonVariantId
}

export const mapAddOnVariantIdToComputeSize = (
  addonVariantId: ComputeInstanceAddonVariantId = 'ci_nano'
): ComputeInstanceSize => {
  return {
    ci_nano: 'Nano',
    ci_micro: 'Micro',
    ci_small: 'Small',
    ci_medium: 'Medium',
    ci_large: 'Large',
    ci_xlarge: 'XL',
    ci_2xlarge: '2XL',
    ci_4xlarge: '4XL',
    ci_8xlarge: '8XL',
    ci_12xlarge: '12XL',
    ci_16xlarge: '16XL',
  }[addonVariantId] as ComputeInstanceSize
}

export const formatNumber = (num: number): string => {
  return num.toLocaleString('en-US')
}

export const showMicroUpgrade = (plan: PlanId, infraComputeSize: InfraInstanceSize): boolean => {
  return plan !== 'free' && infraComputeSize === 'nano'
}
