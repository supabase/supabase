import { useMemo } from 'react'
import { useFormState, useWatch, type UseFormReturn } from 'react-hook-form'

import { DiskStorageSchemaType } from '../DiskManagement.schema'
import { ComputeInstanceAddonVariantId } from '../DiskManagement.types'
import {
  calculateComputeSizePrice,
  calculateDiskSizePrice,
  calculateIOPSPrice,
  calculateThroughputPrice,
  getAvailableComputeOptions,
  mapAddOnVariantIdToComputeSize,
} from '../DiskManagement.utils'
import { DiskType } from '../ui/DiskManagement.constants'
import { useProjectAddonsQuery } from '@/data/subscriptions/project-addons-query'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import {
  useIsAwsNimbusCloudProvider,
  useSelectedProjectQuery,
} from '@/hooks/misc/useSelectedProject'

const COMPUTE_SIZES_BELOW_LARGE: Array<ComputeInstanceAddonVariantId> = [
  'ci_nano',
  'ci_micro',
  'ci_small',
  'ci_medium',
]

export function shouldShowComputeBillingBadge({
  isDirty,
  hasComputeSizeError,
  oldPrice,
  newPrice,
}: {
  isDirty: boolean
  hasComputeSizeError: boolean
  oldPrice: string | number
  newPrice: string | number
}) {
  return isDirty && !hasComputeSizeError && Number(oldPrice) !== Number(newPrice)
}

export function useDiskManagementReviewChanges(
  form: UseFormReturn<DiskStorageSchemaType>,
  numReplicas: number
) {
  const [
    computeSize,
    totalSize,
    storageType,
    provisionedIOPS,
    throughput,
    growthPercent,
    minIncrementGb,
    maxSizeGb,
  ] = useWatch({
    control: form.control,
    name: [
      'computeSize',
      'totalSize',
      'storageType',
      'provisionedIOPS',
      'throughput',
      'growthPercent',
      'minIncrementGb',
      'maxSizeGb',
    ],
  })
  const { isDirty, errors, defaultValues } = useFormState({ control: form.control })

  const { data: project } = useSelectedProjectQuery()
  const { data: org } = useSelectedOrganizationQuery()
  const isAwsNimbus = useIsAwsNimbusCloudProvider()
  const { data: addons } = useProjectAddonsQuery({ projectRef: project?.ref })

  const isAwsK8sProject = project?.cloud_provider === 'AWS_K8S'
  const planId = org?.plan.id ?? 'free'

  const availableAddons = useMemo(() => addons?.available_addons ?? [], [addons])
  const availableOptions = useMemo(
    () => getAvailableComputeOptions(availableAddons, project?.cloud_provider),
    [availableAddons, project?.cloud_provider]
  )

  // --- Prices ---

  const computeSizePrice = calculateComputeSizePrice({
    availableOptions,
    oldComputeSize: defaultValues?.computeSize || 'ci_micro',
    newComputeSize: computeSize,
    plan: planId,
  })
  const diskSizePrice = calculateDiskSizePrice({
    planId,
    oldSize: defaultValues?.totalSize || 0,
    oldStorageType: defaultValues?.storageType as DiskType,
    newSize: totalSize,
    newStorageType: storageType as DiskType,
    numReplicas,
  })
  const iopsPrice = calculateIOPSPrice({
    oldStorageType: defaultValues?.storageType as DiskType,
    oldProvisionedIOPS: defaultValues?.provisionedIOPS || 0,
    newStorageType: storageType as DiskType,
    newProvisionedIOPS: provisionedIOPS,
    numReplicas,
  })
  const throughputPrice = calculateThroughputPrice({
    storageType: storageType as DiskType,
    newThroughput: throughput || 0,
    oldThroughput: defaultValues?.throughput || 0,
    numReplicas,
  })

  const totalBeforePrice =
    Number(computeSizePrice.oldPrice) +
    Number(diskSizePrice.oldPrice) +
    Number(iopsPrice.oldPrice) +
    Number(throughputPrice.oldPrice)

  const totalAfterPrice =
    Number(computeSizePrice.newPrice) +
    Number(diskSizePrice.newPrice) +
    Number(iopsPrice.newPrice) +
    Number(throughputPrice.newPrice)

  const advancedBeforePrice = Number(iopsPrice.oldPrice) + Number(throughputPrice.oldPrice)
  const advancedAfterPrice = Number(iopsPrice.newPrice) + Number(throughputPrice.newPrice)

  const showComputeBillingBadge = shouldShowComputeBillingBadge({
    isDirty,
    hasComputeSizeError: !!errors.computeSize,
    oldPrice: computeSizePrice.oldPrice,
    newPrice: computeSizePrice.newPrice,
  })

  const showDiskBillingBadge =
    isDirty &&
    !errors.totalSize &&
    Number(diskSizePrice.oldPrice) !== Number(diskSizePrice.newPrice)

  const showAdvancedBillingBadge =
    isDirty &&
    advancedBeforePrice !== advancedAfterPrice &&
    !errors.provisionedIOPS &&
    !errors.throughput

  // --- Change flags ---

  const hasComputeChanges = defaultValues?.computeSize !== computeSize

  const hasTotalSizeChanges =
    !isAwsK8sProject && !isAwsNimbus && defaultValues?.totalSize !== totalSize

  const hasStorageTypeChanges =
    !isAwsK8sProject && !isAwsNimbus && defaultValues?.storageType !== storageType

  const hasThroughputChanges =
    !isAwsK8sProject && !isAwsNimbus && defaultValues?.throughput !== throughput

  const hasIOPSChanges =
    !isAwsK8sProject && !isAwsNimbus && defaultValues?.provisionedIOPS !== provisionedIOPS

  const hasGrowthPercentChanges =
    !isAwsK8sProject && !isAwsNimbus && defaultValues?.growthPercent !== growthPercent

  const hasMinIncrementChanges =
    !isAwsK8sProject && !isAwsNimbus && defaultValues?.minIncrementGb !== minIncrementGb

  const hasMaxSizeChanges =
    !isAwsK8sProject && !isAwsNimbus && defaultValues?.maxSizeGb !== maxSizeGb

  // --- Derived predicates ---

  const storageTypeAfter = storageType as DiskType

  // Show hero whenever any line-item price actually changes, not just compute
  const anyBillableDiskChange =
    Number(diskSizePrice.newPrice) !== Number(diskSizePrice.oldPrice) ||
    Number(iopsPrice.newPrice) !== Number(iopsPrice.oldPrice) ||
    Number(throughputPrice.newPrice) !== Number(throughputPrice.oldPrice)

  // Show cooldown warning whenever any disk attribute that counts toward the 24-hour modification limit changes
  const anyDiskAttributeChange = hasIOPSChanges || hasStorageTypeChanges || hasTotalSizeChanges

  // Show extended downtime warning when resizing to/from a size below large
  const hasExtendedDowntimeRisk =
    hasComputeChanges &&
    (COMPUTE_SIZES_BELOW_LARGE.includes(
      (defaultValues?.computeSize ?? 'ci_nano') as ComputeInstanceAddonVariantId
    ) ||
      COMPUTE_SIZES_BELOW_LARGE.includes(computeSize as ComputeInstanceAddonVariantId))

  // Throughput is only a user-configurable, separately-billed attribute for GP3. For IO2 it is
  // derived from provisioned IOPS (0.256 MiB/s per IOPS) and isn't surfaced as its own value, so
  // the form clears it to 0 — rendering a misleading "→ 0 MB/s". Only show the row when the
  // resulting storage type is GP3; any GP3→IO2 throughput price delta still lands in the total.
  const showThroughputRow =
    !isAwsK8sProject &&
    !isAwsNimbus &&
    storageTypeAfter === 'gp3' &&
    (hasThroughputChanges || hasStorageTypeChanges)

  const hasAnyBreakdownRows =
    hasComputeChanges ||
    hasStorageTypeChanges ||
    hasIOPSChanges ||
    showThroughputRow ||
    hasTotalSizeChanges ||
    hasGrowthPercentChanges ||
    hasMinIncrementChanges ||
    hasMaxSizeChanges

  // --- Labels ---

  const oldComputeLabel = mapAddOnVariantIdToComputeSize(defaultValues?.computeSize ?? 'ci_nano')
  const newComputeLabel = mapAddOnVariantIdToComputeSize(computeSize)

  return {
    // prices
    computeSizePrice,
    diskSizePrice,
    iopsPrice,
    throughputPrice,
    totalBeforePrice,
    totalAfterPrice,
    advancedBeforePrice,
    advancedAfterPrice,
    showComputeBillingBadge,
    showDiskBillingBadge,
    showAdvancedBillingBadge,
    // change flags
    hasComputeChanges,
    hasTotalSizeChanges,
    hasStorageTypeChanges,
    hasThroughputChanges,
    hasIOPSChanges,
    hasGrowthPercentChanges,
    hasMinIncrementChanges,
    hasMaxSizeChanges,
    // derived predicates
    anyBillableDiskChange,
    anyDiskAttributeChange,
    showThroughputRow,
    hasAnyBreakdownRows,
    hasExtendedDowntimeRisk,
    // labels
    oldComputeLabel,
    newComputeLabel,
  }
}
