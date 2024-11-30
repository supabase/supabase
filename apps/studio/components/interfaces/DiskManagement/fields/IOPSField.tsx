import { UseFormReturn } from 'react-hook-form'

import { InputVariants } from '@ui/components/shadcn/ui/input'
import { useParams } from 'common'
import { useDiskAttributesQuery } from 'data/config/disk-attributes-query'
import { Button, cn, FormControl_Shadcn_, FormField_Shadcn_, Input_Shadcn_, Skeleton } from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { DiskStorageSchemaType } from '../DiskManagement.schema'
import {
  calculateComputeSizeRequiredForIops,
  calculateIOPSPrice,
  mapAddOnVariantIdToComputeSize,
} from '../DiskManagement.utils'
import { BillingChangeBadge } from '../ui/BillingChangeBadge'
import { ComputeSizeRecommendationSection } from '../ui/ComputeSizeRecommendationSection'
import {
  COMPUTE_BASELINE_IOPS,
  DiskType,
  RESTRICTED_COMPUTE_FOR_IOPS_ON_GP3,
} from '../ui/DiskManagement.constants'
import { DiskManagementIOPSReadReplicas } from '../ui/DiskManagementReadReplicas'
import FormMessage from '../ui/FormMessage'
import { InputPostTab } from '../ui/InputPostTab'

type IOPSFieldProps = {
  form: UseFormReturn<DiskStorageSchemaType>
  disableInput: boolean
}

export function IOPSField({ form, disableInput }: IOPSFieldProps) {
  const { ref: projectRef } = useParams()
  const { control, formState, setValue, trigger, getValues, watch } = form

  const watchedStorageType = watch('storageType')
  const watchedComputeSize = watch('computeSize')
  const watchedIOPS = watch('provisionedIOPS') ?? 0

  const { isLoading, error, isError } = useDiskAttributesQuery({ projectRef })

  const iopsPrice = calculateIOPSPrice({
    oldStorageType: formState.defaultValues?.storageType as DiskType,
    oldProvisionedIOPS: formState.defaultValues?.provisionedIOPS || 0,
    newStorageType: getValues('storageType') as DiskType,
    newProvisionedIOPS: getValues('provisionedIOPS'),
  })

  const disableIopsInput =
    RESTRICTED_COMPUTE_FOR_IOPS_ON_GP3.includes(watchedComputeSize) && watchedStorageType === 'gp3'

  return (
    <FormField_Shadcn_
      control={control}
      name="provisionedIOPS"
      render={({ field }) => {
        const reccomendedComputeSize = calculateComputeSizeRequiredForIops(watchedIOPS)
        return (
          <FormItemLayout
            layout="horizontal"
            label="IOPS"
            id={field.name}
            description={
              <span className="flex flex-col gap-y-2">
                <p>Use higher IOPS for high-throughput apps.</p>
                <ComputeSizeRecommendationSection
                  form={form}
                  actions={
                    <Button
                      type="default"
                      onClick={() => {
                        setValue('computeSize', reccomendedComputeSize ?? 'ci_nano')
                        trigger('provisionedIOPS')
                      }}
                    >
                      Update to {mapAddOnVariantIdToComputeSize(reccomendedComputeSize)}
                    </Button>
                  }
                />
                {!formState.errors.provisionedIOPS && (
                  <DiskManagementIOPSReadReplicas
                    isDirty={formState.dirtyFields.provisionedIOPS !== undefined}
                    oldIOPS={formState.defaultValues?.provisionedIOPS ?? 0}
                    newIOPS={field.value}
                    oldStorageType={formState.defaultValues?.storageType as DiskType}
                    newStorageType={getValues('storageType') as DiskType}
                  />
                )}
              </span>
            }
            labelOptional={
              <>
                <BillingChangeBadge
                  show={
                    (watchedStorageType !== formState.defaultValues?.storageType ||
                      (watchedStorageType === 'gp3' &&
                        field.value !== formState.defaultValues?.provisionedIOPS)) &&
                    !formState.errors.provisionedIOPS &&
                    !disableIopsInput
                  }
                  beforePrice={Number(iopsPrice.oldPrice)}
                  afterPrice={Number(iopsPrice.newPrice)}
                  className="mb-2"
                />
                <p className="text-foreground-lighter">Input/output operations per second.</p>
              </>
            }
          >
            <InputPostTab label="IOPS">
              {isLoading ? (
                <div
                  className={cn(InputVariants({ size: 'small' }), 'w-32 font-mono rounded-r-none')}
                >
                  <Skeleton className="w-10 h-4" />
                </div>
              ) : (
                <FormControl_Shadcn_>
                  <Input_Shadcn_
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
                    disabled={disableInput || disableIopsInput || isError}
                    onChange={(e) => {
                      setValue('provisionedIOPS', e.target.valueAsNumber, {
                        shouldDirty: true,
                        shouldValidate: true,
                      })
                    }}
                  />
                </FormControl_Shadcn_>
              )}
            </InputPostTab>
            {error && <FormMessage type="error" message={error.message} />}
          </FormItemLayout>
        )
      }}
    />
  )
}
