import { UseFormReturn } from 'react-hook-form'

import { InputVariants } from '@ui/components/shadcn/ui/input'
import { useParams } from 'common'
import { useDiskAutoscaleCustomConfigQuery } from 'data/config/disk-autoscale-config-query'
import { cn, FormControl_Shadcn_, FormField_Shadcn_, Input_Shadcn_, Skeleton } from 'ui'
import { Admonition } from 'ui-patterns'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { DiskStorageSchemaType } from '../DiskManagement.schema'
import FormMessage from '../ui/FormMessage'
import { InputPostTab } from '../ui/InputPostTab'

type AutoScaleFieldProps = {
  form: UseFormReturn<DiskStorageSchemaType>
}

export const AutoScaleFields = ({ form }: AutoScaleFieldProps) => {
  const { ref: projectRef } = useParams()
  const { control, setValue } = form
  const { totalSize, growthPercent, maxSizeGb, minIncrementGb } = form.watch()

  const { error, isLoading, isError } = useDiskAutoscaleCustomConfigQuery({ projectRef })

  const growthSize = totalSize * ((growthPercent ?? 0) / 100)
  const autoscaleGrowValue = (minIncrementGb ?? 0) > growthSize ? minIncrementGb ?? 0 : growthSize

  const totalSizeAfterGrowth = autoscaleGrowValue + totalSize
  const formattedTotalSizeAfterGrowth =
    totalSizeAfterGrowth < (maxSizeGb ?? 0) ? totalSizeAfterGrowth : maxSizeGb ?? 0
  const formattedGrowValue = formattedTotalSizeAfterGrowth - totalSize

  return (
    <>
      <FormField_Shadcn_
        name="growthPercent"
        control={control}
        render={({ field }) => {
          return (
            <FormItemLayout
              layout="horizontal"
              label="Autoscale growth percent"
              id={field.name}
              labelOptional="Percentage of current disk size to grow"
              description={
                !!growthSize
                  ? `This amounts to ${growthSize} GB based on the current disk size of ${totalSize} GB`
                  : undefined
              }
              className="[&>div>span]:text-foreground-lighter"
            >
              <InputPostTab label="%">
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
                      {...field}
                      type="number"
                      className="flex-grow font-mono rounded-r-none max-w-20"
                      value={field.value ?? 0}
                      disabled={isError}
                      onChange={(e) => {
                        setValue('growthPercent', e.target.valueAsNumber, {
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

      <FormField_Shadcn_
        name="minIncrementGb"
        control={control}
        render={({ field }) => {
          return (
            <FormItemLayout
              layout="horizontal"
              label="Minimum increment"
              id={field.name}
              labelOptional="Minimum value to autoscale disk size by"
              description={
                !!minIncrementGb && minIncrementGb > growthSize
                  ? `This value takes precedence as the minimum increment is larger than the growth percent`
                  : undefined
              }
              className="[&>div>span]:text-foreground-lighter"
            >
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
                      {...field}
                      type="number"
                      className="flex-grow font-mono rounded-r-none max-w-32"
                      value={field.value ?? 0}
                      disabled={isError}
                      onChange={(e) => {
                        setValue('minIncrementGb', e.target.valueAsNumber, {
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

      <FormField_Shadcn_
        name="maxSizeGb"
        control={control}
        render={({ field }) => {
          return (
            <FormItemLayout
              layout="horizontal"
              label="Maximum disk size"
              id={field.name}
              labelOptional="Maximum size that the disk can grow to"
              className="[&>div>span]:text-foreground-lighter"
            >
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
                      {...field}
                      type="number"
                      className="flex-grow font-mono rounded-r-none max-w-32"
                      value={field.value ?? 0}
                      disabled={isError}
                      onChange={(e) => {
                        setValue('maxSizeGb', e.target.valueAsNumber, {
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

      {!!growthPercent && !!minIncrementGb && !!maxSizeGb && (
        <Admonition type="default" showIcon={false} className="[&>div]:text-foreground-light">
          Disk size will automatically be expanded by{' '}
          <span className="text-foreground">
            {String(formattedGrowValue).length > 4
              ? formattedGrowValue.toFixed(2)
              : formattedGrowValue}{' '}
            GB
          </span>{' '}
          to a total of <span className="text-foreground">{formattedTotalSizeAfterGrowth} GB</span>{' '}
          when the database reaches 90% of the disk size
        </Admonition>
      )}
    </>
  )
}
