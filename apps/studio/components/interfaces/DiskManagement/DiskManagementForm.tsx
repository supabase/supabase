import { zodResolver } from '@hookform/resolvers/zod'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronRight, CpuIcon, InfoIcon, Microchip, RotateCcw } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { useParams } from 'common'
import DiskSpaceBar from 'components/interfaces/DiskManagement/DiskSpaceBar'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { FormHeader } from 'components/ui/Forms/FormHeader'
import {
  useDiskAttributesQuery,
  useRemainingDurationForDiskAttributeUpdate,
} from 'data/config/disk-attributes-query'
import { useUpdateDiskAttributesMutation } from 'data/config/disk-attributes-update-mutation'
import { useDiskUtilizationQuery } from 'data/config/disk-utilization-query'
import { useReadReplicasQuery } from 'data/read-replicas/replicas-query'
import { useOrgSubscriptionQuery } from 'data/subscriptions/org-subscription-query'
import { useProjectAddonsQuery } from 'data/subscriptions/project-addons-query'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { GB, INSTANCE_MICRO_SPECS } from 'lib/constants'
import {
  Alert_Shadcn_,
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Badge,
  Button,
  Card,
  CardContent,
  cn,
  Collapsible,
  Collapsible_Shadcn_,
  CollapsibleContent_Shadcn_,
  CollapsibleTrigger_Shadcn_,
  Form_Shadcn_,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  FormItem_Shadcn_,
  Input_Shadcn_ as Input,
  RadioGroupCard,
  RadioGroupCardItem,
  Select_Shadcn_,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
  Separator,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { FormFooterChangeBadge } from '../DataWarehouse/FormFooterChangeBadge'
import BillingChangeBadge from './BillingChangeBadge'
import { DiskCountdownRadial } from './DiskCountdownRadial'
import {
  COMPUTE_BASELINE_IOPS,
  COMPUTE_BASELINE_THROUGHPUT,
  COMPUTE_MAX_IOPS,
  COMPUTE_MAX_THROUGHPUT,
  DiskType,
  IOPS_RANGE,
  PLAN_DETAILS,
  RESTRICTED_COMPUTE_FOR_IOPS_ON_GP3,
  RESTRICTED_COMPUTE_FOR_THROUGHPUT_ON_GP3,
  THROUGHPUT_RANGE,
} from './DiskManagement.constants'
import {
  calculateComputeSizePrice,
  calculateDiskSizePrice,
  calculateIOPSPrice,
  calculateThroughputPrice,
  getAvailableComputeOptions,
} from './DiskManagement.utils'
import { CreateDiskStorageSchema, DiskStorageSchemaType } from './DiskManagementPanelSchema'
import { DiskManagementPlanUpgradeRequired } from './DiskManagementPlanUpgradeRequired'
import {
  DiskManagementDiskSizeReadReplicas,
  DiskManagementIOPSReadReplicas,
  DiskManagementThroughputReadReplicas,
} from './DiskManagementReadReplicas'
import { DiskManagementReviewAndSubmitDialog } from './DiskManagementReviewAndSubmitDialog'
import { getCloudProviderArchitecture } from 'lib/cloudprovider-utils'
import { ComputeBadge } from 'ui-patterns'
import { components } from 'api-types'
import { MAX_WIDTH_CLASSES, PADDING_CLASSES, ScaffoldContainer } from 'components/layouts/Scaffold'
import { InputPostTab } from './InputPostTab'
import { InfoTooltip } from 'ui-patterns/info-tooltip'
import { InputResetButton } from './InputResetButton'
import { DiskManagementFormLoading } from './BillingMangementForm.loading'

export function DiskManagementForm() {
  const { project } = useProjectContext()
  const org = useSelectedOrganization()
  const { ref: projectRef } = useParams()

  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false)
  const [remainingTime, setRemainingTime] = useState(0)
  const [refetchInterval, setRefetchInterval] = useState<number | false>(false)

  const [advancedSettingsOpen, setAdvancedSettingsOpenState] = useState(false)

  const canUpdateDiskConfiguration = useCheckPermissions(PermissionAction.UPDATE, 'projects', {
    resource: {
      project_id: project?.id,
    },
  })

  /**
   * Queries for form data
   */

  const {
    data: databases,
    isLoading: isReadReplicasLoading,
    error: readReplicasError,
    isSuccess: isReadReplicasSuccess,
  } = useReadReplicasQuery({ projectRef })
  const {
    data,
    isLoading: isDiskAttributesLoading,
    error: diskAttributesError,
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
  const {
    data: addons,
    isLoading: isAddonsLoading,
    error: addonsError,
    isSuccess: isAddonsSuccess,
  } = useProjectAddonsQuery({ projectRef })
  const { remainingDuration: initialRemainingTime, isWithinCooldownWindow } =
    useRemainingDurationForDiskAttributeUpdate({
      projectRef,
    })
  const {
    data: diskUtil,
    isLoading: isDiskUtilizationLoading,
    error: diskUtilError,
    isSuccess: isDiskUtilizationSuccess,
  } = useDiskUtilizationQuery({
    projectRef,
  })
  const {
    data: subscription,
    isLoading: isSubscriptionLoading,
    error: subscriptionError,
    isSuccess: isSubscriptionSuccess,
  } = useOrgSubscriptionQuery({
    orgSlug: org?.slug,
  })

  /**
   * Handle compute instances
   */
  const availableAddons = useMemo(() => {
    return addons?.available_addons ?? []
  }, [addons])

  const selectedAddons = addons?.selected_addons ?? []
  const subscriptionCompute = selectedAddons.find((addon) => addon.type === 'compute_instance')

  const availableOptions = useMemo(() => {
    return getAvailableComputeOptions(availableAddons, project?.cloud_provider)
  }, [availableAddons, project?.cloud_provider])

  /**
   * Handle default values
   */
  // @ts-ignore [Joshen TODO] check whats happening here
  const { type, iops, throughput_mbps, size_gb } = data?.attributes ?? { size_gb: 0 }
  const defaultValues = {
    storageType: type ?? 'gp3',
    provisionedIOPS: iops,
    throughput: throughput_mbps,
    totalSize: size_gb,
    computeSize: subscriptionCompute?.variant.identifier ?? 'ci_micro',
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
  const isLoading =
    isAddonsLoading ||
    isDiskAttributesLoading ||
    isDiskUtilizationLoading ||
    isReadReplicasLoading ||
    isSubscriptionLoading
  const error =
    addonsError ?? diskAttributesError ?? diskUtilError ?? readReplicasError ?? subscriptionError
  const isSuccess =
    isAddonsSuccess &&
    isDiskAttributesSuccess &&
    isDiskUtilizationSuccess &&
    isReadReplicasSuccess &&
    isSubscriptionSuccess

  const isRequestingChanges = data?.requested_modification !== undefined

  const readReplicas = (databases ?? []).filter((db) => db.identifier !== projectRef)

  const planId = subscription?.plan.id ?? 'free'
  const isPlanUpgradeRequired =
    subscription?.plan.id === 'pro' && !subscription.usage_billing_enabled

  const mainDiskUsed = Math.round(((diskUtil?.metrics.fs_used_bytes ?? 0) / GB) * 100) / 100

  const { watch, setValue, trigger, control, formState } = form
  const { dirtyFields } = formState

  const watchedComputeSize = watch('computeSize')
  const watchedStorageType = watch('storageType')
  const watchedTotalSize = watch('totalSize')
  const watchedIOPS = watch('provisionedIOPS')

  const isAllocatedStorageDirty = !!dirtyFields.totalSize

  const disableInput =
    isRequestingChanges ||
    isPlanUpgradeRequired ||
    isWithinCooldownWindow ||
    !canUpdateDiskConfiguration

  /** Disable IOPS if:
   *  1. baseline IOPS of compute is lower than min required IOPS for storage type
   *  2. compute is less than large
   *
   * */
  const disableIopsInput =
    RESTRICTED_COMPUTE_FOR_IOPS_ON_GP3.includes(watchedComputeSize) && watchedStorageType === 'gp3'

  const disableThroughputInput =
    RESTRICTED_COMPUTE_FOR_THROUGHPUT_ON_GP3.includes(watchedComputeSize) &&
    watchedStorageType === 'gp3'

  const currentCompute = (addons?.selected_addons ?? []).find((x) => x.type === 'compute_instance')
    ?.variant
  const maxIopsBasedOnCompute =
    COMPUTE_MAX_IOPS[watchedComputeSize as keyof typeof COMPUTE_MAX_IOPS]
  const maxThroughputBasedOnCompute =
    COMPUTE_MAX_THROUGHPUT[watchedComputeSize as keyof typeof COMPUTE_MAX_THROUGHPUT]

  const { includedDiskGB: includedDiskGBMeta } =
    PLAN_DETAILS?.[planId as keyof typeof PLAN_DETAILS] ?? {}
  const includedDiskGB = includedDiskGBMeta[watchedStorageType]

  const minIOPS = IOPS_RANGE[watchedStorageType]?.min ?? 0
  const maxIOPS =
    watchedStorageType === 'gp3'
      ? Math.min(500 * watchedTotalSize, IOPS_RANGE[DiskType.GP3].max)
      : Math.min(1000 * watchedTotalSize, IOPS_RANGE[DiskType.IO2].max)
  const minThroughput =
    watchedStorageType === 'gp3' ? THROUGHPUT_RANGE[watchedStorageType]?.min ?? 0 : 0
  const maxThroughput =
    watchedStorageType === 'gp3'
      ? Math.min(0.25 * watchedIOPS, THROUGHPUT_RANGE[DiskType.GP3].max)
      : undefined

  /**
   * Price calculations
   */

  const computeSizePrice = calculateComputeSizePrice({
    availableOptions: availableOptions,
    oldComputeSize: form.formState.defaultValues?.computeSize || 'ci_micro',
    newComputeSize: form.getValues('computeSize'),
  })
  const diskSizePrice = calculateDiskSizePrice({
    planId,
    oldSize: form.formState.defaultValues?.totalSize || 0,
    oldStorageType: form.formState.defaultValues?.storageType as DiskType,
    newSize: form.getValues('totalSize'),
    newStorageType: form.getValues('storageType') as DiskType,
  })
  const iopsPrice = calculateIOPSPrice({
    oldStorageType: form.formState.defaultValues?.storageType as DiskType,
    oldProvisionedIOPS: form.formState.defaultValues?.provisionedIOPS || 0,
    newStorageType: form.getValues('storageType') as DiskType,
    newProvisionedIOPS: form.getValues('provisionedIOPS'),
  })
  const throughputPrice = calculateThroughputPrice({
    storageType: form.getValues('storageType') as DiskType,
    newThroughput: form.getValues('throughput') || 0,
    oldThroughput: form.formState.defaultValues?.throughput || 0,
  })

  useEffect(() => {
    // Initialize field values properly when data has been loaded
    if (isSuccess) form.reset(defaultValues)
  }, [isSuccess])

  // Watch storageType and allocatedStorage to adjust constraints dynamically
  useEffect(() => {
    if (watchedStorageType === 'io2') {
      setValue('throughput', undefined) // Throughput is not configurable for 'io2'
    } else if (watchedStorageType === 'gp3') {
      // Ensure throughput is within the allowed range if it's greater than or equal to 400 GB
      const currentThroughput = form.getValues('throughput')
      const { min, max } = THROUGHPUT_RANGE[DiskType.GP3]
      if (!currentThroughput || currentThroughput < min || currentThroughput > max) {
        setValue('throughput', min) // Reset to default if undefined or out of bounds
      }
    }
  }, [watchedStorageType, watchedTotalSize, setValue, form])

  useEffect(() => {
    if (initialRemainingTime > 0) setRemainingTime(initialRemainingTime)
  }, [initialRemainingTime])

  useEffect(() => {
    if (remainingTime <= 0) return

    const timer = setInterval(() => {
      setRemainingTime(Math.max(0, remainingTime - 1))
    }, 1000)

    return () => clearInterval(timer)
  }, [remainingTime])

  const { mutate: updateDiskConfigurationRQ, isLoading: isUpdatingDiskConfiguration } =
    useUpdateDiskAttributesMutation({
      onSuccess: (_, vars) => {
        toast.success(
          'Successfully requested disk configuration changes! Your changes will be applied shortly'
        )
        const { ref, ...formData } = vars
        setIsDialogOpen(false)
        setRefetchInterval(3000)
        form.reset(formData as DiskStorageSchemaType)
      },
    })

  const onSubmit = async (data: DiskStorageSchemaType) => {
    if (projectRef === undefined) return console.error('Project ref is required')
    updateDiskConfigurationRQ({ ref: projectRef, ...data })
  }

  const diskTypeOptions = [
    {
      type: 'gp3',
      name: 'General Purpose SSD',
      description: 'Balance between price and performance',
    },
    {
      type: 'io2',
      name: 'Provisioned IOPS SSD',
      description: 'High IOPS for mission-critical applications.',
    },
  ]

  if (isLoading) {
    return <DiskManagementFormLoading />
  }

  if (error) {
    return <div>Error: {error.message}</div>
  }

  if (planId === 'free') {
    return (
      <div id="disk-management">
        <FormHeader
          title="Disk Management"
          docsUrl="https://supabase.com/docs/guides/platform/database-size#disk-management"
        />
        <Alert_Shadcn_>
          <InfoIcon />
          <AlertTitle_Shadcn_>
            Disk size configuration is not available for projects on the Free Plan
          </AlertTitle_Shadcn_>
          <AlertDescription_Shadcn_>
            <p>
              If you are intending to use more than 500MB of disk space, then you will need to
              upgrade to at least the Pro Plan.
            </p>
            <Button asChild type="default" className="mt-3">
              <Link
                target="_blank"
                rel="noreferrer"
                href={`/org/${org?.slug}/billing?panel=subscriptionPlan`}
              >
                Upgrade plan
              </Link>
            </Button>
          </AlertDescription_Shadcn_>
        </Alert_Shadcn_>
      </div>
    )
  }

  // return <></>

  const isDirty = !!Object.keys(form.formState.dirtyFields).length

  return (
    <>
      {isRequestingChanges ? (
        <Card className="px-2 rounded-none">
          <CardContent className="py-3 flex gap-3 px-3 items-center">
            <div className="flex flex-col">
              <p className="text-foreground-lighter text-sm p-0">
                Disk configuration changes have been requested
              </p>
              <p className="text-sm">The requested changes will be applied to your disk shortly</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <></>
      )}
      {/* <DiskManagementFormLoading /> */}
      <Form_Shadcn_ {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-8">
          <ScaffoldContainer className="relative flex flex-col gap-10" bottomPadding>
            {/* {showNewDiskManagementUI ? <DiskManagementForm /> : null} */}

            {true ? (
              <Card className="px-2 bg-surface-100">
                <CardContent className="py-3 flex gap-3 px-3 items-center">
                  <div className="flex flex-col">
                    <p className="text-foreground text-sm p-0">
                      Disk configuration changes have been requested
                    </p>
                    <p className="text-foreground-lighter text-sm">
                      The requested changes will be applied to your disk shortly
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <></>
            )}

            <Separator />

            <FormField_Shadcn_
              name="computeSize"
              control={form.control}
              render={({ field }) => (
                <>
                  <FormItemLayout
                    layout="horizontal"
                    label={'Compute size'}
                    labelOptional={
                      <>
                        <BillingChangeBadge
                          className={'mb-2'}
                          show={
                            formState.isDirty &&
                            formState.dirtyFields.computeSize &&
                            !formState.errors.computeSize
                          }
                          beforePrice={Number(computeSizePrice.oldPrice)}
                          afterPrice={Number(computeSizePrice.newPrice)}
                        />
                        <p>Hardware resources allocated to your postgres database</p>
                      </>
                    }
                  >
                    <RadioGroupCard
                      className="grid grid-cols-3 flex-wrap gap-3"
                      onValueChange={(value) => {
                        setValue('computeSize', value, {
                          shouldDirty: true,
                          shouldValidate: true,
                        })
                      }}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      {availableOptions.map((compute) => {
                        const cpuArchitecture = getCloudProviderArchitecture(
                          project?.cloud_provider
                        )

                        return (
                          <RadioGroupCardItem
                            showIndicator={false}
                            value={compute.identifier}
                            className="text-sm text-left flex flex-col gap-0 px-0 py-3 overflow-hidden [&_label]:w-full group] w-full h-[110px]"
                            // @ts-ignore
                            label={
                              <div className="w-full flex flex-col gap-3 justify-between">
                                <div className="px-3 opacity-50 group-data-[state=checked]:opacity-100 flex justify-between">
                                  <ComputeBadge
                                    className="inline-flex font-semibold"
                                    infraComputeSize={
                                      compute.name as components['schemas']['DbInstanceSize']
                                    }
                                  />
                                  <div className="flex items-center space-x-1">
                                    <span className="text-foreground text-sm font-semibold">
                                      {/* Price needs to be exact here */}${compute.price}
                                    </span>
                                    <span className="text-foreground-light translate-y-[1px]">
                                      {' '}
                                      / {compute.price_interval === 'monthly' ? 'month' : 'hour'}
                                    </span>
                                  </div>
                                </div>
                                {/* <Separator className="bg-border group-data-[state=checked]:bg-foreground-muted" /> */}
                                <div className="w-full">
                                  <div className="px-3 text-sm flex flex-col gap-1">
                                    <div className="text-foreground-light flex gap-2 items-center">
                                      <Microchip
                                        strokeWidth={1}
                                        size={14}
                                        className="text-foreground-lighter"
                                      />
                                      <span>{compute.meta?.memory_gb ?? 0} GB memory</span>
                                    </div>
                                    <div className="text-foreground-light flex gap-2 items-center">
                                      <CpuIcon
                                        strokeWidth={1}
                                        size={14}
                                        className="text-foreground-lighter"
                                      />
                                      <span>
                                        {compute.meta?.cpu_cores ?? 0}-core {cpuArchitecture} CPU
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            }
                          ></RadioGroupCardItem>
                        )
                      })}
                    </RadioGroupCard>
                  </FormItemLayout>
                </>
              )}
            />

            <Separator />

            <DiskCountdownRadial remainingTime={remainingTime} />

            {isPlanUpgradeRequired && <DiskManagementPlanUpgradeRequired />}

            <div className="grid grid-cols-12 gap-5">
              <div className="col-span-4">
                <FormField_Shadcn_
                  name="totalSize"
                  control={control}
                  render={({ field }) => (
                    <FormItemLayout
                      label="Disk Size"
                      layout="vertical"
                      description={
                        <div className="flex flex-col gap-1">
                          <BillingChangeBadge
                            className="mt-1"
                            beforePrice={Number(diskSizePrice.oldPrice)}
                            afterPrice={Number(diskSizePrice.newPrice)}
                            show={
                              formState.isDirty &&
                              !formState.errors.totalSize &&
                              diskSizePrice.oldPrice !== diskSizePrice.newPrice
                            }
                          />
                          <span className="text-foreground-muted">
                            {includedDiskGB > 0 &&
                              `Your plan includes ${includedDiskGB} GB of disk size for ${watchedStorageType}.`}
                          </span>
                        </div>
                      }
                      // labelOptional={}
                      // className=""/
                    >
                      <div className="relative flex gap-2 items-center">
                        <InputPostTab label="GB">
                          <FormControl_Shadcn_>
                            <Input
                              type="number"
                              step="1"
                              {...field}
                              disabled={disableInput}
                              className="w-32 font-mono rounded-r-none"
                              onWheel={(e) => e.currentTarget.blur()}
                              onChange={(e) => {
                                setValue('totalSize', e.target.valueAsNumber, {
                                  shouldDirty: true,
                                  shouldValidate: true,
                                })
                                trigger('provisionedIOPS')
                                trigger('throughput')
                              }}
                              min={includedDiskGB}
                            />
                          </FormControl_Shadcn_>
                        </InputPostTab>
                        <InputResetButton
                          isDirty={isAllocatedStorageDirty}
                          onClick={() => form.resetField('totalSize')}
                        />
                      </div>
                    </FormItemLayout>
                  )}
                />
              </div>
              <div className="col-span-8">
                {/* You can add additional content in the remaining 4 columns if needed */}
                <DiskSpaceBar
                  showNewBar={form.formState.dirtyFields.totalSize !== undefined}
                  totalSize={size_gb}
                  usedSize={mainDiskUsed}
                  newTotalSize={watchedTotalSize}
                />
                <DiskManagementDiskSizeReadReplicas
                  isDirty={form.formState.dirtyFields.totalSize !== undefined}
                  totalSize={size_gb * 1.25}
                  usedSize={mainDiskUsed}
                  newTotalSize={watchedTotalSize * 1.25}
                  oldStorageType={form.formState.defaultValues?.storageType as DiskType}
                  newStorageType={form.getValues('storageType') as DiskType}
                />
              </div>
            </div>

            <Separator />

            <Collapsible_Shadcn_
              className="-space-y-px"
              open={advancedSettingsOpen}
              onOpenChange={() => setAdvancedSettingsOpenState((prev) => !prev)}
            >
              <CollapsibleTrigger_Shadcn_ className="px-8 py-3 w-full border flex items-center gap-6 rounded-t data-[state=closed]:rounded-b group justify-between">
                <div className="flex flex-col items-start">
                  <span className="text-sm text-foreground">Advanced disk settings</span>
                  <span className="text-sm text-foreground-light">
                    Specify additional settings for your disk, including IOPS, throughput, and disk
                    type.
                  </span>
                </div>
                <ChevronRight
                  size={16}
                  className="text-foreground-light transition-all group-data-[state=open]:rotate-90"
                  strokeWidth={1}
                />
              </CollapsibleTrigger_Shadcn_>

              <CollapsibleContent_Shadcn_ className="data-[state=open]:border flex flex-col gap-8 px-8 py-8 transition-all data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
                <FormField_Shadcn_
                  name="storageType"
                  control={form.control}
                  render={({ field }) => (
                    <FormItemLayout layout="horizontal" label="Storage type">
                      <Select_Shadcn_
                        {...field}
                        onValueChange={async (e) => {
                          field.onChange(e)
                          // only trigger provisionedIOPS due to other input being hidden
                          await form.trigger('provisionedIOPS')
                          await form.trigger('totalSize')
                        }}
                        defaultValue={field.value}
                        disabled={disableInput}
                      >
                        <FormControl_Shadcn_>
                          <SelectTrigger_Shadcn_ className="h-13 max-w-[420px]">
                            <SelectValue_Shadcn_ />
                          </SelectTrigger_Shadcn_>
                        </FormControl_Shadcn_>
                        <SelectContent_Shadcn_>
                          <>
                            {diskTypeOptions.map((item) => (
                              <SelectItem_Shadcn_
                                key={item.type}
                                disabled={disableInput}
                                value={item.type}
                              >
                                <div className="flex flex-col gap-0 items-start">
                                  <div className="flex gap-3 items-center">
                                    <span className="text-sm text-foreground">{item.name}</span>{' '}
                                    <div>
                                      <Badge
                                        variant={'outline'}
                                        className="font-mono bg-alternative bg-opacity-100"
                                      >
                                        {item.type}
                                      </Badge>
                                    </div>
                                  </div>
                                  <p className="text-foreground-light">{item.description}</p>
                                </div>
                              </SelectItem_Shadcn_>
                            ))}
                          </>
                        </SelectContent_Shadcn_>
                      </Select_Shadcn_>
                    </FormItemLayout>
                  )}
                />

                <FormField_Shadcn_
                  control={form.control}
                  name="provisionedIOPS"
                  render={({ field }) => (
                    <FormItemLayout
                      layout="horizontal"
                      label="IOPS"
                      description={
                        <div className="flex flex-col gap-y-2">
                          <div className="flex items-center gap-x-2">
                            {watchedStorageType === 'io2' ? (
                              <>
                                <span>
                                  IOPS must be{' '}
                                  {watchedTotalSize >= 8
                                    ? `between ${minIOPS} and ${maxIOPS.toLocaleString()} based on your disk size.`
                                    : `at least ${minIOPS}`}
                                </span>
                                <InfoTooltip>
                                  For io2 storage type, min IOPS is at {minIOPS}, while max IOPS is
                                  at 1000 * disk size in GB or{' '}
                                  {IOPS_RANGE[DiskType.IO2].max.toLocaleString()}, whichever is
                                  lower
                                </InfoTooltip>
                              </>
                            ) : (
                              <>
                                <span>
                                  IOPS must be{' '}
                                  {watchedTotalSize >= 8
                                    ? `between ${minIOPS.toLocaleString()} and ${maxIOPS.toLocaleString()} based on your disk size.`
                                    : `at least ${minIOPS.toLocaleString()}`}
                                </span>
                                <InfoTooltip>
                                  For gp3 storage type, min IOPS is at {minIOPS} while max IOPS is
                                  at 500 * disk size in GB or{' '}
                                  {IOPS_RANGE[DiskType.GP3].max.toLocaleString()}, whichever is
                                  lower
                                </InfoTooltip>
                              </>
                            )}
                          </div>
                          {!form.formState.errors.provisionedIOPS &&
                            field.value > maxIopsBasedOnCompute && (
                              <p>
                                Note: Final usable IOPS will be at{' '}
                                <span className="text-foreground">
                                  {maxIopsBasedOnCompute.toLocaleString()}
                                </span>{' '}
                                based on your current compute size of {currentCompute?.name}
                              </p>
                            )}

                          {!form.formState.errors.provisionedIOPS && (
                            <DiskManagementIOPSReadReplicas
                              isDirty={form.formState.dirtyFields.provisionedIOPS !== undefined}
                              oldIOPS={iops ?? 0}
                              newIOPS={field.value}
                              oldStorageType={form.formState.defaultValues?.storageType as DiskType}
                              newStorageType={form.getValues('storageType') as DiskType}
                            />
                          )}
                        </div>
                      }
                      labelOptional={
                        <>
                          <BillingChangeBadge
                            show={
                              (watchedStorageType !== type ||
                                (watchedStorageType === 'gp3' && field.value !== iops)) &&
                              !formState.errors.provisionedIOPS
                            }
                            beforePrice={Number(iopsPrice.oldPrice)}
                            afterPrice={Number(iopsPrice.newPrice)}
                            className="mb-2"
                          />
                          <p>Input/output operations per second.</p>
                          <p>Higher IOPS for high-throughput apps.</p>
                        </>
                      }
                    >
                      <InputPostTab label="IOPS">
                        <FormControl_Shadcn_>
                          <Input
                            id="provisionedIOPS"
                            type="number"
                            className="flex-grow font-mono rounded-r-none max-w-32"
                            {...field}
                            value={
                              disableIopsInput
                                ? COMPUTE_BASELINE_IOPS[
                                    watchedComputeSize as keyof typeof COMPUTE_BASELINE_IOPS
                                  ]
                                : field.value
                            }
                            disabled={disableInput || disableIopsInput}
                            onChange={(e) => {
                              setValue('provisionedIOPS', e.target.valueAsNumber, {
                                shouldDirty: true,
                                shouldValidate: true,
                              })
                            }}
                          />
                        </FormControl_Shadcn_>
                      </InputPostTab>
                    </FormItemLayout>
                  )}
                />

                <AnimatePresence initial={false}>
                  {form.getValues('storageType') === 'gp3' && (
                    <motion.div
                      key="throughPutContainer"
                      initial={{ opacity: 0, x: -4, height: 0 }}
                      animate={{ opacity: 1, x: 0, height: 'auto' }}
                      exit={{ opacity: 0, x: -4, height: 0 }}
                      transition={{ duration: 0.1 }}
                      style={{ overflow: 'hidden' }}
                    >
                      <FormField_Shadcn_
                        name="throughput"
                        control={control}
                        render={({ field }) => (
                          <FormItemLayout
                            label="Throughput (MB/s)"
                            layout="horizontal"
                            description={
                              <div className="flex flex-col gap-y-2">
                                <div>
                                  <div className="flex items-center gap-x-2">
                                    <span>
                                      Throughput must be between {minThroughput.toLocaleString()}{' '}
                                      and {maxThroughput?.toLocaleString()} MB/s based on your IOPS.
                                    </span>
                                    <InfoTooltip>
                                      Min throughput is at 125MB/s, while max throughput is at
                                      0.25MB/s * IOPS or 1,000, whichever is lower
                                    </InfoTooltip>
                                  </div>
                                  {!form.formState.errors.throughput &&
                                    field.value !== undefined &&
                                    field.value > maxThroughputBasedOnCompute && (
                                      <p>
                                        Note: Final usable throughput will be at{' '}
                                        <span className="text-foreground">
                                          {maxThroughputBasedOnCompute.toFixed(0)}
                                        </span>{' '}
                                        MB/s based on your current compute size of{' '}
                                        {currentCompute?.name}
                                      </p>
                                    )}
                                </div>
                                {!form.formState.errors.throughput && (
                                  <DiskManagementThroughputReadReplicas
                                    isDirty={form.formState.dirtyFields.throughput !== undefined}
                                    oldThroughput={throughput_mbps ?? 0}
                                    newThroughput={field.value ?? 0}
                                    oldStorageType={
                                      form.formState.defaultValues?.storageType as DiskType
                                    }
                                    newStorageType={form.getValues('storageType') as DiskType}
                                  />
                                )}
                              </div>
                            }
                            labelOptional={
                              <>
                                <BillingChangeBadge
                                  show={
                                    formState.isDirty &&
                                    formState.dirtyFields.throughput &&
                                    !formState.errors.throughput
                                  }
                                  beforePrice={Number(throughputPrice.oldPrice)}
                                  afterPrice={Number(throughputPrice.newPrice)}
                                  className="mb-2"
                                />
                                <p>Amount of data read/written to the disk per second.</p>
                                <p>
                                  Higher throughput suits applications with high data transfer
                                  needs.
                                </p>
                              </>
                            }
                          >
                            <InputPostTab label="MB/s">
                              <FormControl_Shadcn_>
                                <Input
                                  type="number"
                                  {...field}
                                  value={
                                    disableIopsInput
                                      ? COMPUTE_BASELINE_THROUGHPUT[
                                          watchedComputeSize as keyof typeof COMPUTE_BASELINE_THROUGHPUT
                                        ]
                                      : field.value
                                  }
                                  onChange={(e) => {
                                    setValue('throughput', e.target.valueAsNumber, {
                                      shouldDirty: true,
                                      shouldValidate: true,
                                    })
                                  }}
                                  className="flex-grow font-mono rounded-r-none max-w-32"
                                  disabled={
                                    disableInput || disableIopsInput || watchedStorageType === 'io2'
                                  }
                                />
                              </FormControl_Shadcn_>
                            </InputPostTab>
                          </FormItemLayout>
                        )}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </CollapsibleContent_Shadcn_>
            </Collapsible_Shadcn_>
          </ScaffoldContainer>

          <AnimatePresence>
            {isDirty ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.1, delay: 0.4 }}
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
                    loading={isUpdatingDiskConfiguration}
                    form={form}
                    numReplicas={readReplicas.length}
                    isDialogOpen={isDialogOpen}
                    onSubmit={onSubmit}
                    setIsDialogOpen={setIsDialogOpen}
                  />
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>

          {/* </CardContent> */}
          {/* </Card> */}
        </form>
      </Form_Shadcn_>
    </>
  )
}
