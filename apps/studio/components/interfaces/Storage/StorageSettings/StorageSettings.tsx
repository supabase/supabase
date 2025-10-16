import { zodResolver } from '@hookform/resolvers/zod'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { SubmitHandler, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import * as z from 'zod'

import { useFlag, useParams } from 'common'
import { ScaffoldSection } from 'components/layouts/Scaffold'
import AlertError from 'components/ui/AlertError'
import { InlineLink } from 'components/ui/InlineLink'
import NoPermission from 'components/ui/NoPermission'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import UpgradeToPro from 'components/ui/UpgradeToPro'
import { useProjectStorageConfigQuery } from 'data/config/project-storage-config-query'
import { useProjectStorageConfigUpdateUpdateMutation } from 'data/config/project-storage-config-update-mutation'
import { useBucketsQuery } from 'data/storage/buckets-query'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { DOCS_URL } from 'lib/constants'
import { formatBytes } from 'lib/helpers'
import {
  Button,
  Card,
  CardContent,
  CardFooter,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  FormMessage_Shadcn_,
  Form_Shadcn_,
  Input_Shadcn_,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
  Select_Shadcn_,
  Switch,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import {
  StorageListV2MigratingCallout,
  StorageListV2MigrationCallout,
} from './StorageListV2MigrationCallout'
import {
  STORAGE_FILE_SIZE_LIMIT_MAX_BYTES_CAPPED,
  STORAGE_FILE_SIZE_LIMIT_MAX_BYTES_FREE_PLAN,
  STORAGE_FILE_SIZE_LIMIT_MAX_BYTES_UNCAPPED,
  StorageSizeUnits,
} from './StorageSettings.constants'
import { convertFromBytes, convertToBytes } from './StorageSettings.utils'

const formId = 'storage-settings-form'

interface StorageSettingsState {
  fileSizeLimit: number
  unit: StorageSizeUnits
  imageTransformationEnabled: boolean
}

export const StorageSettings = () => {
  const { ref: projectRef } = useParams()
  const showMigrationCallout = useFlag('storageMigrationCallout')

  const { can: canReadStorageSettings, isLoading: isLoadingPermissions } = useAsyncCheckPermissions(
    PermissionAction.STORAGE_ADMIN_READ,
    '*'
  )
  const { can: canUpdateStorageSettings } = useAsyncCheckPermissions(
    PermissionAction.STORAGE_ADMIN_WRITE,
    '*'
  )

  const {
    data: config,
    error,
    isLoading,
    isSuccess,
    isError,
  } = useProjectStorageConfigQuery({ projectRef })
  const isListV2UpgradeAvailable =
    !!config && !config.capabilities.list_v2 && config.external.upstreamTarget === 'main'
  const isListV2Upgrading =
    !!config && !config.capabilities.list_v2 && config.external.upstreamTarget === 'canary'

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
    unit: StorageSizeUnits.MB,
    imageTransformationEnabled: !isFreeTier,
  })

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
            .filter((bucket) => bucket.file_size_limit && bucket.file_size_limit > 0)
            .filter(
              (bucket) => convertFromBytes(bucket.file_size_limit!, unit).value > fileSizeLimit
            )
            .sort((a, b) => (b.file_size_limit ?? 0) - (a.file_size_limit ?? 0))

          if (affectedBuckets.length > 0) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: `bucketLimit:${affectedBuckets.map((x) => x.name).join(',')}`,
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

  const { unit: storageUnit } = form.watch()
  const { fileSizeLimit: fileSizeLimitError } = form.formState.errors
  const isBucketLimitError = !!fileSizeLimitError?.message?.startsWith('bucketLimit')
  const affectedBuckets = isBucketLimitError
    ? (fileSizeLimitError?.message ?? '').split(':')[1].split(',')
    : []
  const firstAffectBucketLimit = convertFromBytes(
    buckets.find((x) => x.name === affectedBuckets[0])?.file_size_limit ?? 0
  )

  const { mutate: updateStorageConfig, isLoading: isUpdating } =
    useProjectStorageConfigUpdateUpdateMutation({
      onSuccess: () => {
        toast.success('Successfully updated storage settings')
      },
    })

  const onSubmit: SubmitHandler<z.infer<typeof FormSchema>> = async (data) => {
    if (!projectRef) return console.error('Project ref is required')
    if (!config) return console.error('Storage config is required')

    updateStorageConfig({
      projectRef,
      fileSizeLimit: convertToBytes(data.fileSizeLimit, data.unit),
      features: {
        imageTransformation: { enabled: data.imageTransformationEnabled },
        s3Protocol: { enabled: config.features.s3Protocol.enabled },
      },
    })
  }

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

  return (
    <ScaffoldSection isFullWidth>
      <Form_Shadcn_ {...form}>
        {isLoading || isLoadingPermissions ? (
          <GenericSkeletonLoader />
        ) : (
          <>
            {!canReadStorageSettings && (
              <NoPermission resourceText="view storage upload limit settings" />
            )}
            {isError && (
              <AlertError
                error={error}
                subject="Failed to retrieve project's storage configuration"
              />
            )}
            {isSuccess && showMigrationCallout && (
              <>
                {isListV2UpgradeAvailable && <StorageListV2MigrationCallout />}
                {isListV2Upgrading && <StorageListV2MigratingCallout />}
              </>
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
                              <InlineLink
                                href={`${DOCS_URL}/guides/storage/serving/image-transformations`}
                              >
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
                          hideMessage
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
                              <InlineLink href={`${DOCS_URL}/guides/storage/uploads/file-limits`}>
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
                    {fileSizeLimitError && (
                      <FormMessage_Shadcn_ className="ml-auto mt-2 text-right w-1/2">
                        {isBucketLimitError ? (
                          <>
                            <p>Global limit must be greater than that of individual buckets.</p>
                            <p>
                              Remove or decrease the limit on{' '}
                              <InlineLink
                                href={`/project/${projectRef}/storage/buckets/${affectedBuckets[0]}`}
                                className="text-destructive decoration-destructive-500 hover:decoration-destructive"
                              >
                                {affectedBuckets[0]}
                              </InlineLink>{' '}
                              ({firstAffectBucketLimit.value}
                              {firstAffectBucketLimit.unit})
                              {affectedBuckets.length > 1 && (
                                <>
                                  {' '}
                                  and{' '}
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span className="underline underline-offset-2 decoration-dotted decoration-destructive-500 hover:decoration-destructive cursor-default">
                                        +{affectedBuckets.length - 1} other bucket
                                        {affectedBuckets.length > 2 ? 's' : ''}
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent side="bottom">
                                      <ul>
                                        {affectedBuckets.slice(1).map((name) => {
                                          const bucket = buckets.find((x) => x.name === name)
                                          const formattedLimit = convertFromBytes(
                                            bucket?.file_size_limit ?? 0
                                          )
                                          return (
                                            <li
                                              key={name}
                                              className="hover:underline underline-offset-2"
                                            >
                                              <Link
                                                href={`/project/${projectRef}/storage/buckets/${name}`}
                                              >
                                                {bucket?.name} ({formattedLimit.value}
                                                {formattedLimit.unit})
                                              </Link>
                                            </li>
                                          )
                                        })}
                                      </ul>
                                    </TooltipContent>
                                  </Tooltip>{' '}
                                  first
                                </>
                              )}
                              .
                            </p>
                          </>
                        ) : (
                          fileSizeLimitError.message
                        )}
                      </FormMessage_Shadcn_>
                    )}
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
                        disabled={
                          !form.formState.isDirty || !canUpdateStorageSettings || isUpdating
                        }
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
          </>
        )}
      </Form_Shadcn_>
    </ScaffoldSection>
  )
}
