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
import {
  useDiskAttributesQuery,
  useRemainingDurationForDiskAttributeUpdate,
} from 'data/config/disk-attributes-query'
import { useUpdateDiskAttributesMutation } from 'data/config/disk-attributes-update-mutation'
import { useDiskUtilizationQuery } from 'data/config/disk-utilization-query'
import { setProjectStatus } from 'data/projects/projects-query'
import { useReadReplicasQuery } from 'data/read-replicas/replicas-query'
import { useOrgSubscriptionQuery } from 'data/subscriptions/org-subscription-query'
import { useProjectAddonUpdateMutation } from 'data/subscriptions/project-addon-update-mutation'
import { useProjectAddonsQuery } from 'data/subscriptions/project-addons-query'
import { AddonVariantId } from 'data/subscriptions/types'
import { useCheckPermissions, usePermissionsLoaded } from 'hooks/misc/useCheckPermissions'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { PROJECT_STATUS } from 'lib/constants'
import {
  Button,
  cn,
  Collapsible_Shadcn_,
  CollapsibleContent_Shadcn_,
  CollapsibleTrigger_Shadcn_,
  Form_Shadcn_,
  Separator,
} from 'ui'
import { FormFooterChangeBadge } from '../DataWarehouse/FormFooterChangeBadge'
import { CreateDiskStorageSchema, DiskStorageSchemaType } from './DiskManagement.schema'
import { mapComputeSizeNameToAddonVariantId, showMicroUpgrade } from './DiskManagement.utils'
import { DiskMangementRestartRequiredSection } from './DiskManagementRestartRequiredSection'
import { DiskManagementReviewAndSubmitDialog } from './DiskManagementReviewAndSubmitDialog'
import { ComputeSizeField } from './fields/ComputeSizeField'
import { DiskSizeField } from './fields/DiskSizeField'
import { IOPSField } from './fields/IOPSField'
import { StorageTypeField } from './fields/StorageTypeField'
import { ThroughputField } from './fields/ThroughputField'
import { DiskCountdownRadial } from './ui/DiskCountdownRadial'
import {
  DiskType,
  IOPS_RANGE,
  RESTRICTED_COMPUTE_FOR_THROUGHPUT_ON_GP3,
} from './ui/DiskManagement.constants'
import { NoticeBar } from './ui/NoticeBar'
import { SpendCapDisabledSection } from './ui/SpendCapDisabledSection'
import { DiskManagementMessage } from './DiskManagement.types'

export function DiskManagementForm() {
  const {
    project,
    // isLoading is used to avoid a useCheckPermissions() race condition
    isLoading: isProjectLoading,
  } = useProjectContext()
  const org = useSelectedOrganization()
  const { ref: projectRef } = useParams()
  const queryClient = useQueryClient()

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
  const {
    data: databases,
    // isLoading: isReadReplicasLoading,
    // error: readReplicasError,
    isSuccess: isReadReplicasSuccess,
  } = useReadReplicasQuery({ projectRef })
  const {
    data,
    // isLoading: isDiskAttributesLoading,
    // error: diskAttributesError,
    isSuccess: isDiskAttributesSuccess,
  } = useDiskAttributesQuery(
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
        }
      },
    }
  )
  const { isSuccess: isAddonsSuccess } = useProjectAddonsQuery({ projectRef })
  const { isWithinCooldownWindow, isSuccess: isCooldownSuccess } =
    useRemainingDurationForDiskAttributeUpdate({
      projectRef,
    })
  const { isSuccess: isDiskUtilizationSuccess } = useDiskUtilizationQuery({
    projectRef,
  })
  const { data: subscription, isSuccess: isSubscriptionSuccess } = useOrgSubscriptionQuery({
    orgSlug: org?.slug,
  })

  /**
   * Handle default values
   */
  // @ts-ignore [Joshen TODO] check whats happening here
  const { type, iops, throughput_mbps, size_gb } = data?.attributes ?? { size_gb: 0 }
  const defaultValues = {
    storageType: type ?? DiskType.GP3,
    provisionedIOPS: iops,
    throughput: throughput_mbps,
    totalSize: size_gb,
    computeSize: project?.infra_compute_size
      ? mapComputeSizeNameToAddonVariantId(project?.infra_compute_size)
      : undefined,
  }

  const form = useForm<DiskStorageSchemaType>({
    resolver: zodResolver(CreateDiskStorageSchema(defaultValues.totalSize)),
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
    isSubscriptionSuccess &&
    isCooldownSuccess

  const isRequestingChanges = data?.requested_modification !== undefined
  const readReplicas = (databases ?? []).filter((db) => db.identifier !== projectRef)
  const isPlanUpgradeRequired = subscription?.plan.id === 'free'

  const { formState } = form

  const isFlyArchitecture = project?.cloud_provider === 'FLY'

  const disableDiskInputs =
    isRequestingChanges ||
    isPlanUpgradeRequired ||
    isWithinCooldownWindow ||
    !canUpdateDiskConfiguration ||
    isFlyArchitecture

  const disableComputeInputs = isPlanUpgradeRequired

  useEffect(() => {
    // Initialize field values properly when data has been loaded, preserving any user changes
    if (isSuccess) {
      form.reset(defaultValues, {})
    }
  }, [isSuccess])

  const isDirty = !!Object.keys(form.formState.dirtyFields).length
  const isProjectResizing = project?.status === PROJECT_STATUS.RESIZING
  const isProjectRequestingDiskChanges = isRequestingChanges && !isProjectResizing
  const noPermissions = isPermissionsLoaded && !canUpdateDiskConfiguration && !isProjectLoading

  const { mutateAsync: updateDiskConfiguration, isLoading: isUpdatingDisk } =
    useUpdateDiskAttributesMutation({
      // this is to suppress to toast message
      onError: () => {},
    })
  const { mutateAsync: updateSubscriptionAddon, isLoading: isUpdatingCompute } =
    useProjectAddonUpdateMutation({
      // this is to suppress to toast message
      onError: () => {},
      onSuccess: () => {
        /**
         * Manually set project status to RESIZING
         * Project status should be RESIZING on next project status request.
         */
        setProjectStatus(queryClient, projectRef!, PROJECT_STATUS.RESIZING)
      },
    })

  const isUpdatingConfig = isUpdatingDisk || isUpdatingCompute

  const onSubmit = async (data: DiskStorageSchemaType) => {
    let payload = data
    setMessageState(null)
    try {
      if (
        payload.storageType !== form.formState.defaultValues?.storageType ||
        payload.provisionedIOPS !== form.formState.defaultValues?.provisionedIOPS ||
        payload.throughput !== form.formState.defaultValues?.throughput ||
        payload.totalSize !== form.formState.defaultValues?.totalSize
      ) {
        if (RESTRICTED_COMPUTE_FOR_THROUGHPUT_ON_GP3.includes(payload.computeSize)) {
          payload.provisionedIOPS = IOPS_RANGE[DiskType.GP3].min
        }

        await updateDiskConfiguration({
          ref: projectRef,
          provisionedIOPS: payload.provisionedIOPS,
          storageType: payload.storageType,
          totalSize: payload.totalSize,
          throughput: payload.throughput,
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
    } catch (error: unknown) {
      setMessageState({
        message: error instanceof Error ? error.message : 'An unknown error occurred',
        type: 'error',
      })
    }
  }

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
                <Link href={`/org/${org?.slug}/billing?panel=subscriptionPlan`}>Upgrade plan</Link>
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
          <DiskCountdownRadial />
          <SpendCapDisabledSection />
          <NoticeBar
            type="default"
            visible={isFlyArchitecture}
            title="Disk configuration is not available on Fly Postgres"
            description="Please contact Fly support if you need to update your disk configuration"
          />
          {!isFlyArchitecture && (
            <>
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
                    <span className="text-sm text-foreground-light">
                      Specify additional settings for your disk, including IOPS, throughput, and
                      disk type.
                    </span>
                  </div>
                  <ChevronRight
                    size={16}
                    className="text-foreground-light transition-all group-data-[state=open]:rotate-90"
                    strokeWidth={1}
                  />
                </CollapsibleTrigger_Shadcn_>
                <CollapsibleContent_Shadcn_ className="data-[state=open]:border flex flex-col gap-8 px-8 py-8 transition-all data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
                  <StorageTypeField form={form} disableInput={disableDiskInputs} />
                  <NoticeBar
                    type="default"
                    visible={
                      RESTRICTED_COMPUTE_FOR_THROUGHPUT_ON_GP3.includes(
                        form.watch('computeSize')
                      ) && subscription?.plan.id !== 'free'
                    }
                    title={`IOPS ${form.getValues('storageType') === 'gp3' ? 'and Throughput ' : ''}configuration requires LARGE Compute size or above`}
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
                  <IOPSField form={form} disableInput={disableDiskInputs} />
                  <ThroughputField form={form} disableInput={disableDiskInputs} />
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
