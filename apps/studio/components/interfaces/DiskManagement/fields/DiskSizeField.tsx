import { FormField_Shadcn_, FormControl_Shadcn_, Input_Shadcn_ } from 'ui'
import { ComputeBadge } from 'ui-patterns'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { BillingChangeBadge } from '../BillingChangeBadge'
import { InputPostTab } from '../InputPostTab'
import { InputResetButton } from '../InputResetButton'
import DiskSpaceBar from '../DiskSpaceBar'

import { DiskType, PLAN_DETAILS } from '../DiskManagement.constants'
import { UseFormReturn } from 'react-hook-form'
import { DiskStorageSchemaType } from '../DiskManagementPanel.schema'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { calculateDiskSizePrice } from '../DiskManagement.utils'
import { DiskManagementDiskSizeReadReplicas } from '../DiskManagementReadReplicas'
import { useOrgSubscriptionQuery } from 'data/subscriptions/org-subscription-query'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { useDiskUtilizationQuery } from 'data/config/disk-utilization-query'
import { useParams } from 'common'
import { GB } from 'lib/constants'

type DiskSizeFieldProps = {
  form: UseFormReturn<DiskStorageSchemaType>
  disableInput: boolean
}

export function DiskSizeField({ form, disableInput }: DiskSizeFieldProps) {
  const { ref: projectRef } = useParams()
  const { control, formState, setValue, trigger, getValues, resetField, watch } = form
  const { project } = useProjectContext()
  const org = useSelectedOrganization()

  const {
    data: subscription,
    isLoading: isSubscriptionLoading,
    error: subscriptionError,
  } = useOrgSubscriptionQuery({
    orgSlug: org?.slug,
  })
  const {
    data: diskUtil,
    isLoading: isDiskUtilizationLoading,
    error: diskUtilError,
    isSuccess: isDiskUtilizationSuccess,
  } = useDiskUtilizationQuery({
    projectRef: projectRef,
  })

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
            >
              <div className="relative flex gap-2 items-center">
                <InputPostTab label="GB">
                  <FormControl_Shadcn_>
                    <Input_Shadcn_
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
                  onClick={() => {
                    resetField('totalSize')
                    trigger('provisionedIOPS')
                  }}
                />
              </div>
            </FormItemLayout>
          )}
        />
      </div>
      <div className="col-span-8">
        <DiskSpaceBar
          showNewBar={formState.dirtyFields.totalSize !== undefined}
          totalSize={formState.defaultValues?.totalSize || 0}
          usedSize={mainDiskUsed}
          newTotalSize={watchedTotalSize}
        />
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
