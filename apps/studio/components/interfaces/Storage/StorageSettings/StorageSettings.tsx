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
                  name="fileSizeLimit"
                  render={({ field }) => (
                    <FormItemLayout
                      layout="flex-row-reverse"
                      label="Upload file size limit"
                      description={
                        <>
                          {storageUnit !== StorageSizeUnits.BYTES && (
                            <>
                              Equivalent to {convertToBytes(limit, storageUnit).toLocaleString()}{' '}
                              bytes.{' '}
                            </>
                          )}
                          Maximum upload file size is {formatBytes(maxBytes)}.
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

              <CardContent>
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

              {isFreeTier && (
                <CardContent className="pt-0">
                  <UpgradeToPro
                    primaryText="Free Plan has a fixed upload file size limit of 50 MB."
                    secondaryText={`Upgrade to Pro Plan for a configurable upload file size limit of ${formatBytes(
                      STORAGE_FILE_SIZE_LIMIT_MAX_BYTES_UNCAPPED
                    )} and unlock image transformations.`}
                    source="storageSizeLimit"
                  />
                </CardContent>
              )}
              {isSpendCapOn && (
                <CardContent className="pt-0">
                  <UpgradeToPro
                    buttonText="Disable Spend Cap"
                    primaryText="Reduced max upload file size limit due to Spend Cap"
                    secondaryText={`Disable your Spend Cap to allow file uploads of up to ${formatBytes(
                      STORAGE_FILE_SIZE_LIMIT_MAX_BYTES_UNCAPPED
                    )}.`}
                    source="storageSizeLimit"
                  />
                </CardContent>
              )}

              {!canUpdateStorageSettings && (
                <CardContent className="pt-0">
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
                  Save changes
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
