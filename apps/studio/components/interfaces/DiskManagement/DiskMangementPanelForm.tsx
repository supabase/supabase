import { zodResolver } from '@hookform/resolvers/zod'
import { AnimatePresence, motion } from 'framer-motion'
import { RotateCcw } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'

import { useParams } from 'common'
import DiskSpaceBar from 'components/interfaces/DiskManagement/DiskSpaceBar'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { FormHeader } from 'components/ui/Forms/FormHeader'
import { useDiskAttributesQuery } from 'data/config/disk-attributes-query'
import { useUpdateDiskAttributesMutation } from 'data/config/disk-attributes-update-mutation'
import { useDatabaseSizeQuery } from 'data/database/database-size-query'
import { GB } from 'lib/constants'
import {
  Badge,
  Button,
  Card,
  CardContent,
  Form_Shadcn_,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  FormItem_Shadcn_,
  Input_Shadcn_ as Input,
  RadioGroupCard,
  RadioGroupCardItem,
  Separator,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { FormFooterChangeBadge } from '../DataWarehouse/FormFooterChangeBadge'
import BillingChangeBadge from './BillingChangeBadge'
import { DiskCountdownRadial } from './DiskCountdownRadial'
import { DiskManagementDiskSizeReadReplicas } from './DiskManagementDiskSizeReadReplicas'
import { DiskStorageSchema, DiskStorageSchemaType } from './DiskManagementPanelSchema'
import { DiskManagementPlanUpgradeRequired } from './DiskManagementPlanUpgradeRequired'
import { DISK_LIMITS, DISK_PRICING, DiskType, PLAN_DETAILS } from './DiskMangement.constants'
import { DiskManagementReviewAndSubmitDialog } from './DiskMangementReviewAndSubmitDialog'
import { useDiskManagement } from './useDiskManagement'
import { useOrgSubscriptionQuery } from 'data/subscriptions/org-subscription-query'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'

export function DiskMangementPanelForm() {
  const org = useSelectedOrganization()
  const { project } = useProjectContext()
  const { ref: projectRef } = useParams()
  const [loading, setLoading] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false)

  const { data } = useDiskAttributesQuery({ projectRef })
  // @ts-ignore [Joshen TODO] check whats happening here
  const { type, iops, throughput_mbps, size_gb } = data?.attributes ?? { size_gb: 0 }
  const { data: subscription } = useOrgSubscriptionQuery({ orgSlug: org?.slug })
  const planId = subscription?.plan.id ?? ''

  // [Joshen] Just FYI eventually we'll need to show the DISK size, although this is okay for now
  const { data: dbSize } = useDatabaseSizeQuery({
    projectRef,
    connectionString: project?.connectionString,
  })
  const mainDiskUsed = Math.round(((dbSize?.result[0].db_size ?? 0) / GB) * 100) / 100

  // [Joshen] To figure out how to get this number and deprecate these variables
  const totalWaitTime = 180
  const { updateDiskConfiguration } = useDiskManagement()
  const { includedDiskGB } = PLAN_DETAILS?.[planId as keyof typeof PLAN_DETAILS] ?? {}

  const { mutate: updateDiskConfigurationRQ, isLoading: isUpdatingDiskConfiguration } =
    useUpdateDiskAttributesMutation({
      onSuccess: (_, vars) => {
        const { ref, ...formData } = vars
        setIsDialogOpen(false)
        form.reset(formData as DiskStorageSchemaType)
      },
    })

  const form = useForm<DiskStorageSchemaType>({
    resolver: zodResolver(DiskStorageSchema),
    defaultValues: {
      storageType: type,
      provisionedIOPS: iops,
      throughput: throughput_mbps,
      totalSize: size_gb,
    },
    mode: 'onBlur',
    reValidateMode: 'onChange',
  })

  const { watch, setValue, control, formState } = form
  const watchedStorageType = watch('storageType')
  const watchedTotalSize = watch('totalSize')

  const onSubmit = async (data: DiskStorageSchemaType) => {
    console.log('data', data)
    // if (projectRef === undefined) return console.error('Project ref is required')
    // updateDiskConfigurationRQ({ ref: projectRef, ...data })

    setLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 3000))
    await updateDiskConfiguration(data as any)
    await updateDiskConfiguration({ remainingTime: totalWaitTime })
    form.reset(data)
    setLoading(false)
    setIsDialogOpen(false)
  }

  const showNewBar = watchedTotalSize > size_gb

  // Destructure dirtyFields from formState
  const { dirtyFields } = formState

  // Check if 'allocatedStorage' is dirty
  const isAllocatedStorageDirty = !!dirtyFields.totalSize

  const calculateDiskSizePrice = () => {
    const newSize = form.getValues('totalSize')
    const oldSize = form.formState.defaultValues?.totalSize || 0
    const storageType = form.getValues('storageType') as DiskType
    const pricePerGiB = DISK_PRICING[storageType].storage
    const oldPrice = (Math.max(oldSize - includedDiskGB, 0) * pricePerGiB).toFixed(2)
    const newPrice = (Math.max(newSize - includedDiskGB, 0) * pricePerGiB).toFixed(2)
    return { oldPrice, newPrice }
  }

  const calculateIOPSPrice = () => {
    const storageType = form.getValues('storageType') as DiskType
    const newProvisionedIOPS = form.getValues('provisionedIOPS')
    const oldProvisionedIOPS = form.formState.defaultValues?.provisionedIOPS || 0

    if (storageType === DiskType.GP3) {
      const oldChargeableIOPS = Math.max(
        0,
        oldProvisionedIOPS - DISK_LIMITS[DiskType.GP3].includedIops
      )
      const newChargeableIOPS = Math.max(
        0,
        newProvisionedIOPS - DISK_LIMITS[DiskType.GP3].includedIops
      )
      const oldPrice = (oldChargeableIOPS * DISK_PRICING[DiskType.GP3].iops).toFixed(2)
      const newPrice = (newChargeableIOPS * DISK_PRICING[DiskType.GP3].iops).toFixed(2)
      return { oldPrice, newPrice }
    } else {
      const oldPrice = (oldProvisionedIOPS * DISK_PRICING[DiskType.IO2].iops).toFixed(2)
      const newPrice = (newProvisionedIOPS * DISK_PRICING[DiskType.IO2].iops).toFixed(2)
      return { oldPrice, newPrice }
    }
  }

  const calculateThroughputPrice = () => {
    const storageType = form.getValues('storageType') as DiskType
    const newThroughput = form.getValues('throughput')
    const oldThroughput = form.formState.defaultValues?.throughput || 0

    if (storageType === DiskType.GP3 && newThroughput) {
      const oldChargeableThroughput = Math.max(
        0,
        oldThroughput - DISK_LIMITS[DiskType.GP3].includedThroughput
      )
      const newChargeableThroughput = Math.max(
        0,
        newThroughput - DISK_LIMITS[DiskType.GP3].includedThroughput
      )
      const oldPrice = (oldChargeableThroughput * DISK_PRICING[DiskType.GP3].throughput).toFixed(2)
      const newPrice = (newChargeableThroughput * DISK_PRICING[DiskType.GP3].throughput).toFixed(2)
      return { oldPrice, newPrice }
    }
    return { oldPrice: '0.00', newPrice: '0.00' }
  }

  // Watch storageType and allocatedStorage to adjust constraints dynamically
  useEffect(() => {
    if (watchedStorageType === 'io2') {
      setValue('throughput', undefined) // Throughput is not configurable for 'io2'
    } else if (watchedStorageType === 'gp3') {
      if (watchedTotalSize < 400) {
        setValue('throughput', 125) // Fixed throughput for allocated storage < 400 GiB
      } else {
        // Ensure throughput is within the allowed range if it's greater than or equal to 400 GiB
        const currentThroughput = form.getValues('throughput')
        if (!currentThroughput || currentThroughput < 125 || currentThroughput > 1000) {
          setValue('throughput', 125) // Reset to default if undefined or out of bounds
        }
      }
    }
  }, [watchedStorageType, watchedTotalSize, setValue, form])

  return (
    <div>
      <FormHeader title="Disk Management" />
      <Form_Shadcn_ {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="-space-y-px">
            <Card className="bg-surface-100 rounded-b-none">
              <CardContent className="transition-all duration-500 ease-in-out py-10 flex flex-col gap-10 px-8">
                <FormField_Shadcn_
                  name="storageType"
                  control={form.control}
                  render={({ field }) => (
                    <>
                      <FormItemLayout layout="horizontal" label="Storage type">
                        <FormControl_Shadcn_>
                          <RadioGroupCard
                            className="flex flex-wrap gap-3"
                            {...field}
                            onValueChange={async (e) => {
                              field.onChange(e)
                              await form.trigger('provisionedIOPS') // only trigger provisionedIOPS due to other input being hidden
                            }}
                            defaultValue={field.value}
                          >
                            <FormItem_Shadcn_ asChild>
                              <FormControl_Shadcn_>
                                <RadioGroupCardItem
                                  className="grow p-3 px-5"
                                  value="gp3"
                                  showIndicator={false}
                                  // @ts-ignore
                                  label={
                                    <div className="flex flex-col gap-1">
                                      <div className="flex gap-3 items-center">
                                        <span className="text-sm">General Purpose SSD</span>{' '}
                                        <div>
                                          <Badge
                                            variant={'outline'}
                                            className="font-mono bg-alternative bg-opacity-100"
                                          >
                                            gp3
                                          </Badge>
                                        </div>
                                      </div>
                                      <p className="text-foreground-light">
                                        gp3 provides a balance between price and performance
                                      </p>
                                    </div>
                                  }
                                />
                              </FormControl_Shadcn_>
                            </FormItem_Shadcn_>
                            <FormItem_Shadcn_ asChild>
                              <FormControl_Shadcn_>
                                <RadioGroupCardItem
                                  className="grow p-3 px-5"
                                  value="io2"
                                  showIndicator={false}
                                  // @ts-ignore
                                  label={
                                    <div className="flex flex-col gap-1">
                                      <div className="flex gap-3 items-center">
                                        <span className="text-sm">Provisioned IOPS SSD</span>{' '}
                                        <div>
                                          <Badge
                                            variant={'outline'}
                                            className="font-mono bg-alternative bg-opacity-100"
                                          >
                                            io2
                                          </Badge>
                                        </div>
                                      </div>
                                      <p className="text-foreground-light">
                                        `io2` offers high IOPS for mission-critical applications.
                                      </p>
                                    </div>
                                  }
                                />
                              </FormControl_Shadcn_>
                            </FormItem_Shadcn_>
                          </RadioGroupCard>
                        </FormControl_Shadcn_>
                      </FormItemLayout>
                    </>
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
                        watchedStorageType === 'io2'
                          ? 'For `io2` storage type, 3000 IOPS and the maximum value is 16,000 IOPS.'
                          : 'For `gp3` storage type, 100 IOPS and the maximum value is 256,000 IOPS.'
                      }
                      //   labelOptional="GiB ratio must be between 0.5 and 1,000"
                      labelOptional="Input/output operations per second. Higher IOPS is suitable for applications requiring high throughput."
                    >
                      <div className="flex gap-3 items-center">
                        <div className="flex -space-x-px">
                          <FormControl_Shadcn_>
                            <Input
                              id="provisionedIOPS"
                              type="number"
                              className="flex-grow font-mono rounded-r-none max-w-32"
                              {...field}
                              onChange={(e) => {
                                setValue('provisionedIOPS', e.target.valueAsNumber, {
                                  shouldDirty: true,
                                  shouldValidate: true,
                                })
                              }}
                            />
                          </FormControl_Shadcn_>
                          <div className="border border-strong bg-surface-300 rounded-r-md px-3 flex items-center justify-center">
                            <span className="text-foreground-lighter text-xs font-mono">IOPS</span>
                          </div>
                        </div>

                        <BillingChangeBadge
                          show={
                            (watchedStorageType === 'io2' ||
                              (watchedStorageType === 'gp3' && field.value > 3000)) &&
                            !formState.errors.provisionedIOPS
                          }
                          beforePrice={Number(calculateIOPSPrice().oldPrice)}
                          afterPrice={Number(calculateIOPSPrice().newPrice)}
                        />
                      </div>
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
                            label="Throughput (MiBps)"
                            layout="horizontal"
                            description={
                              'Throughput can only be configured when Disk size is greater than 400 GiB.'
                            }
                          >
                            <div className="flex gap-3 items-center">
                              <div className="flex -space-x-px">
                                <FormControl_Shadcn_>
                                  <Input
                                    type="number"
                                    {...field}
                                    onChange={(e) => {
                                      setValue('throughput', e.target.valueAsNumber, {
                                        shouldDirty: true,
                                        shouldValidate: true,
                                      })
                                    }}
                                    className="flex-grow font-mono rounded-r-none max-w-32"
                                    disabled={
                                      watchedStorageType === 'io2' || watchedTotalSize < 400
                                    }
                                  />
                                </FormControl_Shadcn_>
                                <div className="border border-strong bg-surface-300 rounded-r-md px-3 flex items-center justify-center">
                                  <span className="text-foreground-lighter text-xs font-mono">
                                    MiBps
                                  </span>
                                </div>
                              </div>
                              <BillingChangeBadge
                                show={
                                  formState.isDirty &&
                                  formState.dirtyFields.throughput &&
                                  !formState.errors.throughput
                                }
                                beforePrice={Number(calculateThroughputPrice().oldPrice)}
                                afterPrice={Number(calculateThroughputPrice().newPrice)}
                              />
                            </div>
                          </FormItemLayout>
                        )}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
              <Separator />
              <CardContent className="py-10 px-8">
                <FormField_Shadcn_
                  name="totalSize"
                  control={control}
                  render={({ field }) => (
                    <FormItemLayout label="Disk Size" layout="horizontal">
                      <div className="mt-1 relative flex gap-2 items-center">
                        <div className="flex -space-x-px max-w-48">
                          <FormControl_Shadcn_>
                            <Input
                              type="number"
                              step="1"
                              {...field}
                              className="flex-grow font-mono rounded-r-none"
                              onWheel={(e) => e.currentTarget.blur()}
                              onChange={(e) => {
                                setValue('totalSize', e.target.valueAsNumber, {
                                  shouldDirty: true,
                                  shouldValidate: true,
                                })
                                updateDiskConfiguration({ size_gb: Number(e.target.value) })
                              }}
                              min={includedDiskGB}
                            />
                          </FormControl_Shadcn_>
                          <div className="border border-strong bg-surface-300 rounded-r-md px-3 flex items-center justify-center">
                            <span className="text-foreground-lighter text-xs font-mono">GiBs</span>
                          </div>
                        </div>
                        <AnimatePresence initial={false}>
                          {isAllocatedStorageDirty && (
                            <motion.div
                              key="throughPut"
                              initial={{ opacity: 0, scale: 0.95, x: -2 }}
                              animate={{ opacity: 1, scale: 1, x: 0 }}
                              exit={{ opacity: 0, scale: 0.95, x: -2 }}
                              transition={{ duration: 0.15 }}
                              style={{ overflow: 'hidden' }}
                            >
                              <Button
                                htmlType="button"
                                type="default"
                                size="small"
                                onClick={() => {
                                  form.resetField('totalSize')
                                }}
                              >
                                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                              </Button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                        <BillingChangeBadge
                          beforePrice={Number(calculateDiskSizePrice().oldPrice)}
                          afterPrice={Number(calculateDiskSizePrice().newPrice)}
                          show={
                            formState.isDirty &&
                            formState.dirtyFields.totalSize &&
                            !formState.errors.totalSize &&
                            calculateDiskSizePrice().oldPrice !== calculateDiskSizePrice().newPrice
                          }
                        />
                        <div className="text-xs text-foreground-light mt-2">
                          Your plan includes {includedDiskGB}GB of storage.
                        </div>
                      </div>
                    </FormItemLayout>
                  )}
                />
                <div className="grid grid-cols-12 gap-3">
                  {/* You can add additional content in the remaining 4 columns if needed */}
                  <div className="col-span-4">
                    {/* Additional content or information can go here */}
                  </div>
                  <div className="col-span-8 space-y-6 mt-6">
                    <div>
                      {/* <h3 className="text-sm">Main Disk Space</h3> */}
                      <DiskSpaceBar
                        showNewBar={form.formState.dirtyFields.totalSize !== undefined}
                        totalSize={size_gb}
                        usedSize={mainDiskUsed}
                        newTotalSize={
                          form.getValues('totalSize') <= size_gb
                            ? size_gb
                            : form.getValues('totalSize')
                        }
                      />
                    </div>
                    <DiskManagementDiskSizeReadReplicas
                      isDirty={form.formState.dirtyFields.totalSize !== undefined}
                      totalSize={size_gb * 1.25}
                      usedSize={mainDiskUsed}
                      newTotalSize={
                        form.getValues('totalSize') <= size_gb
                          ? size_gb * 1.25
                          : form.getValues('totalSize') * 1.25
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <DiskCountdownRadial />
            <DiskManagementPlanUpgradeRequired />

            <Card className="bg-surface-100 rounded-t-none">
              <CardContent className="flex items-center pb-0 py-3 px-8 gap-3 justify-end">
                <FormFooterChangeBadge formState={formState} />
                <div className="flex gap-2">
                  <Button
                    type="default"
                    onClick={() => form.reset()}
                    disabled={!form.formState.isDirty}
                  >
                    Cancel
                  </Button>
                  <DiskManagementReviewAndSubmitDialog
                    onSubmit={onSubmit}
                    isDialogOpen={isDialogOpen}
                    setIsDialogOpen={setIsDialogOpen}
                    form={form}
                    loading={loading}
                    calculateDiskSizePrice={calculateDiskSizePrice()}
                    calculateIOPSPrice={calculateIOPSPrice()}
                    calculateThroughputPrice={calculateThroughputPrice()}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </form>
      </Form_Shadcn_>
    </div>
  )
}
