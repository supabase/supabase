import { zodResolver } from '@hookform/resolvers/zod'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useQueryClient } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { useParams } from 'common'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { MAX_WIDTH_CLASSES, PADDING_CLASSES, ScaffoldContainer } from 'components/layouts/Scaffold'
import { DocsButton } from 'components/ui/DocsButton'
import {
  useDiskAttributesQuery,
  useRemainingDurationForDiskAttributeUpdate,
} from 'data/config/disk-attributes-query'
import { useUpdateDiskAttributesMutation } from 'data/config/disk-attributes-update-mutation'
import { useDiskAutoscaleCustomConfigQuery } from 'data/config/disk-autoscale-config-query'
import { useUpdateDiskAutoscaleConfigMutation } from 'data/config/disk-autoscale-config-update-mutation'
import { useDiskUtilizationQuery } from 'data/config/disk-utilization-query'
import { setProjectStatus } from 'data/projects/projects-query'
import { useReadReplicasQuery } from 'data/read-replicas/replicas-query'
import { useProjectAddonUpdateMutation } from 'data/subscriptions/project-addon-update-mutation'
import { useProjectAddonsQuery } from 'data/subscriptions/project-addons-query'
import { AddonVariantId } from 'data/subscriptions/types'
import { useResourceWarningsQuery } from 'data/usage/resource-warnings-query'
import { useCheckPermissions, usePermissionsLoaded } from 'hooks/misc/useCheckPermissions'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { GB, PROJECT_STATUS } from 'lib/constants'
import { CloudProvider } from 'shared-data'
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
import { DiskType, RESTRICTED_COMPUTE_FOR_THROUGHPUT_ON_GP3 } from './ui/DiskManagement.constants'
import { NoticeBar } from './ui/NoticeBar'
import { SpendCapDisabledSection } from './ui/SpendCapDisabledSection'

export function DiskManagementForm() {
  // isLoading is used to avoid a useCheckPermissions() race condition
  const { project, isLoading: isProjectLoading } = useProjectContext()
  const org = useSelectedOrganization()
  const { ref: projectRef } = useParams()
  const queryClient = useQueryClient()

  const { data: resourceWarnings } = useResourceWarningsQuery()
  const projectResourceWarnings = (resourceWarnings ?? [])?.find(
    (warning) => warning.project === project?.ref
  )
  const isReadOnlyMode = projectResourceWarnings?.is_readonly_mode_enabled
  const isFlyArchitecture = project?.cloud_provider === 'FLY'

  /**
   * Permissions
   */
  const isPermissionsLoaded = usePermissionsLoaded()
  const canUpdateDiskConfiguration = useCheckPermissions(PermissionAction.UPDATE, 'projects', {
    resource: {
      project_id: project?.id,
    },
  })

  /**
   * Component States
   */
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false)
  const [refetchInterval, setRefetchInterval] = useState<number | false>(false)
  const [message, setMessageState] = useState<DiskManagementMessage | null>(null)
  const [advancedSettingsOpen, setAdvancedSettingsOpenState] = useState(false)

  /**
   * Fetch form data
   */
  const { data: databases, isSuccess: isReadReplicasSuccess } = useReadReplicasQuery({ projectRef })
  const { data, isSuccess: isDiskAttributesSuccess } = useDiskAttributesQuery(
    { projectRef },
    {
      refetchInterval,
      refetchOnWindowFocus: false,
      onSuccess: (data) => {
        // @ts-ignore
        const { type, iops, throughput_mbps, size_gb } = data?.attributes ?? { size_gb: 0 }
        const formValues = {
          storageType: type,
          provisionedIOPS: iops,
          throughput: throughput_mbps,
          totalSize: size_gb,
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
      },
      enabled: project != null && !isFlyArchitecture,
    }
  )
  const { isSuccess: isAddonsSuccess } = useProjectAddonsQuery({ projectRef })
  const { isWithinCooldownWindow, isSuccess: isCooldownSuccess } =
    useRemainingDurationForDiskAttributeUpdate({
      projectRef,
      enabled: project != null && !isFlyArchitecture,
    })
  const { data: diskUtil, isSuccess: isDiskUtilizationSuccess } = useDiskUtilizationQuery(
    {
      projectRef,
    },
    { enabled: project != null && !isFlyArchitecture }
  )

  const { data: diskAutoscaleConfig, isSuccess: isDiskAutoscaleConfigSuccess } =
    useDiskAutoscaleCustomConfigQuery(
      { projectRef },
      { enabled: project != null && !isFlyArchitecture }
    )

  /**
   * Handle default values
   */
  // @ts-ignore
  const { type, iops, throughput_mbps, size_gb } = data?.attributes ?? { size_gb: 0, iops: 0 }
  const { growth_percent, max_size_gb, min_increment_gb } = diskAutoscaleConfig ?? {}
  const defaultValues = {
    storageType: type ?? DiskType.GP3,
    provisionedIOPS: iops,
    throughput: throughput_mbps,
    totalSize: size_gb,
    computeSize: project?.infra_compute_size
      ? mapComputeSizeNameToAddonVariantId(project?.infra_compute_size)
      : undefined,
    growthPercent: growth_percent,
    minIncrementGb: min_increment_gb,
    maxSizeGb: max_size_gb,
  }

  const form = useForm<DiskStorageSchemaType>({
    resolver: zodResolver(
      CreateDiskStorageSchema(defaultValues.totalSize, project?.cloud_provider as CloudProvider)
    ),
    defaultValues,
    mode: 'onBlur',
    reValidateMode: 'onChange',
  })

  /**
   * State handling
   */

  const isSuccess =
    isAddonsSuccess &&
    isDiskAttributesSuccess &&
    isDiskUtilizationSuccess &&
    isReadReplicasSuccess &&
    isDiskAutoscaleConfigSuccess &&
    isCooldownSuccess

  const isRequestingChanges = data?.requested_modification !== undefined
  const readReplicas = (databases ?? []).filter((db) => db.identifier !== projectRef)
  const isPlanUpgradeRequired = org?.plan.id === 'free'

  const { formState } = form
  const usedSize = Math.round(((diskUtil?.metrics.fs_used_bytes ?? 0) / GB) * 100) / 100
  const totalSize = formState.defaultValues?.totalSize || 0
  const usedPercentage = (usedSize / totalSize) * 100

  const disableIopsThroughputConfig =
    RESTRICTED_COMPUTE_FOR_THROUGHPUT_ON_GP3.includes(form.watch('computeSize')) &&
    org?.plan.id !== 'free'

  const isBranch = project?.parent_project_ref !== undefined

  const disableDiskInputs =
    isRequestingChanges ||
    isPlanUpgradeRequired ||
    isWithinCooldownWindow ||
    !canUpdateDiskConfiguration ||
    isFlyArchitecture

  const disableComputeInputs = isPlanUpgradeRequired
  const isDirty = !!Object.keys(form.formState.dirtyFields).length
  const isProjectResizing = project?.status === PROJECT_STATUS.RESIZING
  const isProjectRequestingDiskChanges = isRequestingChanges && !isProjectResizing
  const noPermissions = isPermissionsLoaded && !canUpdateDiskConfiguration && !isProjectLoading

  const { mutateAsync: updateDiskConfiguration, isLoading: isUpdatingDisk } =
    useUpdateDiskAttributesMutation({
      // this is to suppress to toast message
      onError: () => {},
      onSuccess: () => setRefetchInterval(2000),
    })
  const { mutateAsync: updateSubscriptionAddon, isLoading: isUpdatingCompute } =
    useProjectAddonUpdateMutation({
      // this is to suppress to toast message
      onError: () => {},
      onSuccess: () => {
        //Manually set project status to RESIZING, Project status should be RESIZING on next project status request.
        setProjectStatus(queryClient, projectRef!, PROJECT_STATUS.RESIZING)
      },
    })
  const { mutateAsync: updateDiskAutoscaleConfig, isLoading: isUpdatingDiskAutoscaleConfig } =
    useUpdateDiskAutoscaleConfigMutation({
      // this is to suppress to toast message
      onError: () => {},
    })

  const isUpdatingConfig = isUpdatingDisk || isUpdatingCompute || isUpdatingDiskAutoscaleConfig

  const onSubmit = async (data: DiskStorageSchemaType) => {
    let payload = data
    let willUpdateDiskConfiguration = false
    setMessageState(null)

    try {
      if (
        payload.storageType !== form.formState.defaultValues?.storageType ||
        payload.provisionedIOPS !== form.formState.defaultValues?.provisionedIOPS ||
        payload.throughput !== form.formState.defaultValues?.throughput ||
        payload.totalSize !== form.formState.defaultValues?.totalSize
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
        payload.growthPercent !== form.formState.defaultValues?.growthPercent ||
        payload.minIncrementGb !== form.formState.defaultValues?.minIncrementGb ||
        payload.maxSizeGb !== form.formState.defaultValues?.maxSizeGb
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
  }, [isSuccess, isDiskAttributesSuccess])

  return (
    <Form_Shadcn_ {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-8">
        <ScaffoldContainer className="relative flex flex-col gap-10" bottomPadding>
          <NoticeBar
            type="default"
            visible={isPlanUpgradeRequired}
            title="Compute and Disk configuration is not available on the Free Plan"
            actions={
              <Button type="default" asChild>
                <Link
                  href={`/org/${org?.slug}/billing?panel=subscriptionPlan&source=diskManagementConfigure`}
                >
                  Upgrade plan
                </Link>
              </Button>
            }
            description="You will need to upgrade to at least the Pro Plan to configure compute and disk"
          />

          {isProjectResizing || isProjectRequestingDiskChanges || noPermissions ? (
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
                visible={noPermissions}
                title="You do not have permission to update disk configuration"
                description="Please contact your organization administrator to update your disk configuration"
              />
            </div>
          ) : null}
          <Separator />
          <ComputeSizeField form={form} disabled={disableComputeInputs} />
          <Separator />
          <SpendCapDisabledSection />
          <NoticeBar
            type="default"
            visible={isFlyArchitecture}
            title="Disk configuration is not available on Fly Postgres"
            description={
              isBranch
                ? 'Delete and recreate your Preview Branch to configure disk size. It was deployed on an older branching infrastructure.'
                : 'The Fly Postgres offering is deprecated - please migrate your instance to Supabase to configure your disk.'
            }
          />
          {!isFlyArchitecture && (
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
                      href="https://supabase.com/docs/guides/platform/database-size#read-only-mode"
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
                      href="https://supabase.com/docs/guides/platform/database-size#disabling-read-only-mode"
                    />
                  </Admonition>
                )}
              </div>
              <DiskSizeField
                form={form}
                disableInput={disableDiskInputs}
                setAdvancedSettingsOpenState={setAdvancedSettingsOpenState}
              />
              <Separator />
              <Collapsible_Shadcn_
                // TO DO: wrap component into pattern
                className="-space-y-px"
                open={advancedSettingsOpen}
                onOpenChange={() => setAdvancedSettingsOpenState((prev) => !prev)}
              >
                <CollapsibleTrigger_Shadcn_ className="px-8 py-3 w-full border flex items-center gap-6 rounded-t data-[state=closed]:rounded-b group justify-between">
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
                    'flex flex-col gap-8 py-8 transition-all',
                    'data-[state=open]:border data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down'
                  )}
                >
                  <div className="px-8 flex flex-col gap-y-8">
                    <AutoScaleFields form={form} />
                  </div>
                  <Separator />
                  <div className="px-8 flex flex-col gap-y-8">
                    <NoticeBar
                      type="default"
                      visible={disableIopsThroughputConfig}
                      title="Adjusting disk configuration requires LARGE Compute size or above"
                      description={`Increase your compute size to adjust your disk's storage type, ${form.getValues('storageType') === 'gp3' ? 'IOPS, ' : ''} and throughput`}
                      actions={
                        <Button
                          type="default"
                          onClick={() => {
                            form.setValue('computeSize', 'ci_large')
                          }}
                        >
                          Change to LARGE Compute
                        </Button>
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
  )
}
