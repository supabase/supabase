import { useParams } from 'common'
import dayjs from 'dayjs'
import { RotateCcw } from 'lucide-react'
import { UseFormReturn } from 'react-hook-form'
import {
  Button,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  FormInputGroupInput,
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupText,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

import { DiskStorageSchemaType } from '../DiskManagement.schema'
import { calculateDiskSizePrice } from '../DiskManagement.utils'
import { BillingChangeBadge } from '../ui/BillingChangeBadge'
import { DiskType, PLAN_DETAILS } from '../ui/DiskManagement.constants'
import { DiskManagementDiskSizeReadReplicas } from '../ui/DiskManagementReadReplicas'
import { DiskSpaceBar } from '../ui/DiskSpaceBar'
import { DiskTypeRecommendationSection } from '../ui/DiskTypeRecommendationSection'
import FormMessage from '../ui/FormMessage'
import { DocsButton } from '@/components/ui/DocsButton'
import { useDiskAttributesQuery } from '@/data/config/disk-attributes-query'
import { useDiskUtilizationQuery } from '@/data/config/disk-utilization-query'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { DOCS_URL, GB } from '@/lib/constants'

type DiskSizeFieldProps = {
  form: UseFormReturn<DiskStorageSchemaType>
  disableInput: boolean
  setAdvancedSettingsOpenState: (state: boolean) => void
}

export function DiskSizeField({
  form,
  disableInput,
  setAdvancedSettingsOpenState,
}: DiskSizeFieldProps) {
  const { ref: projectRef } = useParams()
  const { control, formState, setValue, trigger, getValues, resetField, watch } = form
  const { data: org } = useSelectedOrganizationQuery()
  const { data: project } = useSelectedProjectQuery()

  const { error: diskAttributesError, isError: isDiskAttributesError } = useDiskAttributesQuery(
    { projectRef },
    { enabled: project && project.cloud_provider !== 'FLY' }
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

  const watchedStorageType = watch('storageType')
  const watchedTotalSize = watch('totalSize')

  const planId = org?.plan.id ?? 'free'

  const { includedDiskGB: includedDiskGBMeta } =
    PLAN_DETAILS?.[planId as keyof typeof PLAN_DETAILS] ?? {}
  const includedDiskGB = includedDiskGBMeta[watchedStorageType]

  const { defaultValues, dirtyFields, isDirty, errors } = formState
  const diskSizePrice = calculateDiskSizePrice({
    planId,
    oldSize: defaultValues?.totalSize || 0,
    oldStorageType: defaultValues?.storageType as DiskType,
    newSize: getValues('totalSize'),
    newStorageType: getValues('storageType') as DiskType,
  })

  const mainDiskUsed = Math.round(((diskUtil?.metrics.fs_used_bytes ?? 0) / GB) * 100) / 100

  return (
    <div id="disk-size" className="grid @xl:grid-cols-12 gap-5">
      <div className="col-span-4">
        <FormField_Shadcn_
          name="totalSize"
          control={control}
          render={({ field, fieldState: { isDirty } }) => (
            <FormItemLayout label="Disk Size" layout="vertical" id={field.name}>
              <FormControl_Shadcn_ className="max-w-32">
                <InputGroup>
                  <FormInputGroupInput
                    type="number"
                    id={field.name}
                    {...field}
                    disabled={disableInput || isError}
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
                  <InputGroupAddon align="inline-end">
                    <InputGroupText>GB</InputGroupText>
                    {isDirty ? (
                      <InputGroupButton
                        htmlType="button"
                        type="default"
                        size="tiny"
                        className="px-2 text-foreground-light"
                        onClick={() => {
                          resetField('totalSize')
                          trigger('provisionedIOPS')
                        }}
                        title="Reset"
                      >
                        <RotateCcw className="h-4 w-4" aria-hidden="true" />
                      </InputGroupButton>
                    ) : null}
                  </InputGroupAddon>
                </InputGroup>
              </FormControl_Shadcn_>
            </FormItemLayout>
          )}
        />
        <div className="flex flex-col gap-1">
          <BillingChangeBadge
            className="mt-1"
            beforePrice={Number(diskSizePrice.oldPrice)}
            afterPrice={Number(diskSizePrice.newPrice)}
            show={isDirty && !errors.totalSize && diskSizePrice.oldPrice !== diskSizePrice.newPrice}
          />
          <span className="text-foreground-lighter text-sm">
            {includedDiskGB > 0 &&
              org?.plan.id &&
              `Your plan includes ${includedDiskGB} GB of disk size for ${watchedStorageType}.`}

            <div className="mt-3">
              <DocsButton abbrev={false} href={`${DOCS_URL}/guides/platform/database-size`} />
            </div>
          </span>
          <DiskTypeRecommendationSection
            form={form}
            actions={
              <Button
                type="default"
                onClick={() => {
                  setValue('storageType', 'io2')
                  trigger('provisionedIOPS')
                  trigger('totalSize')
                  setAdvancedSettingsOpenState(true)
                }}
              >
                Change to High Performance SSD
              </Button>
            }
          />
        </div>
      </div>
      <div className="col-span-8">
        <DiskSpaceBar form={form} />

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
          isDirty={dirtyFields.totalSize !== undefined}
          totalSize={(defaultValues?.totalSize || 0) * 1.25}
          usedSize={mainDiskUsed}
          newTotalSize={watchedTotalSize * 1.25}
          oldStorageType={defaultValues?.storageType as DiskType}
          newStorageType={getValues('storageType') as DiskType}
        />
      </div>
    </div>
  )
}
