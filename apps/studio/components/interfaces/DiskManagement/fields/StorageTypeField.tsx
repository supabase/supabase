import { UseFormReturn } from 'react-hook-form'

import { useParams } from 'common'
import { useDiskAttributesQuery } from 'data/config/disk-attributes-query'
import {
  Badge,
  buttonVariants,
  cn,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  Select_Shadcn_,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
  Skeleton,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { DiskStorageSchemaType } from '../DiskManagement.schema'
import { DISK_LIMITS, DISK_TYPE_OPTIONS, DiskType } from '../ui/DiskManagement.constants'
import FormMessage from '../ui/FormMessage'

type StorageTypeFieldProps = {
  form: UseFormReturn<DiskStorageSchemaType>
  disableInput: boolean
}

export function StorageTypeField({ form, disableInput }: StorageTypeFieldProps) {
  const { ref: projectRef } = useParams()
  const { control, trigger } = form

  const { isLoading, error, isError } = useDiskAttributesQuery({ projectRef })

  return (
    <FormField_Shadcn_
      name="storageType"
      control={control}
      render={({ field }) => (
        <FormItemLayout layout="horizontal" label="Storage type">
          <Select_Shadcn_
            {...field}
            onValueChange={async (e: DiskType) => {
              field.onChange(e)

              /**
               * Set default IOPS if not dirty
               * This is to ensure that the IOPS is set to the minimum value if the user has not changed it
               */
              if (e === 'gp3') {
                if (!form.getFieldState('provisionedIOPS').isDirty) {
                  form.setValue('provisionedIOPS', DISK_LIMITS[DiskType.GP3].minIops)
                }
              } else {
                if (!form.getFieldState('provisionedIOPS').isDirty) {
                  form.setValue('provisionedIOPS', DISK_LIMITS[DiskType.IO2].minIops)
                }
              }

              // trigger other fields to validate
              await trigger('provisionedIOPS')
              await trigger('totalSize')
            }}
            defaultValue={field.value}
            disabled={disableInput || isError}
          >
            {isLoading ? (
              <Skeleton
                className={cn(
                  buttonVariants({ size: 'small' }),
                  'h-14 min-w-[420px] duration-[2s]'
                )}
              />
            ) : (
              <FormControl_Shadcn_>
                <SelectTrigger_Shadcn_ className="h-14 max-w-[420px]">
                  <SelectValue_Shadcn_ />
                </SelectTrigger_Shadcn_>
              </FormControl_Shadcn_>
            )}
            <SelectContent_Shadcn_>
              <>
                {DISK_TYPE_OPTIONS.map((item) => (
                  <SelectItem_Shadcn_ key={item.type} disabled={disableInput} value={item.type}>
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
          {error && <FormMessage type="error" message={error.message} />}
        </FormItemLayout>
      )}
    />
  )
}
