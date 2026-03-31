import { ProjectDetail } from 'data/projects/project-detail-query'
import { PlanId, ProjectAddonVariantMeta } from 'data/subscriptions/types'
import { INSTANCE_MICRO_SPECS, INSTANCE_NANO_SPECS } from 'lib/constants'
import {
  COMPUTE_BASELINE_IOPS,
  COMPUTE_MAX_IOPS,
  computeInstanceAddonVariantIdSchema,
} from 'shared-data'

import {
  ComputeInstanceAddonVariantId,
  ComputeInstanceSize,
  InfraInstanceSize,
} from './DiskManagement.types'
import { DISK_LIMITS, DISK_PRICING, DiskType, PLAN_DETAILS } from './ui/DiskManagement.constants'

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
    const oldPrice = oldChargeableIOPS * (DISK_PRICING[oldStorageType]?.iops ?? 0)
    const newPrice = newChargeableIOPS * (DISK_PRICING[newStorageType]?.iops ?? 0)

    return {
      oldPrice: (oldPrice * (1 + numReplicas)).toFixed(2),
      newPrice: (newPrice * (1 + numReplicas)).toFixed(2),
    }
  } else {
    const oldPrice =
      oldStorageType === 'gp3'
        ? (oldProvisionedIOPS - DISK_LIMITS[oldStorageType].includedIops) *
          DISK_PRICING[oldStorageType].iops
        : oldProvisionedIOPS * (DISK_PRICING[oldStorageType]?.iops ?? 0)
    const newPrice = newProvisionedIOPS * (DISK_PRICING[newStorageType]?.iops ?? 0)
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

export type ComputeAddonVariant = {
  identifier: ComputeInstanceAddonVariantId
  name: string
  price_description: string
  price: number
  price_interval: 'hourly' | 'monthly'
  price_type: string
  meta?: ProjectAddonVariantMeta
}

type AvailableAddon = {
  type: string
  variants: Array<{
    identifier: string
    name: string
    price_description: string
    price: number
    price_interval: 'hourly' | 'monthly'
    price_type: string
    meta?: unknown
  }>
}

const isProjectAddonVariantMeta = (meta: unknown): meta is ProjectAddonVariantMeta => {
  if (typeof meta !== 'object' || meta === null) return false

  const obj = meta as Record<string, unknown>

  // Validate supported_cloud_providers is an array if present (used at line 200)
  if ('supported_cloud_providers' in obj && !Array.isArray(obj.supported_cloud_providers)) {
    return false
  }

  // Check for at least one expected property to ensure it's likely a real ProjectAddonVariantMeta
  const hasExpectedProperty =
    'cpu_cores' in obj ||
    'memory_gb' in obj ||
    'cpu_dedicated' in obj ||
    'baseline_disk_io_mbs' in obj ||
    'max_disk_io_mbs' in obj ||
    'connections_direct' in obj ||
    'connections_pooler' in obj ||
    'backup_duration_days' in obj ||
    'supported_cloud_providers' in obj

  return hasExpectedProperty
}

export function getAvailableComputeOptions(
  availableAddons: AvailableAddon[],
  projectCloudProvider?: string
) {
  const computeAddon = availableAddons.find((addon) => addon.type === 'compute_instance')
  const computeOptions: ComputeAddonVariant[] =
    computeAddon?.variants.flatMap((option) => {
      const parsedId = computeInstanceAddonVariantIdSchema.safeParse(option.identifier)
      if (!parsedId.success) return []

      if (projectCloudProvider && isProjectAddonVariantMeta(option.meta)) {
        const isSupported =
          !option.meta.supported_cloud_providers ||
          option.meta.supported_cloud_providers.includes(projectCloudProvider)
        if (!isSupported) return []
      }

      return [
        {
          ...option,
          identifier: parsedId.data,
          meta: isProjectAddonVariantMeta(option.meta) ? option.meta : undefined,
        },
      ]
    }) ?? []

  function hasMicroOptionFromApi() {
    return (computeAddon?.variants ?? []).some((variant) => variant.identifier === 'ci_micro')
  }

  // Backwards comp until API is deployed
  if (!hasMicroOptionFromApi()) {
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

export const calculateBaselineIopsForComputeSize = (computeSize: string): number => {
  const parsed = computeInstanceAddonVariantIdSchema.safeParse(computeSize)
  if (!parsed.success) return 0
  return COMPUTE_BASELINE_IOPS[parsed.data] ?? 0
}

export const calculateMaxIopsForComputeSize = (computeSize: string): number => {
  const parsed = computeInstanceAddonVariantIdSchema.safeParse(computeSize)
  if (!parsed.success) return 0
  return COMPUTE_MAX_IOPS[parsed.data] ?? 0
}

export const calculateComputeSizeRequiredForIops = (
  iops: number
): ComputeInstanceAddonVariantId | undefined => {
  type ComputeSizeMax = { size: ComputeInstanceAddonVariantId; maxIops: number }

  const computeSizes: ComputeSizeMax[] = Object.entries(COMPUTE_MAX_IOPS)
    .map((entry) => {
      const [size, maxIops] = entry
      const parsedSize = computeInstanceAddonVariantIdSchema.safeParse(size)
      if (!parsedSize.success) return undefined
      return { size: parsedSize.data, maxIops: Number(maxIops) }
    })
    .filter((value): value is ComputeSizeMax => value !== undefined)
    .sort((a, b) => a.maxIops - b.maxIops)

  for (const { size, maxIops } of computeSizes) {
    if (iops <= maxIops) {
      return size
    }
  }

  const fallbackSize = computeSizes[computeSizes.length - 1]?.size
  if (!fallbackSize) return undefined
  return fallbackSize
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

const infraToAddonVariant: Record<InfraInstanceSize, ComputeInstanceAddonVariantId> = {
  pico: 'ci_nano',
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
  '24xlarge': 'ci_24xlarge',
  '24xlarge_optimized_memory': 'ci_24xlarge_optimized_memory',
  '24xlarge_optimized_cpu': 'ci_24xlarge_optimized_cpu',
  '24xlarge_high_memory': 'ci_24xlarge_high_memory',
  '48xlarge': 'ci_48xlarge',
  '48xlarge_optimized_memory': 'ci_48xlarge_optimized_memory',
  '48xlarge_optimized_cpu': 'ci_48xlarge_optimized_cpu',
  '48xlarge_high_memory': 'ci_48xlarge_high_memory',
}

const isInfraInstanceSize = (value: string): value is InfraInstanceSize =>
  Object.prototype.hasOwnProperty.call(infraToAddonVariant, value)

export const mapComputeSizeNameToAddonVariantId = (
  computeSize: ProjectDetail['infra_compute_size']
): ComputeInstanceAddonVariantId => {
  const fallback: InfraInstanceSize = 'nano'
  const matchedSize = computeSize && isInfraInstanceSize(computeSize) ? computeSize : undefined
  const sizeKey = matchedSize ?? fallback
  return infraToAddonVariant[sizeKey]
}

const addonVariantToComputeSize: Record<ComputeInstanceAddonVariantId, ComputeInstanceSize> = {
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
  ci_24xlarge: '24XL',
  ci_24xlarge_optimized_memory: '24XL - Optimized Memory',
  ci_24xlarge_optimized_cpu: '24XL - Optimized CPU',
  ci_24xlarge_high_memory: '24XL - High Memory',
  ci_48xlarge: '48XL',
  ci_48xlarge_optimized_memory: '48XL - Optimized Memory',
  ci_48xlarge_optimized_cpu: '48XL - Optimized CPU',
  ci_48xlarge_high_memory: '48XL - High Memory',
}

export const mapAddOnVariantIdToComputeSize = (
  addonVariantId: ComputeInstanceAddonVariantId = 'ci_nano'
): ComputeInstanceSize => {
  const parsed = computeInstanceAddonVariantIdSchema.safeParse(addonVariantId)
  if (!parsed.success) return addonVariantToComputeSize.ci_nano
  return addonVariantToComputeSize[parsed.data]
}

export const formatNumber = (num: number): string => {
  return num.toLocaleString('en-US')
}

export const showMicroUpgrade = (plan: PlanId, infraComputeSize: InfraInstanceSize): boolean => {
  return plan !== 'free' && infraComputeSize === 'nano'
}
