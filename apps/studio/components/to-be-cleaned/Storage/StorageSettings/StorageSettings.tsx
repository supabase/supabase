import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import {
  Button,
  IconClock,
  Listbox,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  FormItem_Shadcn_,
  FormLabel_Shadcn_,
  FormMessage_Shadcn_,
  Form_Shadcn_,
  Input_Shadcn_,
} from 'ui'

import AlertError from 'components/ui/AlertError'
import { FormHeader } from 'components/ui/Forms'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import UpgradeToPro from 'components/ui/UpgradeToPro'
import { useProjectStorageConfigQuery } from 'data/config/project-storage-config-query'
import { useProjectStorageConfigUpdateUpdateMutation } from 'data/config/project-storage-config-update-mutation'
import { useCheckPermissions, useSelectedOrganization } from 'hooks'
import { IS_PLATFORM } from 'lib/constants'
import { STORAGE_FILE_SIZE_LIMIT_MAX_BYTES, StorageSizeUnits } from './StorageSettings.constants'
import { convertFromBytes, convertToBytes } from './StorageSettings.utils'
import * as z from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, SubmitHandler } from 'react-hook-form'

const StorageSettings = () => {
  const { ref: projectRef } = useParams()
  const organization = useSelectedOrganization()
  const organizationSlug = organization?.slug

  const canUpdateStorageSettings = useCheckPermissions(PermissionAction.STORAGE_ADMIN_WRITE, '*')

  const {
    data: config,
    error,
    isLoading,
    isSuccess,
    isError,
  } = useProjectStorageConfigQuery({ projectRef }, { enabled: IS_PLATFORM })
  const { fileSizeLimit, isFreeTier } = config || {}
  const { value, unit } = convertFromBytes(fileSizeLimit ?? 0)
  const [selectedUnit, _] = useState(unit)

  const formattedMaxSizeBytes = `${new Intl.NumberFormat('en-US').format(
    STORAGE_FILE_SIZE_LIMIT_MAX_BYTES
  )} bytes`

  const FormSchema = z
    .object({
      fileSizeLimit: z.coerce.number(),
      unit: z.nativeEnum(StorageSizeUnits),
    })
    .superRefine((data, ctx) => {
      const { unit, fileSizeLimit } = data
      const { value: formattedMaxLimit } = convertFromBytes(STORAGE_FILE_SIZE_LIMIT_MAX_BYTES, unit)

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
    defaultValues: { fileSizeLimit: value, unit: selectedUnit },
  })

  useEffect(() => {
    form.setValue('unit', unit)
  }, [config])

  const { mutate: updateStorageConfig, isLoading: isUpdating } =
    useProjectStorageConfigUpdateUpdateMutation({
      onSuccess: () => {
        toast.success('Successfully updated storage settings')
      },
    })

  const onSubmit: SubmitHandler<z.infer<typeof FormSchema>> = async (data) => {
    if (!projectRef) return console.error('Project ref is required')
    updateStorageConfig({
      projectRef,
      fileSizeLimit: convertToBytes(data.fileSizeLimit, data.unit),
    })
  }

  const formId = 'storage-settings-form'

  return (
    <div>
      <FormHeader
        title="Storage Settings"
        description="Configure your project's storage settings."
      />
      <Form_Shadcn_ {...form}>
        {isLoading && <GenericSkeletonLoader />}
        {isError && (
          <AlertError error={error} subject="Failed to retrieve project's storage configuration" />
        )}
        {isSuccess && (
          <form id={formId} className="" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="bg-surface-100  overflow-hidden border-muted rounded-md border shadow">
              <div className="flex flex-col gap-0 divide-y divide-border-muted">
                <div className="grid grid-cols-12 gap-6 px-8 py-8 lg:gap-12">
                  <div className="relative flex flex-col col-span-12 gap-6 lg:col-span-4">
                    <p className="text-sm">Upload file size limit</p>
                  </div>

                  <div className="relative flex flex-col col-span-12 gap-x-6 gap-y-2 lg:col-span-8">
                    <div className="grid grid-cols-12 col-span-12 gap-2">
                      <div className="col-span-8">
                        <FormField_Shadcn_
                          control={form.control}
                          name="fileSizeLimit"
                          render={({ field }) => (
                            <FormItem_Shadcn_>
                              <FormLabel_Shadcn_ className="text-foreground-light hidden">
                                size
                              </FormLabel_Shadcn_>
                              <FormControl_Shadcn_ className="col-span-8">
                                <Input_Shadcn_ type="number" {...field} className="w-full" />
                              </FormControl_Shadcn_>
                              <FormMessage_Shadcn_ className="col-start-5 col-span-8" />
                            </FormItem_Shadcn_>
                          )}
                        />
                      </div>
                      <div className="col-span-4">
                        <FormField_Shadcn_
                          control={form.control}
                          name="unit"
                          render={({ field }) => (
                            <FormItem_Shadcn_>
                              <FormLabel_Shadcn_ className="hidden">Unit</FormLabel_Shadcn_>
                              <FormControl_Shadcn_ className="col-span-8">
                                <Listbox
                                  disabled={isFreeTier}
                                  value={field.value}
                                  onChange={field.onChange}
                                >
                                  {Object.values(StorageSizeUnits).map((unit: string) => (
                                    <Listbox.Option
                                      key={unit}
                                      disabled={isFreeTier}
                                      label={unit}
                                      value={unit}
                                    >
                                      <div>{unit}</div>
                                    </Listbox.Option>
                                  ))}
                                </Listbox>
                              </FormControl_Shadcn_>
                              <FormMessage_Shadcn_ className="" />
                            </FormItem_Shadcn_>
                          )}
                        />
                      </div>
                    </div>
                    <p className="text-sm text-foreground-light">
                      {selectedUnit !== StorageSizeUnits.BYTES &&
                        `Equivalent to ${convertToBytes(
                          form.getValues('fileSizeLimit'),
                          selectedUnit
                        ).toLocaleString()} bytes. `}
                      Maximum size in bytes of a file that can be uploaded is 5 GB (
                      {formattedMaxSizeBytes}).
                    </p>
                  </div>
                </div>
              </div>
              {isFreeTier && (
                <div className="px-6 pb-6">
                  <UpgradeToPro
                    icon={<IconClock size="large" />}
                    organizationSlug={organizationSlug ?? ''}
                    primaryText="Free Plan has a fixed upload file size limit of 50 MB."
                    projectRef={projectRef ?? ''}
                    secondaryText="Upgrade to the Pro plan for a configurable upload file size limit of up to 5 GB."
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
                      disabled={isUpdating}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={isUpdating}
                      disabled={!canUpdateStorageSettings || isUpdating}
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
    </div>
  )
}

export default StorageSettings
