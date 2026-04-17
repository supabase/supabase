import { InputVariants } from '@ui/components/shadcn/ui/input'
import { useParams } from 'common'
import { UseFormReturn } from 'react-hook-form'
import {
  cn,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  FormInputGroupInput,
  InputGroup,
  InputGroupAddon,
  InputGroupText,
} from 'ui'
import { Admonition } from 'ui-patterns'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

import { DiskStorageSchemaType } from '../DiskManagement.schema'
import { DISK_AUTOSCALE_CONFIG_DEFAULTS } from '../ui/DiskManagement.constants'
import { useDiskAutoscaleCustomConfigQuery } from '@/data/config/disk-autoscale-config-query'

type AutoScaleFieldProps = {
  form: UseFormReturn<DiskStorageSchemaType>
}

export const AutoScaleFields = ({ form }: AutoScaleFieldProps) => {
  const { ref: projectRef } = useParams()
  const {
    control,
    setValue,
    formState: { errors },
  } = form
  const { totalSize, growthPercent, maxSizeGb, minIncrementGb } = form.watch()

  const { error, isPending: isLoading, isError } = useDiskAutoscaleCustomConfigQuery({ projectRef })

  const _growthPercent = growthPercent ?? DISK_AUTOSCALE_CONFIG_DEFAULTS.growthPercent
  const _minIncrementGb = minIncrementGb ?? DISK_AUTOSCALE_CONFIG_DEFAULTS.minIncrementSize
  const _maxSizeGb = errors.maxSizeGb
    ? DISK_AUTOSCALE_CONFIG_DEFAULTS.maxSizeGb
    : (maxSizeGb ?? DISK_AUTOSCALE_CONFIG_DEFAULTS.maxSizeGb)

  const growthSize = Math.floor(totalSize * (_growthPercent / 100))
  const autoscaleGrowValue = Math.min(
    Math.max(Math.floor((totalSize * _growthPercent) / 100), _minIncrementGb),
    200
  )

  const totalSizeAfterGrowth = autoscaleGrowValue + totalSize
  const formattedTotalSizeAfterGrowth =
    totalSizeAfterGrowth < _maxSizeGb ? totalSizeAfterGrowth : _maxSizeGb
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
                !errors.growthPercent
                  ? `This amounts to ${growthSize} GB based on the current disk size of ${totalSize} GB`
                  : undefined
              }
              className="[&>div>span]:text-foreground-lighter"
            >
              <FormControl_Shadcn_ className="max-w-20">
                <InputGroup>
                  <FormInputGroupInput
                    {...field}
                    type="number"
                    value={field.value ?? undefined}
                    disabled={isError}
                    onChange={(e) => {
                      setValue(
                        'growthPercent',
                        e.target.value === '' ? null : e.target.valueAsNumber,
                        {
                          shouldDirty: true,
                          shouldValidate: true,
                        }
                      )
                    }}
                    placeholder={String(DISK_AUTOSCALE_CONFIG_DEFAULTS.growthPercent)}
                  />
                  <InputGroupAddon align="inline-end">
                    <InputGroupText>%</InputGroupText>
                  </InputGroupAddon>
                </InputGroup>
              </FormControl_Shadcn_>
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
                !!minIncrementGb && minIncrementGb > growthSize && !errors.minIncrementGb
                  ? `This value takes precedence as the minimum increment is larger than the growth percent`
                  : undefined
              }
              className="[&>div>span]:text-foreground-lighter"
            >
              <FormControl_Shadcn_ className="max-w-32">
                <InputGroup>
                  <FormInputGroupInput
                    {...field}
                    type="number"
                    value={field.value ?? undefined}
                    disabled={isError}
                    onChange={(e) => {
                      setValue(
                        'minIncrementGb',
                        e.target.value === '' ? null : e.target.valueAsNumber,
                        {
                          shouldDirty: true,
                          shouldValidate: true,
                        }
                      )
                    }}
                    placeholder={String(DISK_AUTOSCALE_CONFIG_DEFAULTS.minIncrementSize)}
                  />
                  <InputGroupAddon align="inline-end">
                    <InputGroupText>GB</InputGroupText>
                  </InputGroupAddon>
                </InputGroup>
              </FormControl_Shadcn_>
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
              <FormControl_Shadcn_ className="max-w-32">
                <InputGroup>
                  <FormInputGroupInput
                    {...field}
                    type="number"
                    value={field.value ?? undefined}
                    disabled={isError}
                    onChange={(e) => {
                      setValue('maxSizeGb', e.target.value === '' ? null : e.target.valueAsNumber, {
                        shouldDirty: true,
                        shouldValidate: true,
                      })
                    }}
                    placeholder={String(DISK_AUTOSCALE_CONFIG_DEFAULTS.maxSizeGb)}
                  />
                  <InputGroupAddon align="inline-end">
                    <InputGroupText>GB</InputGroupText>
                  </InputGroupAddon>
                </InputGroup>
              </FormControl_Shadcn_>
            </FormItemLayout>
          )
        }}
      />

      {
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
      }
    </>
  )
}
