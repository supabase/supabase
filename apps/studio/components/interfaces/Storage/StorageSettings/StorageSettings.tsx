import { zodResolver } from '@hookform/resolvers/zod'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useEffect, useMemo, useState } from 'react'
import { SubmitHandler, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import * as z from 'zod'

import { useParams } from 'common'
import AlertError from 'components/ui/AlertError'
import { InlineLink } from 'components/ui/InlineLink'
import NoPermission from 'components/ui/NoPermission'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import UpgradeToPro from 'components/ui/UpgradeToPro'
import { useProjectStorageConfigQuery } from 'data/config/project-storage-config-query'
import { useProjectStorageConfigUpdateUpdateMutation } from 'data/config/project-storage-config-update-mutation'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { formatBytes } from 'lib/helpers'
import {
  Button,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  FormItem_Shadcn_,
  FormLabel_Shadcn_,
  FormMessage_Shadcn_,
  Form_Shadcn_,
  Input_Shadcn_,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
  Select_Shadcn_,
  Switch,
} from 'ui'
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

  const organization = useSelectedOrganization()
  const isFreeTier = organization?.plan.id === 'free'
  const isSpendCapOn =
    organization?.plan.id === 'pro' && organization?.usage_billing_enabled === false

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

  const formattedMaxSizeBytes = `${new Intl.NumberFormat('en-US').format(maxBytes)} bytes`

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
    <Form_Shadcn_ {...form}>
      {isLoading && <GenericSkeletonLoader />}
      {isError && (
        <AlertError error={error} subject="Failed to retrieve project's storage configuration" />
      )}
      {isSuccess && (
        <form id={formId} className="" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="bg-surface-100  overflow-hidden border-muted rounded-md border shadow">
            <div className="flex flex-col gap-0 divide-y divide-border">
              <div className="grid grid-cols-12 gap-6 px-8 py-8 lg:gap-12">
                <div className="relative flex flex-col col-span-12 gap-6 lg:col-span-4">
                  <p className="text-sm">Upload file size limit</p>
                </div>

                <div className="relative flex flex-col col-span-12 gap-x-6 gap-y-2 lg:col-span-8">
                  <div className="flex items-center gap-2">
                    <div className="flex-grow">
                      <FormField_Shadcn_
                        control={form.control}
                        name="fileSizeLimit"
                        render={({ field }) => (
                          <FormItem_Shadcn_>
                            <FormLabel_Shadcn_ className="text-foreground-light hidden">
                              size
                            </FormLabel_Shadcn_>
                            <FormControl_Shadcn_ className="col-span-8">
                              <Input_Shadcn_
                                type="number"
                                {...field}
                                className="w-full"
                                disabled={isFreeTier || !canUpdateStorageSettings}
                              />
                            </FormControl_Shadcn_>
                            <FormMessage_Shadcn_ className="col-start-5 col-span-8" />
                          </FormItem_Shadcn_>
                        )}
                      />
                    </div>
                    <div className="flex-shrink-0">
                      <FormField_Shadcn_
                        control={form.control}
                        name="unit"
                        render={({ field }) => (
                          <FormItem_Shadcn_>
                            <FormLabel_Shadcn_ className="hidden">Unit</FormLabel_Shadcn_>
                            <FormControl_Shadcn_ className="col-span-8">
                              <Select_Shadcn_
                                value={field.value}
                                onValueChange={field.onChange}
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
                            </FormControl_Shadcn_>
                            <FormMessage_Shadcn_ />
                          </FormItem_Shadcn_>
                        )}
                      />
                    </div>
                  </div>
                  <p className="text-sm text-foreground-light">
                    {storageUnit !== StorageSizeUnits.BYTES &&
                      `Equivalent to ${convertToBytes(
                        limit,
                        storageUnit
                      ).toLocaleString()} bytes. `}
                    Maximum upload file size is {formatBytes(maxBytes)}.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-12 gap-6 px-8 py-8 lg:gap-12">
                <div className="relative flex flex-col col-span-12 gap-6 lg:col-span-4">
                  <p className="text-sm">Enable Image Transformation</p>
                </div>
                <div className="relative flex flex-col col-span-12 gap-x-6 gap-y-2 lg:col-span-8">
                  <div className="grid grid-cols-12 col-span-12 gap-2 items-center">
                    <FormField_Shadcn_
                      control={form.control}
                      name="imageTransformationEnabled"
                      render={({ field }) => (
                        <Switch
                          size="large"
                          disabled={isFreeTier}
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      )}
                    />
                  </div>
                  <p className="text-sm text-foreground-light">
                    Optimize and resize images on the fly.{' '}
                    <InlineLink href="https://supabase.com/docs/guides/storage/serving/image-transformations">
                      Learn more
                    </InlineLink>
                    .
                  </p>
                </div>
              </div>
            </div>

            {isFreeTier && (
              <div className="px-6 pb-6">
                <UpgradeToPro
                  primaryText="Free Plan has a fixed upload file size limit of 50 MB."
                  secondaryText={`Upgrade to Pro Plan for a configurable upload file size limit of ${formatBytes(STORAGE_FILE_SIZE_LIMIT_MAX_BYTES_UNCAPPED)} and unlock image transformations.`}
                  source="storageSizeLimit"
                />
              </div>
            )}
            {isSpendCapOn && (
              <div className="px-6 pb-6">
                <UpgradeToPro
                  buttonText="Disable Spend Cap"
                  primaryText="Reduced max upload file size limit due to Spend Cap"
                  secondaryText={`Disable your Spend Cap to allow file uploads of up to ${formatBytes(STORAGE_FILE_SIZE_LIMIT_MAX_BYTES_UNCAPPED)}.`}
                  source="storageSizeLimit"
                />
              </div>
            )}
            <div className="border-t border-overlay" />
            <div className="flex justify-between px-8 py-4">
              <div className="flex items-center justify-between w-full gap-2">
                {!canUpdateStorageSettings ? (
                  <p className="text-sm text-foreground-light">
                    You need additional permissions to update storage settings
                  </p>
                ) : (
                  <div />
                )}
                <div className="flex gap-2">
                  <Button
                    type="default"
                    htmlType="reset"
                    onClick={() => form.reset()}
                    disabled={!form.formState.isDirty || !canUpdateStorageSettings || isUpdating}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={isUpdating}
                    disabled={!form.formState.isDirty || !canUpdateStorageSettings || isUpdating}
                  >
                    Save
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </form>
      )}
    </Form_Shadcn_>
  )
}

export default StorageSettings
