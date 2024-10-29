import { useParams } from 'common'
import { useDiskAttributesQuery } from 'data/config/disk-attributes-query'
import { UseFormReturn } from 'react-hook-form'
import {
  Badge,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  Select_Shadcn_,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
  Skeleton,
  buttonVariants,
  cn,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { DiskStorageSchemaType } from '../DiskManagement.schema'
import { DISK_TYPE_OPTIONS } from '../ui/DiskManagement.constants'
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
            onValueChange={async (e) => {
              field.onChange(e)
              // only trigger provisionedIOPS due to other input being hidden
              await trigger('provisionedIOPS')
              await trigger('totalSize')
              trigger('provisionedIOPS')
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
