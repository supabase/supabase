import { useMemo } from 'react'
import { UseFormReturn } from 'react-hook-form'

import { DiskStorageSchemaType } from '../DiskManagement.schema'
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

export function useDiskManagementReviewChanges(
  form: UseFormReturn<DiskStorageSchemaType>,
  numReplicas: number
) {
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
    oldComputeSize: form.formState.defaultValues?.computeSize || 'ci_micro',
    newComputeSize: form.getValues('computeSize'),
    plan: planId,
  })
  const diskSizePrice = calculateDiskSizePrice({
    planId,
    oldSize: form.formState.defaultValues?.totalSize || 0,
    oldStorageType: form.formState.defaultValues?.storageType as DiskType,
    newSize: form.getValues('totalSize'),
    newStorageType: form.getValues('storageType') as DiskType,
    numReplicas,
  })
  const iopsPrice = calculateIOPSPrice({
    oldStorageType: form.formState.defaultValues?.storageType as DiskType,
    oldProvisionedIOPS: form.formState.defaultValues?.provisionedIOPS || 0,
    newStorageType: form.getValues('storageType') as DiskType,
    newProvisionedIOPS: form.getValues('provisionedIOPS'),
    numReplicas,
  })
  const throughputPrice = calculateThroughputPrice({
    storageType: form.getValues('storageType') as DiskType,
    newThroughput: form.getValues('throughput') || 0,
    oldThroughput: form.formState.defaultValues?.throughput || 0,
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

  // --- Change flags ---

  const hasComputeChanges =
    form.formState.defaultValues?.computeSize !== form.getValues('computeSize')

  const hasTotalSizeChanges =
    !isAwsK8sProject &&
    !isAwsNimbus &&
    form.formState.defaultValues?.totalSize !== form.getValues('totalSize')

  const hasStorageTypeChanges =
    !isAwsK8sProject &&
    !isAwsNimbus &&
    form.formState.defaultValues?.storageType !== form.getValues('storageType')

  const hasThroughputChanges =
    !isAwsK8sProject &&
    !isAwsNimbus &&
    form.formState.defaultValues?.throughput !== form.getValues('throughput')

  const hasIOPSChanges =
    !isAwsK8sProject &&
    !isAwsNimbus &&
    form.formState.defaultValues?.provisionedIOPS !== form.getValues('provisionedIOPS')

  const hasGrowthPercentChanges =
    !isAwsK8sProject &&
    !isAwsNimbus &&
    form.formState.defaultValues?.growthPercent !== form.getValues('growthPercent')

  const hasMinIncrementChanges =
    !isAwsK8sProject &&
    !isAwsNimbus &&
    form.formState.defaultValues?.minIncrementGb !== form.getValues('minIncrementGb')

  const hasMaxSizeChanges =
    !isAwsK8sProject &&
    !isAwsNimbus &&
    form.formState.defaultValues?.maxSizeGb !== form.getValues('maxSizeGb')

  // --- Derived predicates ---

  const storageTypeBefore = (form.formState.defaultValues?.storageType ?? '') as DiskType
  const storageTypeAfter = form.getValues('storageType') as DiskType

  // Show hero whenever any line-item price actually changes, not just compute
  const anyBillableDiskChange =
    Number(diskSizePrice.newPrice) !== Number(diskSizePrice.oldPrice) ||
    Number(iopsPrice.newPrice) !== Number(iopsPrice.oldPrice) ||
    Number(throughputPrice.newPrice) !== Number(throughputPrice.oldPrice)

  // Show cooldown warning whenever any disk attribute that enforces the 4-hour lock changes
  const anyDiskAttributeChange = hasIOPSChanges || hasStorageTypeChanges || hasTotalSizeChanges

  // Show throughput row whenever either the before or after storage type is GP3
  // (covers GP3→IO2 where the throughput charge drops to zero)
  const showThroughputRow =
    !isAwsK8sProject &&
    !isAwsNimbus &&
    (storageTypeBefore === 'gp3' || storageTypeAfter === 'gp3') &&
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

  const oldComputeLabel = mapAddOnVariantIdToComputeSize(
    form.formState.defaultValues?.computeSize ?? 'ci_nano'
  )
  const newComputeLabel = mapAddOnVariantIdToComputeSize(form.getValues('computeSize'))

  return {
    // prices
    computeSizePrice,
    diskSizePrice,
    iopsPrice,
    throughputPrice,
    totalBeforePrice,
    totalAfterPrice,
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
    // labels
    oldComputeLabel,
    newComputeLabel,
  }
}
