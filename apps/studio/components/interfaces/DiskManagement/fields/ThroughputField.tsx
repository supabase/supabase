import { AnimatePresence, motion } from 'framer-motion'
import { useEffect } from 'react'
import { UseFormReturn } from 'react-hook-form'

import { InputVariants } from '@ui/components/shadcn/ui/input'
import { useParams } from 'common'
import { useDiskAttributesQuery } from 'data/config/disk-attributes-query'
import { cn, FormControl_Shadcn_, FormField_Shadcn_, Input_Shadcn_, Skeleton } from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { DiskStorageSchemaType } from '../DiskManagement.schema'
import { calculateThroughputPrice } from '../DiskManagement.utils'
import { BillingChangeBadge } from '../ui/BillingChangeBadge'
import {
  COMPUTE_BASELINE_THROUGHPUT,
  DiskType,
  RESTRICTED_COMPUTE_FOR_IOPS_ON_GP3,
  THROUGHPUT_RANGE,
} from '../ui/DiskManagement.constants'
import { DiskManagementThroughputReadReplicas } from '../ui/DiskManagementReadReplicas'
import FormMessage from '../ui/FormMessage'
import { InputPostTab } from '../ui/InputPostTab'

type ThroughputFieldProps = {
  form: UseFormReturn<DiskStorageSchemaType>
  disableInput: boolean
}

export function ThroughputField({ form, disableInput }: ThroughputFieldProps) {
  const { ref: projectRef } = useParams()

  const { control, formState, setValue, getValues, watch } = form

  const watchedStorageType = watch('storageType')
  const watchedTotalSize = watch('totalSize')
  const watchedComputeSize = watch('computeSize')
  const throughput_mbps = formState.defaultValues?.throughput

  const { isLoading, error } = useDiskAttributesQuery({ projectRef })

  const throughputPrice = calculateThroughputPrice({
    storageType: form.getValues('storageType') as DiskType,
    newThroughput: form.getValues('throughput') || 0,
    oldThroughput: form.formState.defaultValues?.throughput || 0,
  })

  const disableIopsInput =
    RESTRICTED_COMPUTE_FOR_IOPS_ON_GP3.includes(watchedComputeSize) && watchedStorageType === 'gp3'

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

  return (
    <AnimatePresence initial={false}>
      {getValues('storageType') === 'gp3' && (
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
                label="Throughput"
                layout="horizontal"
                description={
                  <span className="flex flex-col gap-y-2">
                    <p>Higher throughput suits applications with high data transfer needs.</p>
                    {!formState.errors.throughput && (
                      <DiskManagementThroughputReadReplicas
                        isDirty={formState.dirtyFields.throughput !== undefined}
                        oldThroughput={throughput_mbps ?? 0}
                        newThroughput={field.value ?? 0}
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
                        formState.isDirty &&
                        formState.dirtyFields.throughput &&
                        !formState.errors.throughput
                      }
                      beforePrice={Number(throughputPrice.oldPrice)}
                      afterPrice={Number(throughputPrice.newPrice)}
                      className="mb-2"
                    />
                    <p className="text-foreground-lighter">
                      Amount of data read/written per second.
                    </p>
                  </>
                }
              >
                <InputPostTab label="MiB/s">
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
                        disabled={disableInput || disableIopsInput || watchedStorageType === 'io2'}
                      />
                    </FormControl_Shadcn_>
                  )}
                </InputPostTab>
                {error && <FormMessage type="error" message={error.message} />}
              </FormItemLayout>
            )}
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
