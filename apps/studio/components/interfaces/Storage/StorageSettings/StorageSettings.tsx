import { zodResolver } from '@hookform/resolvers/zod'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useEffect, useMemo, useState } from 'react'
import { SubmitHandler, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import * as z from 'zod'

import { useParams } from 'common'
import { ScaffoldSection } from 'components/layouts/Scaffold'
import AlertError from 'components/ui/AlertError'
import { InlineLink } from 'components/ui/InlineLink'
import NoPermission from 'components/ui/NoPermission'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import UpgradeToPro from 'components/ui/UpgradeToPro'
import { useProjectStorageConfigQuery } from 'data/config/project-storage-config-query'
import { useProjectStorageConfigUpdateUpdateMutation } from 'data/config/project-storage-config-update-mutation'
import { useBucketsQuery } from 'data/storage/buckets-query'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { formatBytes } from 'lib/helpers'
import {
  Button,
  Card,
  CardContent,
  CardFooter,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  Form_Shadcn_,
  Input_Shadcn_,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
  Select_Shadcn_,
  Switch,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import {
  STORAGE_FILE_SIZE_LIMIT_MAX_BYTES_CAPPED,
  STORAGE_FILE_SIZE_LIMIT_MAX_BYTES_FREE_PLAN,
  STORAGE_FILE_SIZE_LIMIT_MAX_BYTES_UNCAPPED,
  StorageSizeUnits,
} from './StorageSettings.constants'
import { convertFromBytes, convertToBytes } from './StorageSettings.utils'

interface StorageSettingsState {
  fileSizeLimit: number
  unit: StorageSizeUnits
  imageTransformationEnabled: boolean
}

const StorageSettings = () => {
  const { ref: projectRef } = useParams()
  const canReadStorageSettings = useCheckPermissions(PermissionAction.STORAGE_ADMIN_READ, '*')
  const canUpdateStorageSettings = useCheckPermissions(PermissionAction.STORAGE_ADMIN_WRITE, '*')

  const {
    data: config,
    error,
    isLoading,
    isSuccess,
    isError,
  } = useProjectStorageConfigQuery({ projectRef })

  const { data: organization } = useSelectedOrganizationQuery()
  const isFreeTier = organization?.plan.id === 'free'
  const isSpendCapOn =
    organization?.plan.id === 'pro' && organization?.usage_billing_enabled === false

  const { data: buckets = [], isLoading: isLoadingBuckets } = useBucketsQuery({ projectRef })

  // Calculate the minimum file size limit from existing buckets
  const minBucketFileSizeLimit = useMemo(() => {
    const bucketLimits = buckets
      .filter((bucket: any) => bucket.file_size_limit && bucket.file_size_limit > 0)
      .map((bucket: any) => bucket.file_size_limit!)

    return bucketLimits.length > 0 ? Math.min(...bucketLimits) : 0
  }, [buckets])

  const [initialValues, setInitialValues] = useState<StorageSettingsState>({
    fileSizeLimit: 0,
    unit: StorageSizeUnits.BYTES,
    imageTransformationEnabled: !isFreeTier,
  })

  useEffect(() => {
    if (isSuccess && config) {
      const { fileSizeLimit, features } = config
      const { value, unit } = convertFromBytes(fileSizeLimit ?? 0)
      const imageTransformationEnabled = features?.imageTransformation?.enabled ?? !isFreeTier

      setInitialValues({
        fileSizeLimit: value,
        unit: unit,
        imageTransformationEnabled,
      })

      // Reset the form values when the config values load
      form.reset({
        fileSizeLimit: value,
        unit: unit,
        imageTransformationEnabled,
      })
    }
  }, [isSuccess, config])

  const maxBytes = useMemo(() => {
    if (organization?.plan.id === 'free') {
      return STORAGE_FILE_SIZE_LIMIT_MAX_BYTES_FREE_PLAN
    } else if (organization?.usage_billing_enabled) {
      return STORAGE_FILE_SIZE_LIMIT_MAX_BYTES_UNCAPPED
    } else {
      return STORAGE_FILE_SIZE_LIMIT_MAX_BYTES_CAPPED
    }
  }, [organization])

  const FormSchema = z
    .object({
      fileSizeLimit: z.coerce.number(),
      unit: z.nativeEnum(StorageSizeUnits),
      imageTransformationEnabled: z.boolean(),
    })
    .superRefine((data, ctx) => {
      const { unit, fileSizeLimit } = data
      const { value: formattedMaxLimit } = convertFromBytes(maxBytes, unit)

      if (fileSizeLimit > formattedMaxLimit) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Maximum limit is up to ${formattedMaxLimit.toLocaleString()} ${unit}.`,
          path: ['fileSizeLimit'],
        })
      }

      // Validate that global limit is not smaller than any bucket's limit
      if (minBucketFileSizeLimit > 0 && !isLoadingBuckets && buckets.length > 0) {
        const { value: formattedMinBucketLimit } = convertFromBytes(minBucketFileSizeLimit, unit)

        if (fileSizeLimit < formattedMinBucketLimit) {
          // Get buckets that would be affected by this too-small global limit
          const affectedBuckets = buckets
            .filter((bucket: any) => bucket.file_size_limit && bucket.file_size_limit > 0)
            .map((bucket: any) => ({
              name: bucket.name,
              limit: bucket.file_size_limit!,
              formattedLimit: convertFromBytes(bucket.file_size_limit!, unit).value,
            }))
            .filter((bucket) => bucket.formattedLimit > fileSizeLimit)
            .sort((a, b) => b.formattedLimit - a.formattedLimit) // Sort by limit descending

          if (affectedBuckets.length > 0) {
            const primaryBucket = affectedBuckets[0]
            const otherBucketsCount = affectedBuckets.length - 1

            let errorMessage = `Cannot set global limit lower than that of individual buckets. Remove or decrease the limit on ${primaryBucket.name} (${formatBytes(primaryBucket.limit)})`

            if (otherBucketsCount > 0) {
              errorMessage += ` +${otherBucketsCount} other bucket${otherBucketsCount === 1 ? '' : 's'}`
            }
            errorMessage += ` first.`

            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: errorMessage,
              path: ['fileSizeLimit'],
            })
          }
        }
      }
    })

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: initialValues,
  })
  const { fileSizeLimit: limit, unit: storageUnit } = form.watch()

  const { mutate: updateStorageConfig, isLoading: isUpdating } =
    useProjectStorageConfigUpdateUpdateMutation({
      onSuccess: () => {
        toast.success('Successfully updated storage settings')
      },
    })

  const onSubmit: SubmitHandler<z.infer<typeof FormSchema>> = async (data) => {
    if (!projectRef) return console.error('Project ref is required')
    if (!config) return console.error('Storage config is required')

    // Server-side validation: Check if global limit would be smaller than any bucket's limit
    if (!isLoadingBuckets && buckets.length > 0) {
      const newGlobalLimitInBytes = convertToBytes(data.fileSizeLimit, data.unit)

      const bucketsWithLimits = buckets.filter(
        (bucket: any) => bucket.file_size_limit && bucket.file_size_limit > 0
      )

      const conflictingBuckets = bucketsWithLimits.filter(
        (bucket: any) => bucket.file_size_limit! > newGlobalLimitInBytes
      )

      if (conflictingBuckets.length > 0) {
        const primaryBucket = conflictingBuckets[0]
        const otherBucketsCount = conflictingBuckets.length - 1

        let errorMessage = `Cannot set global limit lower than the limit set on ${primaryBucket.name} (${formatBytes(primaryBucket.file_size_limit!)})`

        if (otherBucketsCount > 0) {
          errorMessage += ` +${otherBucketsCount} other bucket${otherBucketsCount === 1 ? '' : 's'}`
        }

        errorMessage += '. Remove or decrease those limits first.'

        toast.error(errorMessage)
        return
      }
    }

    updateStorageConfig({
      projectRef,
      fileSizeLimit: convertToBytes(data.fileSizeLimit, data.unit),
      features: {
        imageTransformation: { enabled: data.imageTransformationEnabled },
        s3Protocol: { enabled: config.features.s3Protocol.enabled },
      },
    })
  }

  const formId = 'storage-settings-form'

  if (!canReadStorageSettings) {
    return <NoPermission resourceText="view storage upload limit settings" />
  }

  return (
    <ScaffoldSection isFullWidth>
      <Form_Shadcn_ {...form}>
        {isLoading && <GenericSkeletonLoader />}
        {isError && (
          <AlertError error={error} subject="Failed to retrieve project's storage configuration" />
        )}
        {isSuccess && (
          <form id={formId} className="" onSubmit={form.handleSubmit(onSubmit)}>
            <Card>
              <CardContent className="pt-6">
                <FormField_Shadcn_
                  control={form.control}
                  name="imageTransformationEnabled"
                  render={({ field }) => (
                    <FormItemLayout
                      layout="flex-row-reverse"
                      label="Enable Image Transformation"
                      description={
                        <>
                          Optimize and resize images on the fly.{' '}
                          <InlineLink href="https://supabase.com/docs/guides/storage/serving/image-transformations">
                            Learn more
                          </InlineLink>
                          .
                        </>
                      }
                    >
                      <FormControl_Shadcn_>
                        <Switch
                          size="large"
                          disabled={isFreeTier}
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl_Shadcn_>
                    </FormItemLayout>
                  )}
                />
              </CardContent>

              <CardContent>
                <FormField_Shadcn_
                  control={form.control}
                  name="fileSizeLimit"
                  render={({ field }) => (
                    <FormItemLayout
                      layout="flex-row-reverse"
                      label="Global file size limit"
                      description={
                        <>
                          Restrict the size of files uploaded across all buckets.{' '}
                          {isLoadingBuckets && (
                            <span className="text-foreground-light">
                              {' '}
                              Loading bucket information...
                            </span>
                          )}{' '}
                          <InlineLink href="https://supabase.com/docs/guides/storage/uploads/file-limits">
                            Learn more
                          </InlineLink>
                          .
                        </>
                      }
                    >
                      <FormControl_Shadcn_>
                        <div className="flex items-center gap-2">
                          <Input_Shadcn_
                            type="number"
                            {...field}
                            className="w-full"
                            disabled={isFreeTier || !canUpdateStorageSettings}
                          />
                          <FormField_Shadcn_
                            control={form.control}
                            name="unit"
                            render={({ field: unitField }) => (
                              <Select_Shadcn_
                                value={unitField.value}
                                onValueChange={unitField.onChange}
                                disabled={isFreeTier || !canUpdateStorageSettings}
                              >
                                <SelectTrigger_Shadcn_ className="w-[180px]">
                                  <SelectValue_Shadcn_ placeholder="Choose a prefix">
                                    {storageUnit}
                                  </SelectValue_Shadcn_>
                                </SelectTrigger_Shadcn_>
                                <SelectContent_Shadcn_>
                                  {Object.values(StorageSizeUnits).map((unit: string) => (
                                    <SelectItem_Shadcn_
                                      key={unit}
                                      disabled={isFreeTier}
                                      value={unit}
                                    >
                                      {unit}
                                    </SelectItem_Shadcn_>
                                  ))}
                                </SelectContent_Shadcn_>
                              </Select_Shadcn_>
                            )}
                          />
                        </div>
                      </FormControl_Shadcn_>
                    </FormItemLayout>
                  )}
                />
              </CardContent>
              {isFreeTier && (
                <UpgradeToPro
                  fullWidth
                  primaryText="Free Plan has a fixed upload file size limit of 50 MB."
                  secondaryText={`Upgrade to Pro Plan for a configurable upload file size limit of ${formatBytes(
                    STORAGE_FILE_SIZE_LIMIT_MAX_BYTES_UNCAPPED
                  )} and unlock image transformations.`}
                  source="storageSizeLimit"
                />
              )}
              {isSpendCapOn && (
                <UpgradeToPro
                  fullWidth
                  buttonText="Disable Spend Cap"
                  primaryText="Reduced max upload file size limit due to Spend Cap"
                  secondaryText={`Disable your Spend Cap to allow file uploads of up to ${formatBytes(
                    STORAGE_FILE_SIZE_LIMIT_MAX_BYTES_UNCAPPED
                  )}.`}
                  source="storageSizeLimit"
                />
              )}

              {!canUpdateStorageSettings && (
                <CardContent>
                  <p className="text-sm text-foreground-light">
                    You need additional permissions to update storage settings
                  </p>
                </CardContent>
              )}

              <CardFooter className="justify-end space-x-2">
                {form.formState.isDirty && (
                  <Button
                    type="default"
                    htmlType="reset"
                    onClick={() => form.reset()}
                    disabled={!form.formState.isDirty || !canUpdateStorageSettings || isUpdating}
                  >
                    Cancel
                  </Button>
                )}
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={isUpdating}
                  disabled={!canUpdateStorageSettings || isUpdating || !form.formState.isDirty}
                >
                  Save
                </Button>
              </CardFooter>
            </Card>
          </form>
        )}
      </Form_Shadcn_>
    </ScaffoldSection>
  )
}

export default StorageSettings
