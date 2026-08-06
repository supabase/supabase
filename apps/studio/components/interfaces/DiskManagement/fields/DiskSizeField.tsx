import { useParams } from 'common'
import dayjs from 'dayjs'
import { RotateCcw } from 'lucide-react'
import { useFormState, useWatch, type UseFormReturn } from 'react-hook-form'
import {
  Button,
  FormControl,
  FormField,
  FormInputGroupInput,
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupText,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

import { DiskStorageSchemaType } from '../DiskManagement.schema'
import { DiskType, PLAN_DETAILS } from '../ui/DiskManagement.constants'
import { DiskManagementDiskSizeReadReplicas } from '../ui/DiskManagementReadReplicas'
import { DiskTypeRecommendationSection } from '../ui/DiskTypeRecommendationSection'
import FormMessage from '../ui/FormMessage'
import { useDiskAttributesQuery } from '@/data/config/disk-attributes-query'
import { useDiskUtilizationQuery } from '@/data/config/disk-utilization-query'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { GB } from '@/lib/constants'

type DiskSizeFieldProps = {
  form: UseFormReturn<DiskStorageSchemaType>
  disableInput: boolean
}

export function DiskSizeField({ form, disableInput }: DiskSizeFieldProps) {
  const { ref: projectRef } = useParams()
  const { control, setValue, trigger, resetField } = form
  const { data: org } = useSelectedOrganizationQuery()
  const { data: project } = useSelectedProjectQuery()

  const { error: diskAttributesError, isError: isDiskAttributesError } = useDiskAttributesQuery(
    { projectRef },
    { enabled: !!project }
  )

  const {
    data: diskUtil,
    error: diskUtilError,
    isError: isDiskUtilizationError,
  } = useDiskUtilizationQuery(
    {
      projectRef: projectRef,
    },
    { enabled: project && project.cloud_provider !== 'FLY' }
  )

  const error = diskUtilError || diskAttributesError
  const isError = isDiskUtilizationError || isDiskAttributesError

  // coming up typically takes 5 minutes, and the request is cached for 5 mins
  // so doing less than 10 mins to account for both
  const isProjectNew =
    dayjs.utc().diff(dayjs.utc(project?.inserted_at), 'minute') < 10 ||
    project?.status === 'COMING_UP'

  const watchedStorageType = useWatch({ control, name: 'storageType' })
  const watchedTotalSize = useWatch({ control, name: 'totalSize' })

  const planId = org?.plan.id ?? 'free'

  const { includedDiskGB: includedDiskGBMeta } =
    PLAN_DETAILS?.[planId as keyof typeof PLAN_DETAILS] ?? {}
  const includedDiskGB = includedDiskGBMeta[watchedStorageType]

  const { defaultValues, dirtyFields } = useFormState({ control })

  const mainDiskUsed = Math.round(((diskUtil?.metrics.fs_used_bytes ?? 0) / GB) * 100) / 100

  return (
    <FormField
      name="totalSize"
      control={control}
      render={({ field, fieldState: { isDirty } }) => (
        <FormItemLayout
          label="Disk size"
          layout="flex-row-reverse"
          id={field.name}
          description={
            <div className="flex flex-col gap-y-3">
              {includedDiskGB > 0 && org?.plan.id && (
                <p>
                  Your plan includes up to {includedDiskGB} GB of {watchedStorageType} storage.
                </p>
              )}

              <DiskTypeRecommendationSection
                form={form}
                actions={
                  <Button
                    variant="default"
                    onClick={() => {
                      setValue('storageType', 'io2', { shouldDirty: true })
                      trigger('provisionedIOPS')
                      trigger('totalSize')
                    }}
                  >
                    Change to High Performance SSD
                  </Button>
                }
              />

              {isProjectNew ? (
                <FormMessage
                  message="Disk size data is not available for ~10 minutes after project creation"
                  type="error"
                />
              ) : (
                error && (
                  <FormMessage message="Failed to load disk size data" type="error">
                    {error?.message}
                  </FormMessage>
                )
              )}

              <DiskManagementDiskSizeReadReplicas
                isDirty={
                  dirtyFields.totalSize !== undefined ||
                  watchedStorageType !== defaultValues?.storageType
                }
                totalSize={(defaultValues?.totalSize || 0) * 1.25}
                usedSize={mainDiskUsed}
                newTotalSize={watchedTotalSize * 1.25}
                oldStorageType={defaultValues?.storageType as DiskType}
                newStorageType={watchedStorageType as DiskType}
              />
            </div>
          }
        >
          <FormControl className="max-w-32">
            <InputGroup>
              <FormInputGroupInput
                type="number"
                id={field.name}
                {...field}
                disabled={disableInput || isError}
                onWheel={(e) => e.currentTarget.blur()}
                onChange={(e) => {
                  // valueAsNumber is NaN while the input is empty, which would otherwise
                  // propagate into the price calculations and the read replica sizing
                  const value = e.target.valueAsNumber
                  setValue('totalSize', Number.isNaN(value) ? 0 : value, {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                  trigger('provisionedIOPS')
                  trigger('throughput')
                }}
                min={includedDiskGB}
              />
              <InputGroupAddon align="inline-end">
                <InputGroupText>GB</InputGroupText>
                {isDirty ? (
                  <InputGroupButton
                    type="button"
                    variant="default"
                    size="tiny"
                    className="px-2 text-foreground-light"
                    aria-label="Reset disk size"
                    onClick={() => {
                      resetField('totalSize')
                      trigger('provisionedIOPS')
                      trigger('throughput')
                    }}
                    title="Reset"
                  >
                    <RotateCcw className="h-4 w-4" aria-hidden="true" />
                  </InputGroupButton>
                ) : null}
              </InputGroupAddon>
            </InputGroup>
          </FormControl>
        </FormItemLayout>
      )}
    />
  )
}
