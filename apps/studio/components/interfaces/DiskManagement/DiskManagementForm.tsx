import { zodResolver } from '@hookform/resolvers/zod'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import { MAX_WIDTH_CLASSES, PADDING_CLASSES, ScaffoldContainer } from 'components/layouts/Scaffold'
import { DocsButton } from 'components/ui/DocsButton'
import { RequestUpgradeToBillingOwners } from 'components/ui/RequestUpgradeToBillingOwners'
import { UpgradeToPro } from 'components/ui/UpgradeToPro'
import {
  useDiskAttributesQuery,
  useRemainingDurationForDiskAttributeUpdate,
} from 'data/config/disk-attributes-query'
import { useUpdateDiskAttributesMutation } from 'data/config/disk-attributes-update-mutation'
import { useDiskAutoscaleCustomConfigQuery } from 'data/config/disk-autoscale-config-query'
import { useUpdateDiskAutoscaleConfigMutation } from 'data/config/disk-autoscale-config-update-mutation'
import { useDiskUtilizationQuery } from 'data/config/disk-utilization-query'
import { useSetProjectStatus } from 'data/projects/project-detail-query'
import { useReadReplicasQuery } from 'data/read-replicas/replicas-query'
import { useProjectAddonUpdateMutation } from 'data/subscriptions/project-addon-update-mutation'
import { useProjectAddonsQuery } from 'data/subscriptions/project-addons-query'
import { AddonVariantId } from 'data/subscriptions/types'
import { useResourceWarningsQuery } from 'data/usage/resource-warnings-query'
import { AnimatePresence, motion } from 'framer-motion'
import { useCheckEntitlements } from 'hooks/misc/useCheckEntitlements'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import {
  useIsAwsCloudProvider,
  useIsAwsK8sCloudProvider,
  useIsAwsNimbusCloudProvider,
  useSelectedProjectQuery,
} from 'hooks/misc/useSelectedProject'
import { DOCS_URL, GB, PROJECT_STATUS } from 'lib/constants'
import { ChevronRight } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { CloudProvider } from 'shared-data'
import { toast } from 'sonner'
import {
  Button,
  cn,
  Collapsible_Shadcn_,
  CollapsibleContent_Shadcn_,
  CollapsibleTrigger_Shadcn_,
  Form_Shadcn_,
  Separator,
} from 'ui'
import { Admonition } from 'ui-patterns'

import { FormFooterChangeBadge } from '../DataWarehouse/FormFooterChangeBadge'
import { CreateDiskStorageSchema, DiskStorageSchemaType } from './DiskManagement.schema'
import { DiskManagementMessage } from './DiskManagement.types'
import { mapComputeSizeNameToAddonVariantId } from './DiskManagement.utils'
import { DiskMangementRestartRequiredSection } from './DiskManagementRestartRequiredSection'
import { DiskManagementReviewAndSubmitDialog } from './DiskManagementReviewAndSubmitDialog'
import { AutoScaleFields } from './fields/AutoScaleFields'
import { ComputeSizeField } from './fields/ComputeSizeField'
import { DiskSizeField } from './fields/DiskSizeField'
import { IOPSField } from './fields/IOPSField'
import { StorageTypeField } from './fields/StorageTypeField'
import { ThroughputField } from './fields/ThroughputField'
import { DiskCountdownRadial } from './ui/DiskCountdownRadial'
import {
  DISK_LIMITS,
  DiskType,
  RESTRICTED_COMPUTE_FOR_THROUGHPUT_ON_GP3,
} from './ui/DiskManagement.constants'
import { NoticeBar } from './ui/NoticeBar'
import { SpendCapDisabledSection } from './ui/SpendCapDisabledSection'

export function DiskManagementForm() {
  const { ref: projectRef } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const { data: org } = useSelectedOrganizationQuery()
  const { setProjectStatus } = useSetProjectStatus()

  const isSpendCapEnabled =
    org?.plan.id !== 'free' && !org?.usage_billing_enabled && project?.cloud_provider !== 'FLY'

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
  const [advancedSettingsOpen, setAdvancedSettingsOpenState] = useState(false)

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
      })
    ),
    defaultValues,
    mode: 'onBlur',
    reValidateMode: 'onChange',
  })

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

  const { computeSize: modifiedComputeSize } = form.watch()

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
  }, [modifiedComputeSize, isDialogOpen, project])

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

  const { formState } = form
  const usedSize = Math.round(((diskUtil?.metrics.fs_used_bytes ?? 0) / GB) * 100) / 100
  const totalSize = formState.defaultValues?.totalSize || 0
  const usedPercentage = (usedSize / totalSize) * 100

  const disableIopsThroughputConfig =
    modifiedComputeSize &&
    !isSpendCapEnabled &&
    RESTRICTED_COMPUTE_FOR_THROUGHPUT_ON_GP3.includes(modifiedComputeSize)

  const isBranch = project?.parent_project_ref !== undefined

  const disableDiskInputs =
    isRequestingChanges ||
    isPlanUpgradeRequired ||
    isWithinCooldownWindow ||
    isSpendCapEnabled ||
    !canUpdateDiskConfiguration ||
    !isAws

  const disableComputeInputs = isPlanUpgradeRequired
  const isDirty = !!Object.keys(form.formState.dirtyFields).length
  const isProjectResizing = project?.status === PROJECT_STATUS.RESIZING
  const isProjectRequestingDiskChanges = isRequestingChanges && !isProjectResizing
  const noPermissions = isPermissionsLoaded && !canUpdateDiskConfiguration

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
      toast.success(
        `Successfully updated disk settings!${willUpdateDiskConfiguration ? ' The requested changes will be applied to your disk shortly.' : ''}`
      )
    } catch (error: unknown) {
      setMessageState({
        message: error instanceof Error ? error.message : 'An unknown error occurred',
        type: 'error',
      })
    }
  }

  useEffect(() => {
    // Initialize field values properly when data has been loaded, preserving any user changes
    if (isDiskAttributesSuccess || isSuccess) {
      form.reset(defaultValues, {})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccess, isDiskAttributesSuccess])

  return (
    <>
      <ScaffoldContainer className="relative flex flex-col gap-10" bottomPadding>
        {isEntitlementsLoaded && isPlanUpgradeRequired && (
          <UpgradeToPro
            featureProposition="configure compute and disk"
            primaryText="Only available on Pro Plan and above"
            secondaryText="Upgrade to the Pro Plan to configure compute and disk settings."
          />
        )}

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

        <Separator />
      </ScaffoldContainer>

      <Form_Shadcn_ {...form}>
        <form
          id="disk-compute-form"
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-8"
        >
          <ScaffoldContainer className="relative flex flex-col gap-10" bottomPadding>
            <ComputeSizeField form={form} disabled={disableComputeInputs} />

            {!(isAws || isAwsNimbus) && <Separator />}

            <SpendCapDisabledSection />

            <div className="flex flex-col gap-y-4">
              <NoticeBar
                type="default"
                visible={!(isAws || isAwsNimbus)}
                title="Disk configuration is only available for projects in the AWS cloud provider"
                description={
                  isAwsK8s
                    ? 'Configuring your disk for AWS (Revamped) projects is unavailable for now.'
                    : isBranch
                      ? 'Delete and recreate your Preview Branch to configure disk size. It was deployed on an older branching infrastructure.'
                      : 'The Fly Postgres offering is deprecated - please migrate your instance to the AWS cloud prov to configure your disk.'
                }
              />

              {isAws && (
                <>
                  <div className="flex flex-col gap-y-3">
                    <DiskCountdownRadial />
                    {!isReadOnlyMode && usedPercentage >= 90 && isWithinCooldownWindow && (
                      <Admonition
                        type="destructive"
                        title="Database size is currently over 90% of disk size"
                        description="Your project will enter read-only mode once you reach 95% of the disk space to prevent your database from exceeding the disk limitations"
                      >
                        <DocsButton
                          abbrev={false}
                          className="mt-2"
                          href={`${DOCS_URL}/guides/platform/database-size#read-only-mode`}
                        />
                      </Admonition>
                    )}
                    {isReadOnlyMode && (
                      <Admonition
                        type="destructive"
                        title="Project is currently in read-only mode"
                        description="You will need to manually override read-only mode and reduce the database size to below 95% of the disk size"
                      >
                        <DocsButton
                          abbrev={false}
                          className="mt-2"
                          href={`${DOCS_URL}/guides/platform/database-size#disabling-read-only-mode`}
                        />
                      </Admonition>
                    )}
                  </div>

                  <DiskSizeField
                    form={form}
                    disableInput={disableDiskInputs}
                    setAdvancedSettingsOpenState={setAdvancedSettingsOpenState}
                  />
                </>
              )}
            </div>

            {isAws && (
              <>
                <Separator />

                <Collapsible_Shadcn_
                  // TO DO: wrap component into pattern
                  className="-space-y-px"
                  open={advancedSettingsOpen}
                  onOpenChange={() => setAdvancedSettingsOpenState((prev) => !prev)}
                >
                  <CollapsibleTrigger_Shadcn_ className="px-card py-3 w-full border flex items-center gap-6 rounded-t data-[state=closed]:rounded-b group justify-between">
                    <div className="flex flex-col items-start">
                      <span className="text-sm text-foreground">Advanced disk settings</span>
                      <span className="text-sm text-foreground-light text-left">
                        Specify additional settings for your disk, including autoscaling
                        configuration, IOPS, throughput, and disk type.
                      </span>
                    </div>
                    <ChevronRight
                      size={16}
                      className="text-foreground-light transition-all group-data-[state=open]:rotate-90"
                      strokeWidth={1}
                    />
                  </CollapsibleTrigger_Shadcn_>
                  <CollapsibleContent_Shadcn_
                    className={cn(
                      'transition-all rounded-b',
                      'data-[state=open]:border data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down'
                    )}
                  >
                    <div className="flex flex-col gap-y-8 py-8">
                      <div className="px-card flex flex-col gap-y-8">
                        <AutoScaleFields form={form} />
                      </div>
                      <Separator />
                      <div className="px-card flex flex-col gap-y-8">
                        <NoticeBar
                          type="default"
                          visible={!!disableIopsThroughputConfig}
                          title="Adjusting disk configuration requires LARGE Compute size or above"
                          description={`Increase your compute size to adjust your disk's storage type, ${form.getValues('storageType') === 'gp3' ? 'IOPS, ' : ''} and throughput`}
                          actions={
                            canUpdateDiskConfiguration ? (
                              <Button
                                type="default"
                                onClick={() => {
                                  form.setValue('computeSize', 'ci_large')
                                }}
                              >
                                Change to LARGE Compute
                              </Button>
                            ) : (
                              <RequestUpgradeToBillingOwners
                                addon="computeSize"
                                featureProposition="adjust disk configuration"
                              />
                            )
                          }
                        />
                        <StorageTypeField
                          form={form}
                          disableInput={disableIopsThroughputConfig || disableDiskInputs}
                        />
                        <IOPSField
                          form={form}
                          disableInput={disableIopsThroughputConfig || disableDiskInputs}
                        />
                        <ThroughputField
                          form={form}
                          disableInput={disableIopsThroughputConfig || disableDiskInputs}
                        />
                      </div>
                    </div>
                  </CollapsibleContent_Shadcn_>
                </Collapsible_Shadcn_>
              </>
            )}
          </ScaffoldContainer>

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
                    MAX_WIDTH_CLASSES,
                    PADDING_CLASSES,
                    'flex items-center gap-3 justify-end'
                  )}
                >
                  <FormFooterChangeBadge formState={formState} />
                  <Button
                    type="default"
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
      </Form_Shadcn_>
    </>
  )
}
