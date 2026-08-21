import { zodResolver } from '@hookform/resolvers/zod'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { CloudProvider } from 'shared-data'
import { toast } from 'sonner'
import { Button, cn, Form } from 'ui'
import { PageContainer } from 'ui-patterns/PageContainer'
import {
  PageSection,
  PageSectionContent,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
} from 'ui-patterns/PageSection'

import { ComputeAndDiskUsageCharts } from './ComputeAndDiskUsageCharts'
import { CreateDiskStorageSchema, DiskStorageSchemaType } from './DiskManagement.schema'
import { DiskManagementMessage } from './DiskManagement.types'
import {
  calculateDiskSizeRequiredForIopsWithGp3,
  mapComputeSizeNameToAddonVariantId,
} from './DiskManagement.utils'
import { AdvancedSection, ComputeSection, DiskSection } from './DiskManagementForm.sections'
import { DiskMangementRestartRequiredSection } from './DiskManagementRestartRequiredSection'
import { DiskManagementReviewAndSubmitDialog } from './DiskManagementReviewAndSubmitDialog/DiskManagementReviewAndSubmitDialog'
import { useDiskManagementReviewChanges } from './DiskManagementReviewAndSubmitDialog/DiskManagementReviewAndSubmitDialog.hooks'
import { BillingChangeBadge } from './ui/BillingChangeBadge'
import {
  DISK_LIMITS,
  DiskType,
  PLAN_DETAILS,
  RESTRICTED_COMPUTE_FOR_THROUGHPUT_ON_GP3,
} from './ui/DiskManagement.constants'
import { NoticeBar } from './ui/NoticeBar'
import { PADDING_CLASSES } from '@/components/layouts/Scaffold'
import { UpgradeToPro } from '@/components/ui/UpgradeToPro'
import {
  useDiskAttributesQuery,
  useRemainingDurationForDiskAttributeUpdate,
} from '@/data/config/disk-attributes-query'
import { useUpdateDiskAttributesMutation } from '@/data/config/disk-attributes-update-mutation'
import { useDiskAutoscaleCustomConfigQuery } from '@/data/config/disk-autoscale-config-query'
import { useUpdateDiskAutoscaleConfigMutation } from '@/data/config/disk-autoscale-config-update-mutation'
import { useDiskUtilizationQuery } from '@/data/config/disk-utilization-query'
import { useSetProjectStatus } from '@/data/projects/project-detail-query'
import { useReadReplicasQuery } from '@/data/read-replicas/replicas-query'
import { useProjectAddonUpdateMutation } from '@/data/subscriptions/project-addon-update-mutation'
import { useProjectAddonsQuery } from '@/data/subscriptions/project-addons-query'
import { AddonVariantId } from '@/data/subscriptions/types'
import { useResourceWarningsQuery } from '@/data/usage/resource-warnings-query'
import { useCheckEntitlements } from '@/hooks/misc/useCheckEntitlements'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import {
  useIsAwsCloudProvider,
  useIsAwsK8sCloudProvider,
  useIsAwsNimbusCloudProvider,
  useSelectedProjectQuery,
} from '@/hooks/misc/useSelectedProject'
import { GB, PROJECT_STATUS } from '@/lib/constants'

export function DiskManagementForm({
  chartsClassName,
  overviewExtra,
  beforeScaling,
}: {
  chartsClassName?: string
  /** Rendered above usage charts in the overview block (for example topology). */
  overviewExtra?: ReactNode
  /** Rendered between overview and the Scaling section (for example read replicas). */
  beforeScaling?: ReactNode
} = {}) {
  const { ref: projectRef } = useParams()
  const { data: project, isPending: isProjectPending } = useSelectedProjectQuery()
  const { data: org } = useSelectedOrganizationQuery()
  const { setProjectStatus } = useSetProjectStatus()

  const autoscaleSettingsRef = useRef<HTMLDivElement>(null)
  const storageSettingsRef = useRef<HTMLDivElement>(null)
  const computeSettingsRef = useRef<HTMLDivElement>(null)
  const diskSizeSettingsRef = useRef<HTMLDivElement>(null)

  const isSpendCapEnabled = org?.plan.id !== 'free' && !org?.usage_billing_enabled

  const { data: resourceWarnings } = useResourceWarningsQuery({ ref: projectRef })
  // [Joshen Cleanup] JFYI this client side filtering can be cleaned up once BE changes are live which will only return the warnings based on the provided ref
  const projectResourceWarnings = (resourceWarnings ?? [])?.find(
    (warning) => warning.project === project?.ref
  )
  const isReadOnlyMode = projectResourceWarnings?.is_readonly_mode_enabled
  const isAws = useIsAwsCloudProvider()
  const isAwsK8s = useIsAwsK8sCloudProvider()
  const isAwsNimbus = useIsAwsNimbusCloudProvider()

  const { can: canUpdateDiskConfiguration, isSuccess: isPermissionsLoaded } =
    useAsyncCheckPermissions(PermissionAction.UPDATE, 'projects', {
      resource: {
        project_id: project?.id,
      },
    })

  const { hasAccess, isSuccess: isEntitlementsLoaded } = useCheckEntitlements(
    'instances.compute_update_available_sizes'
  )

  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false)
  const [refetchInterval, setRefetchInterval] = useState<number | false>(false)
  const [message, setMessageState] = useState<DiskManagementMessage | null>(null)

  const { data: databases, isSuccess: isReadReplicasSuccess } = useReadReplicasQuery({ projectRef })
  const { data, isSuccess: isDiskAttributesSuccess } = useDiskAttributesQuery(
    { projectRef },
    {
      refetchInterval,
      refetchOnWindowFocus: false,
      enabled: project != null && isAws,
    }
  )

  const { isSuccess: isAddonsSuccess } = useProjectAddonsQuery({ projectRef })
  const { isWithinCooldownWindow, isSuccess: isCooldownSuccess } =
    useRemainingDurationForDiskAttributeUpdate({
      projectRef,
      enabled: project != null && isAws,
    })
  const { data: diskUtil, isSuccess: isDiskUtilizationSuccess } = useDiskUtilizationQuery(
    {
      projectRef,
    },
    { enabled: project != null && isAws }
  )

  const { data: diskAutoscaleConfig, isSuccess: isDiskAutoscaleConfigSuccess } =
    useDiskAutoscaleCustomConfigQuery({ projectRef }, { enabled: project != null && isAws })

  const computeSize = project?.infra_compute_size
    ? mapComputeSizeNameToAddonVariantId(project?.infra_compute_size)
    : undefined

  // @ts-ignore
  const { type, iops, throughput_mbps, size_gb } = data?.attributes ?? { size_gb: 0, iops: 0 }
  const { growth_percent, max_size_gb, min_increment_gb } = diskAutoscaleConfig ?? {}
  const defaultValues = {
    storageType: type ?? DiskType.GP3,
    provisionedIOPS: iops,
    throughput: throughput_mbps,
    totalSize: size_gb,
    computeSize: computeSize ?? 'ci_micro',
    growthPercent: growth_percent,
    minIncrementGb: min_increment_gb,
    maxSizeGb: max_size_gb,
  }

  const form = useForm<DiskStorageSchemaType>({
    resolver: zodResolver(
      CreateDiskStorageSchema({
        defaultTotalSize: defaultValues.totalSize,
        cloudProvider: project?.cloud_provider as CloudProvider,
        isSpendCapEnabled,
      })
    ),
    defaultValues,
    mode: 'onBlur',
    reValidateMode: 'onChange',
  })

  const modifiedComputeSize = useWatch({ control: form.control, name: 'computeSize' })

  const isSuccess =
    isAddonsSuccess &&
    isDiskAttributesSuccess &&
    isDiskUtilizationSuccess &&
    isReadReplicasSuccess &&
    isDiskAutoscaleConfigSuccess &&
    isCooldownSuccess

  const isRequestingChanges = data?.requested_modification !== undefined
  const readReplicas = (databases ?? []).filter((db) => db.identifier !== projectRef)
  const isPlanUpgradeRequired = !hasAccess

  const {
    computeSizePrice,
    diskSizePrice,
    totalBeforePrice,
    totalAfterPrice,
    advancedBeforePrice,
    advancedAfterPrice,
    showComputeBillingBadge,
    showDiskBillingBadge,
    showAdvancedBillingBadge,
  } = useDiskManagementReviewChanges(form, readReplicas.length)

  const { formState } = form
  const errors = formState.errors
  const usedSize = Math.round(((diskUtil?.metrics.fs_used_bytes ?? 0) / GB) * 100) / 100
  const totalSize = formState.defaultValues?.totalSize || 0
  const usedPercentage = (usedSize / totalSize) * 100

  const disableIopsThroughputConfig =
    modifiedComputeSize &&
    !isSpendCapEnabled &&
    RESTRICTED_COMPUTE_FOR_THROUGHPUT_ON_GP3.includes(modifiedComputeSize)

  const watchedTotalSize = useWatch({ control: form.control, name: 'totalSize' }) ?? 0
  const watchedStorageType = useWatch({ control: form.control, name: 'storageType' })
  // Minimum disk size where the platform API will accept an IOPS payload (500 IOPS/GB rule).
  const minDiskSizeForCustomIops = calculateDiskSizeRequiredForIopsWithGp3(
    DISK_LIMITS[DiskType.GP3].minIops
  )
  // Suggested target when prompting a resize, sits above the floor so users
  // aren't pinned at the minimum between disk-config modifications.
  const suggestedDiskSizeForCustomIops = PLAN_DETAILS.pro.includedDiskGB.gp3
  const isDiskTooSmallForCustomIops =
    watchedStorageType === 'gp3' && watchedTotalSize < minDiskSizeForCustomIops

  const isBranch = project?.parent_project_ref !== undefined

  const disableDiskSizeInput =
    isRequestingChanges ||
    isPlanUpgradeRequired ||
    isWithinCooldownWindow ||
    !canUpdateDiskConfiguration ||
    !isAws

  const disableDiskInputs = disableDiskSizeInput || isSpendCapEnabled

  const disableComputeInputs = isPlanUpgradeRequired
  const isDirty = !!Object.keys(form.formState.dirtyFields).length
  const isProjectResizing = project?.status === PROJECT_STATUS.RESIZING
  const isProjectRequestingDiskChanges = isRequestingChanges && !isProjectResizing
  const noPermissions = isPermissionsLoaded && !canUpdateDiskConfiguration

  const isDiskNoticeVisible = !isProjectPending && !(isAws || isAwsNimbus)

  const { mutateAsync: updateDiskConfiguration, isPending: isUpdatingDisk } =
    useUpdateDiskAttributesMutation({
      // this is to suppress to toast message
      onError: () => {},
      onSuccess: () => setRefetchInterval(2000),
    })
  const { mutateAsync: updateSubscriptionAddon, isPending: isUpdatingCompute } =
    useProjectAddonUpdateMutation({
      // this is to suppress to toast message
      onError: () => {},
      onSuccess: () => {
        //Manually set project status to RESIZING, Project status should be RESIZING on next project status request.
        if (projectRef) setProjectStatus({ ref: projectRef, status: PROJECT_STATUS.RESIZING })
      },
    })
  const { mutateAsync: updateDiskAutoscaleConfig, isPending: isUpdatingDiskAutoscaleConfig } =
    useUpdateDiskAutoscaleConfigMutation({
      // this is to suppress to toast message
      onError: () => {},
    })

  const isUpdatingConfig = isUpdatingDisk || isUpdatingCompute || isUpdatingDiskAutoscaleConfig

  const onSubmit = async (data: DiskStorageSchemaType) => {
    let payload = data
    let willUpdateDiskConfiguration = false
    setMessageState(null)

    // [Joshen] Skip disk configuration related stuff for AWS Nimbus
    try {
      if (
        !isAwsK8s &&
        !isAwsNimbus &&
        (payload.storageType !== form.formState.defaultValues?.storageType ||
          payload.provisionedIOPS !== form.formState.defaultValues?.provisionedIOPS ||
          payload.throughput !== form.formState.defaultValues?.throughput ||
          payload.totalSize !== form.formState.defaultValues?.totalSize)
      ) {
        willUpdateDiskConfiguration = true

        await updateDiskConfiguration({
          ref: projectRef,
          provisionedIOPS: payload.provisionedIOPS!,
          storageType: payload.storageType,
          totalSize: payload.totalSize!,
          throughput: payload.throughput,
        })
      }

      if (
        !isAwsK8s &&
        !isAwsNimbus &&
        (payload.growthPercent !== form.formState.defaultValues?.growthPercent ||
          payload.minIncrementGb !== form.formState.defaultValues?.minIncrementGb ||
          payload.maxSizeGb !== form.formState.defaultValues?.maxSizeGb)
      ) {
        await updateDiskAutoscaleConfig({
          projectRef,
          growthPercent: payload.growthPercent,
          minIncrementGb: payload.minIncrementGb,
          maxSizeGb: payload.maxSizeGb,
        })
      }

      if (payload.computeSize !== form.formState.defaultValues?.computeSize) {
        await updateSubscriptionAddon({
          projectRef: projectRef,
          // cast variant to AddonVariantId to satisfy type
          variant: payload.computeSize as AddonVariantId,
          type: 'compute_instance',
          suppressToast: true,
        })
      }

      setIsDialogOpen(false)
      form.reset(data as DiskStorageSchemaType)
      // Disk resizes get their own completion toast once polling confirms it's applied
      if (!willUpdateDiskConfiguration) {
        toast.success('Successfully updated disk settings!')
      }
    } catch (error: unknown) {
      setMessageState({
        message: error instanceof Error ? error.message : 'An unknown error occurred',
        type: 'error',
      })
    }
  }

  useEffect(() => {
    if (!isDiskAttributesSuccess) return
    // @ts-ignore
    const { type, iops, throughput_mbps, size_gb } = data?.attributes ?? { size_gb: 0 }
    const formValues = {
      storageType: type,
      provisionedIOPS: iops,
      throughput: throughput_mbps,
      totalSize: size_gb,
      computeSize: form.getValues('computeSize'),
    }

    if (!('requested_modification' in data)) {
      if (refetchInterval !== false) {
        form.reset(formValues)
        setRefetchInterval(false)
        toast.success('Disk configuration changes have been successfully applied!')
      }
    } else {
      setRefetchInterval(2000)
    }
  }, [data, isDiskAttributesSuccess, form, refetchInterval])

  // We only support disk configurations for >=Large instances
  // If a customer downgrades back to <Large, we should reset the storage settings to avoid incurring unnecessary costs
  useEffect(() => {
    if (modifiedComputeSize && project?.infra_compute_size && isDialogOpen) {
      if (RESTRICTED_COMPUTE_FOR_THROUGHPUT_ON_GP3.includes(modifiedComputeSize)) {
        form.setValue('storageType', DiskType.GP3)
        form.setValue('throughput', DISK_LIMITS['gp3'].minThroughput)
        form.setValue('provisionedIOPS', DISK_LIMITS['gp3'].minIops)
      }
    }
  }, [modifiedComputeSize, form, isDialogOpen, project])

  useEffect(() => {
    // Initialize field values properly when data has been loaded, preserving any user changes
    if (isDiskAttributesSuccess || isSuccess) {
      form.reset(defaultValues, {})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccess, isDiskAttributesSuccess])

  useEffect(() => {
    const fieldErrors = Object.keys(errors)
    if (fieldErrors.length === 0) return

    const scrollTargets = [
      {
        hasError:
          fieldErrors.includes('maxSizeGb') ||
          fieldErrors.includes('growthPercent') ||
          fieldErrors.includes('minIncrementGb'),
        ref: autoscaleSettingsRef,
      },
      {
        hasError: fieldErrors.includes('throughput') || fieldErrors.includes('provisionedIOPS'),
        ref: storageSettingsRef,
      },
      { hasError: fieldErrors.includes('totalSize'), ref: diskSizeSettingsRef },
      { hasError: fieldErrors.includes('computeSize'), ref: computeSettingsRef },
    ]
    const scrollTarget = scrollTargets.find(({ hasError }) => hasError)?.ref ?? null

    if (!scrollTarget) return

    const timeoutId = setTimeout(() => {
      scrollTarget.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)

    return () => clearTimeout(timeoutId)
  }, [errors])

  return (
    <Form {...form}>
      <form id="disk-compute-form" onSubmit={form.handleSubmit(onSubmit)}>
        <PageContainer size="default" className="pb-16">
          <PageSection>
            <PageSectionContent className="flex flex-col gap-y-6">
              {overviewExtra}
              <ComputeAndDiskUsageCharts className={chartsClassName} />
            </PageSectionContent>
          </PageSection>

          {(isProjectResizing ||
            isProjectRequestingDiskChanges ||
            (isEntitlementsLoaded && !isPlanUpgradeRequired && noPermissions)) && (
            <div className="relative flex flex-col gap-10">
              <DiskMangementRestartRequiredSection
                visible={isProjectResizing}
                title="Your project will now automatically restart."
                description="Your project will be unavailable for up to 2 mins."
              />
              <NoticeBar
                type="default"
                visible={isProjectRequestingDiskChanges}
                title="Disk configuration changes have been requested"
                description="The requested changes will be applied to your disk shortly"
              />
              <NoticeBar
                type="default"
                visible={isEntitlementsLoaded && !isPlanUpgradeRequired && noPermissions}
                title="You do not have permission to update disk configuration"
                description="Please contact your organization administrator to update your disk configuration"
              />
            </div>
          )}

          {beforeScaling}

          <PageSection>
            <PageSectionMeta>
              <PageSectionSummary>
                <PageSectionTitle>Scaling</PageSectionTitle>
              </PageSectionSummary>
            </PageSectionMeta>
            {isEntitlementsLoaded && isPlanUpgradeRequired && (
              <UpgradeToPro
                featureProposition="configure compute and disk"
                primaryText="Only available on Pro Plan and above"
                secondaryText="Upgrade to the Pro Plan to configure compute and disk settings."
              />
            )}
            <PageSectionContent>
              <ComputeSection
                form={form}
                settingsRef={computeSettingsRef}
                showBillingBadge={showComputeBillingBadge}
                beforePrice={Number(computeSizePrice.oldPrice)}
                afterPrice={Number(computeSizePrice.newPrice)}
                disabled={disableComputeInputs}
              />

              <DiskSection
                form={form}
                settingsRef={diskSizeSettingsRef}
                showBillingBadge={showDiskBillingBadge}
                beforePrice={Number(diskSizePrice.oldPrice)}
                afterPrice={Number(diskSizePrice.newPrice)}
                isAws={isAws}
                isAwsK8s={isAwsK8s}
                isBranch={isBranch}
                isNoticeVisible={isDiskNoticeVisible}
                isReadOnlyMode={!!isReadOnlyMode}
                usedPercentage={usedPercentage}
                isWithinCooldownWindow={isWithinCooldownWindow}
                currentDiskSizeGb={defaultValues.totalSize}
                disableDiskSizeInput={disableDiskSizeInput}
              />

              {isAws && (
                <AdvancedSection
                  form={form}
                  autoscaleSettingsRef={autoscaleSettingsRef}
                  storageSettingsRef={storageSettingsRef}
                  showBillingBadge={showAdvancedBillingBadge}
                  beforePrice={advancedBeforePrice}
                  afterPrice={advancedAfterPrice}
                  disableIopsThroughputConfig={disableIopsThroughputConfig}
                  canUpdateDiskConfiguration={canUpdateDiskConfiguration}
                  isDiskTooSmallForCustomIops={isDiskTooSmallForCustomIops}
                  disableDiskInputs={disableDiskInputs}
                  disableDiskSizeInput={disableDiskSizeInput}
                  suggestedDiskSizeForCustomIops={suggestedDiskSizeForCustomIops}
                />
              )}
            </PageSectionContent>
          </PageSection>
        </PageContainer>

        <AnimatePresence>
          {isDirty ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.1, delay: 0.2 }}
              className="z-10 w-full left-0 right-0 sticky bottom-0 bg-surface-100 border-t h-16 items-center flex"
            >
              <div
                className={cn(
                  'mx-auto w-full max-w-[1200px]',
                  PADDING_CLASSES,
                  'flex items-center justify-end gap-3'
                )}
              >
                <BillingChangeBadge
                  show={isDirty}
                  beforePrice={totalBeforePrice}
                  afterPrice={totalAfterPrice}
                />
                <Button
                  variant="default"
                  onClick={() => form.reset()}
                  disabled={!isDirty}
                  size="medium"
                >
                  Cancel
                </Button>
                <DiskManagementReviewAndSubmitDialog
                  loading={isUpdatingConfig}
                  disabled={noPermissions}
                  form={form}
                  numReplicas={readReplicas.length}
                  isDialogOpen={isDialogOpen}
                  onSubmit={onSubmit}
                  setIsDialogOpen={setIsDialogOpen}
                  message={message}
                />
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </form>
    </Form>
  )
}
