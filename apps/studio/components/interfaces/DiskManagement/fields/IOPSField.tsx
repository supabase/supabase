import { components } from 'api-types'
import { UseFormReturn } from 'react-hook-form'
import { Button, FormControl_Shadcn_, FormField_Shadcn_, Input_Shadcn_ } from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { BillingChangeBadge } from '../ui/BillingChangeBadge'
import { ComputeSizeReccomendationSection } from '../ui/ComputeSizeReccomendationSection'
import {
  COMPUTE_BASELINE_IOPS,
  DiskType,
  IOPS_RANGE,
  RESTRICTED_COMPUTE_FOR_IOPS_ON_GP3,
} from '../ui/DiskManagement.constants'
import { calculateComputeSizeRequiredForIops, calculateIOPSPrice } from '../DiskManagement.utils'
import { DiskStorageSchemaType } from '../DiskManagement.schema'
import { DiskManagementIOPSReadReplicas } from '../ui/DiskManagementReadReplicas'
import { InputPostTab } from '../ui/InputPostTab'

type IOPSFieldProps = {
  form: UseFormReturn<DiskStorageSchemaType>
  disableInput: boolean
}

export function IOPSField({ form, disableInput }: IOPSFieldProps) {
  const { control, formState, setValue, trigger, getValues, watch } = form

  const watchedStorageType = watch('storageType')
  const watchedComputeSize = watch('computeSize')
  const watchedIOPS = watch('provisionedIOPS') ?? 0

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
            description={
              <div className="flex flex-col gap-y-2">
                <ComputeSizeReccomendationSection
                  computeSize={watchedComputeSize}
                  iops={watchedIOPS}
                  actions={
                    <Button
                      type="default"
                      onClick={() => {
                        setValue(
                          'computeSize',
                          `ci_${reccomendedComputeSize.toLocaleLowerCase()}` as components['schemas']['AddonVariantId']
                        )
                        trigger('provisionedIOPS')
                      }}
                    >
                      Update to {reccomendedComputeSize}
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
              </div>
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
                <p>Input/output operations per second.</p>
                <p>Higher IOPS for high-throughput apps.</p>
              </>
            }
          >
            <InputPostTab label="IOPS">
              <FormControl_Shadcn_>
                <Input_Shadcn_
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
        )
      }}
    />
  )
}
