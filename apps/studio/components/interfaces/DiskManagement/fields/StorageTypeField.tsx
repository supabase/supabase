import { UseFormReturn } from 'react-hook-form'

import { useParams } from 'common'
import { InlineLink } from 'components/ui/InlineLink'
import { useDiskAttributesQuery } from 'data/config/disk-attributes-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
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
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { IO2_AVAILABLE_REGIONS } from '../DiskManagement.constants'
import { DiskStorageSchemaType } from '../DiskManagement.schema'
import { DISK_LIMITS, DISK_TYPE_OPTIONS, DiskType } from '../ui/DiskManagement.constants'
import FormMessage from '../ui/FormMessage'

type StorageTypeFieldProps = {
  form: UseFormReturn<DiskStorageSchemaType>
  disableInput: boolean
}

export function StorageTypeField({ form, disableInput }: StorageTypeFieldProps) {
  const { control, trigger } = form
  const { data: project } = useSelectedProjectQuery()
  const { ref: projectRef } = useParams()

  const isIo2Supported = IO2_AVAILABLE_REGIONS.includes(project?.region ?? '')

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
               *
               * Only set it if the current configured IOPS is smaller than the min IOPS, otherwise leave at same IOPS
               */
              if (e === 'gp3') {
                if (
                  !form.getFieldState('provisionedIOPS').isDirty &&
                  (!form.getValues('provisionedIOPS') ||
                    form.getValues('provisionedIOPS') < DISK_LIMITS[DiskType.GP3].minIops)
                ) {
                  form.setValue('provisionedIOPS', DISK_LIMITS[DiskType.GP3].minIops)
                }
              } else {
                if (
                  !form.getFieldState('provisionedIOPS').isDirty &&
                  (!form.getValues('provisionedIOPS') ||
                    form.getValues('provisionedIOPS') < DISK_LIMITS[DiskType.IO2].minIops)
                ) {
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
                {DISK_TYPE_OPTIONS.map((item) => {
                  const disableIo2 = item.type === 'io2' && !isIo2Supported
                  return (
                    <Tooltip key={item.type}>
                      <TooltipTrigger asChild>
                        <SelectItem_Shadcn_
                          key={item.type}
                          disabled={disableInput || disableIo2}
                          value={item.type}
                          className={cn(disableIo2 && '!pointer-events-auto')}
                        >
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
                      </TooltipTrigger>
                      {disableIo2 && (
                        <TooltipContent side="right" className="w-64">
                          IO2 Volume Type is not available in your project's region (
                          {project?.region}). More information available{' '}
                          <InlineLink href="https://docs.aws.amazon.com/ebs/latest/userguide/provisioned-iops.html#io2-bx-considerations">
                            here
                          </InlineLink>
                          .
                        </TooltipContent>
                      )}
                    </Tooltip>
                  )
                })}
              </>
            </SelectContent_Shadcn_>
          </Select_Shadcn_>
          {error && <FormMessage type="error" message={error.message} />}
        </FormItemLayout>
      )}
    />
  )
}
