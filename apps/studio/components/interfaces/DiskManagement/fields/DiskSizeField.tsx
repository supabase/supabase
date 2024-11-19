import { UseFormReturn } from 'react-hook-form'

import { InputVariants } from '@ui/components/shadcn/ui/input'
import { useParams } from 'common'
import { useDiskAttributesQuery } from 'data/config/disk-attributes-query'
import { useDiskUtilizationQuery } from 'data/config/disk-utilization-query'
import { useOrgSubscriptionQuery } from 'data/subscriptions/org-subscription-query'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { GB } from 'lib/constants'
import { Button, FormControl_Shadcn_, FormField_Shadcn_, Input_Shadcn_, Skeleton, cn } from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { DiskStorageSchemaType } from '../DiskManagement.schema'
import { calculateDiskSizePrice } from '../DiskManagement.utils'
import { BillingChangeBadge } from '../ui/BillingChangeBadge'
import { DiskType, PLAN_DETAILS } from '../ui/DiskManagement.constants'
import { DiskManagementDiskSizeReadReplicas } from '../ui/DiskManagementReadReplicas'
import DiskSpaceBar from '../ui/DiskSpaceBar'
import { DiskTypeRecommendationSection } from '../ui/DiskTypeRecommendationSection'
import FormMessage from '../ui/FormMessage'
import { InputPostTab } from '../ui/InputPostTab'
import { InputResetButton } from '../ui/InputResetButton'

type DiskSizeFieldProps = {
  form: UseFormReturn<DiskStorageSchemaType>
  disableInput: boolean
  setAdvancedSettingsOpenState: (state: boolean) => void
}

export function DiskSizeField({
  form,
  disableInput,
  setAdvancedSettingsOpenState,
}: DiskSizeFieldProps) {
  const { ref: projectRef } = useParams()
  const { control, formState, setValue, trigger, getValues, resetField, watch } = form
  const org = useSelectedOrganization()

  const {
    isLoading: isLoadingDiskAttributes,
    error: diskAttributesError,
    isError: isDiskAttributesError,
  } = useDiskAttributesQuery({ projectRef })
  const {
    data: subscription,
    isLoading: isSubscriptionLoading,
    error: subscriptionError,
    isError: isSubscriptionError,
  } = useOrgSubscriptionQuery({
    orgSlug: org?.slug,
  })
  const {
    data: diskUtil,
    isLoading: isDiskUtilizationLoading,
    error: diskUtilError,
    isError: isDiskUtilizationError,
  } = useDiskUtilizationQuery({
    projectRef: projectRef,
  })

  const isLoading = isSubscriptionLoading || isDiskUtilizationLoading || isLoadingDiskAttributes
  const error = subscriptionError || diskUtilError || diskAttributesError
  const isError = isSubscriptionError || isDiskUtilizationError || isDiskAttributesError

  const watchedStorageType = watch('storageType')
  const watchedTotalSize = watch('totalSize')

  const planId = subscription?.plan.id ?? 'free'

  const { includedDiskGB: includedDiskGBMeta } =
    PLAN_DETAILS?.[planId as keyof typeof PLAN_DETAILS] ?? {}
  const includedDiskGB = includedDiskGBMeta[watchedStorageType]

  const diskSizePrice = calculateDiskSizePrice({
    planId,
    oldSize: formState.defaultValues?.totalSize || 0,
    oldStorageType: formState.defaultValues?.storageType as DiskType,
    newSize: getValues('totalSize'),
    newStorageType: getValues('storageType') as DiskType,
  })

  const isAllocatedStorageDirty = !!formState.dirtyFields.totalSize
  const mainDiskUsed = Math.round(((diskUtil?.metrics.fs_used_bytes ?? 0) / GB) * 100) / 100

  return (
    <div className="grid grid-cols-12 gap-5">
      <div className="col-span-4">
        <FormField_Shadcn_
          name="totalSize"
          control={control}
          render={({ field }) => (
            <FormItemLayout label="Disk Size" layout="vertical" id={field.name}>
              <div className="relative flex gap-2 items-center">
                <InputPostTab label="GB">
                  {isLoading ? (
                    <div
                      className={cn(
                        InputVariants({ size: 'small' }),
                        'w-32 font-mono rounded-r-none'
                      )}
                    >
                      <Skeleton className="w-10 h-4" />
                    </div>
                  ) : (
                    <FormControl_Shadcn_>
                      <Input_Shadcn_
                        type="number"
                        id={field.name}
                        {...field}
                        disabled={disableInput || isError}
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
                  )}
                </InputPostTab>
                <InputResetButton
                  isDirty={isAllocatedStorageDirty}
                  onClick={() => {
                    resetField('totalSize')
                    trigger('provisionedIOPS')
                  }}
                />
              </div>
            </FormItemLayout>
          )}
        />
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
          <span className="text-foreground-lighter text-sm">
            {includedDiskGB > 0 &&
              subscription?.plan.id &&
              `Your plan includes ${includedDiskGB} GB of disk size for ${watchedStorageType}.`}
          </span>
          <DiskTypeRecommendationSection
            form={form}
            actions={
              <Button
                type="default"
                onClick={() => {
                  setValue('storageType', 'io2')
                  trigger('provisionedIOPS')
                  trigger('totalSize')
                  setAdvancedSettingsOpenState(true)
                }}
              >
                Change to High Performance SSD
              </Button>
            }
          />
        </div>
      </div>
      <div className="col-span-8">
        <DiskSpaceBar form={form} />
        {error && (
          <FormMessage message="Failed to load disk size data" type="error">
            {error?.message}
          </FormMessage>
        )}
        <DiskManagementDiskSizeReadReplicas
          isDirty={formState.dirtyFields.totalSize !== undefined}
          totalSize={(formState.defaultValues?.totalSize || 0) * 1.25}
          usedSize={mainDiskUsed}
          newTotalSize={watchedTotalSize * 1.25}
          oldStorageType={formState.defaultValues?.storageType as DiskType}
          newStorageType={getValues('storageType') as DiskType}
        />
      </div>
    </div>
  )
}
