import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { SubmitHandler, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import z from 'zod'

import { useParams } from 'common'
import { StorageSizeUnits } from 'components/interfaces/Storage/StorageSettings/StorageSettings.constants'
import { InlineLink } from 'components/ui/InlineLink'
import { useProjectStorageConfigQuery } from 'data/config/project-storage-config-query'
import { useBucketCreateMutation } from 'data/storage/bucket-create-mutation'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { IS_PLATFORM } from 'lib/constants'
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogSectionSeparator,
  DialogTitle,
  Form_Shadcn_,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  FormMessage_Shadcn_,
  Input_Shadcn_,
  Select_Shadcn_,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
  Switch,
} from 'ui'
import { Admonition } from 'ui-patterns/admonition'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { inverseValidBucketNameRegex, validBucketNameRegex } from './CreateBucketModal.utils'
import { convertFromBytes, convertToBytes } from './StorageSettings/StorageSettings.utils'

const FormSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, 'Please provide a name for your bucket')
      .max(100, 'Bucket name should be below 100 characters')
      .refine(
        (value) => !value.endsWith(' '),
        'The name of the bucket cannot end with a whitespace'
      )
      .refine(
        (value) => value !== 'public',
        '"public" is a reserved name. Please choose another name'
      ),
    public: z.boolean().default(false),
    has_file_size_limit: z.boolean().default(false),
    formatted_size_limit: z.coerce
      .number()
      .min(0, 'File size upload limit has to be at least 0')
      .optional(),
    allowed_mime_types: z.string().trim().default(''),
  })
  .superRefine((data, ctx) => {
    if (!validBucketNameRegex.test(data.name)) {
      const [match] = data.name.match(inverseValidBucketNameRegex) ?? []
      ctx.addIssue({
        path: ['name'],
        code: z.ZodIssueCode.custom,
        message: !!match
          ? `Bucket name cannot contain the "${match}" character`
          : 'Bucket name contains an invalid special character',
      })
    }
  })

const formId = 'create-storage-bucket-form'

export type CreateBucketForm = z.infer<typeof FormSchema>

interface CreateBucketModalProps {
  open: boolean
  onOpenChange: (value: boolean) => void
}

export const CreateBucketModal = ({ open, onOpenChange }: CreateBucketModalProps) => {
  const { ref } = useParams()
  const { data: org } = useSelectedOrganizationQuery()

  const [selectedUnit, setSelectedUnit] = useState<string>(StorageSizeUnits.MB)
  const [hasAllowedMimeTypes, setHasAllowedMimeTypes] = useState(false)

  const { data } = useProjectStorageConfigQuery({ projectRef: ref }, { enabled: IS_PLATFORM })
  const { value, unit } = convertFromBytes(data?.fileSizeLimit ?? 0)
  const formattedGlobalUploadLimit = `${value} ${unit}`

  const { mutate: sendEvent } = useSendEventMutation()
  const { mutateAsync: createBucket, isPending: isCreatingBucket } = useBucketCreateMutation({
    // [Joshen] Silencing the error here as it's being handled in onSubmit
    onError: () => {},
  })

  const form = useForm<CreateBucketForm>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: '',
      public: false,
      has_file_size_limit: false,
      formatted_size_limit: undefined,
      allowed_mime_types: '',
    },
  })
  const { formatted_size_limit: formattedSizeLimitError } = form.formState.errors
  const isPublicBucket = form.watch('public')
  const hasFileSizeLimit = form.watch('has_file_size_limit')

  const onSubmit: SubmitHandler<CreateBucketForm> = async (values) => {
    if (!ref) return console.error('Project ref is required')

    // [Joshen] Should shift this into superRefine in the form schema
    try {
      const fileSizeLimit =
        values.has_file_size_limit && values.formatted_size_limit !== undefined
          ? convertToBytes(values.formatted_size_limit, selectedUnit as StorageSizeUnits)
          : undefined

      const allowedMimeTypes =
        hasAllowedMimeTypes && values.allowed_mime_types.length > 0
          ? values.allowed_mime_types.split(',').map((x) => x.trim())
          : undefined

      if (!!fileSizeLimit && !!data?.fileSizeLimit && fileSizeLimit > data.fileSizeLimit) {
        return form.setError('formatted_size_limit', {
          type: 'manual',
          message: 'exceed_global_limit',
        })
      }

      await createBucket({
        projectRef: ref,
        id: values.name,
        type: 'STANDARD',
        isPublic: values.public,
        file_size_limit: fileSizeLimit,
        allowed_mime_types: allowedMimeTypes,
      })
      sendEvent({
        action: 'storage_bucket_created',
        properties: { bucketType: 'STANDARD' },
        groups: { project: ref ?? 'Unknown', organization: org?.slug ?? 'Unknown' },
      })

      toast.success(`Successfully created bucket ${values.name}`)
      form.reset()
      setSelectedUnit(StorageSizeUnits.MB)
      onOpenChange(false)
    } catch (error: any) {
      // Handle specific error cases for inline display
      const errorMessage = error.message?.toLowerCase() || ''

      if (
        errorMessage.includes('mime type') &&
        (errorMessage.includes('is not supported') || errorMessage.includes('not supported'))
      ) {
        // Set form error for the MIME types field
        form.setError('allowed_mime_types', {
          type: 'manual',
          message: 'Invalid MIME type format. Please check your input.',
        })
      } else {
        // For other errors, show a toast as fallback
        toast.error(`Failed to create bucket: ${error.message}`)
      }
    }
  }

  const handleClose = () => {
    form.reset()
    setSelectedUnit(StorageSizeUnits.MB)
    onOpenChange(false)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        if (!open) {
          handleClose()
        }
      }}
    >
      <DialogContent aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Create file bucket</DialogTitle>
        </DialogHeader>

        <DialogSectionSeparator />

        <Form_Shadcn_ {...form}>
          <form id={formId} onSubmit={form.handleSubmit(onSubmit)}>
            <DialogSection className="flex flex-col gap-y-2">
              <FormField_Shadcn_
                key="name"
                name="name"
                control={form.control}
                render={({ field }) => (
                  <FormItemLayout
                    name="name"
                    label="Bucket name"
                    labelOptional="Cannot be changed after creation"
                  >
                    <FormControl_Shadcn_>
                      <Input_Shadcn_
                        id="name"
                        data-1p-ignore
                        data-lpignore="true"
                        data-form-type="other"
                        data-bwignore
                        {...field}
                        placeholder="Enter bucket name"
                      />
                    </FormControl_Shadcn_>
                  </FormItemLayout>
                )}
              />
            </DialogSection>

            <DialogSectionSeparator />

            <DialogSection className="space-y-3">
              <FormField_Shadcn_
                key="public"
                name="public"
                control={form.control}
                render={({ field }) => (
                  <FormItemLayout
                    hideMessage
                    name="public"
                    label="Public bucket"
                    description="Allow anyone to read objects without authorization"
                    layout="flex"
                  >
                    <FormControl_Shadcn_>
                      <Switch
                        id="public"
                        size="large"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl_Shadcn_>
                  </FormItemLayout>
                )}
              />
              {isPublicBucket && (
                <Admonition
                  type="warning"
                  title="Public buckets are not protected"
                  description="Users can read objects in public buckets without any authorization. Row level security (RLS) policies are still required for other operations such as object uploads and deletes."
                />
              )}
            </DialogSection>

            <DialogSectionSeparator />

            <DialogSection className="space-y-2">
              <FormField_Shadcn_
                key="has_file_size_limit"
                name="has_file_size_limit"
                control={form.control}
                render={({ field }) => (
                  <FormItemLayout
                    name="has_file_size_limit"
                    label="Restrict file size"
                    description="Prevent uploading of files larger than a specified limit"
                    layout="flex"
                  >
                    <FormControl_Shadcn_>
                      <Switch
                        id="has_file_size_limit"
                        size="large"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl_Shadcn_>
                  </FormItemLayout>
                )}
              />

              {hasFileSizeLimit && (
                <div>
                  <FormField_Shadcn_
                    key="formatted_size_limit"
                    name="formatted_size_limit"
                    control={form.control}
                    render={({ field }) => (
                      <FormItemLayout
                        hideMessage
                        name="formatted_size_limit"
                        label="File size limit"
                      >
                        <div className="grid grid-cols-12 gap-x-2">
                          <div className="col-span-8">
                            <FormControl_Shadcn_>
                              <Input_Shadcn_
                                id="formatted_size_limit"
                                aria-label="File size limit"
                                type="number"
                                min={0}
                                placeholder="0"
                                {...field}
                              />
                            </FormControl_Shadcn_>
                          </div>
                          <div className="col-span-4">
                            <Select_Shadcn_ value={selectedUnit} onValueChange={setSelectedUnit}>
                              <SelectTrigger_Shadcn_ aria-label="File size limit unit" size="small">
                                <SelectValue_Shadcn_>{selectedUnit}</SelectValue_Shadcn_>
                              </SelectTrigger_Shadcn_>
                              <SelectContent_Shadcn_>
                                {Object.values(StorageSizeUnits).map((unit: string) => (
                                  <SelectItem_Shadcn_ key={unit} value={unit} className="text-xs">
                                    {unit}
                                  </SelectItem_Shadcn_>
                                ))}
                              </SelectContent_Shadcn_>
                            </Select_Shadcn_>
                          </div>
                        </div>
                      </FormItemLayout>
                    )}
                  />
                  {formattedSizeLimitError?.message === 'exceed_global_limit' && (
                    <FormMessage_Shadcn_ className="mt-2">
                      Exceeds global limit of {formattedGlobalUploadLimit}. Increase limit in{' '}
                      <InlineLink
                        className="text-destructive decoration-destructive-500 hover:decoration-destructive"
                        href={`/project/${ref}/storage/settings`}
                        onClick={() => onOpenChange(false)}
                      >
                        Storage Settings
                      </InlineLink>{' '}
                      first.
                    </FormMessage_Shadcn_>
                  )}

                  {IS_PLATFORM && (
                    <p className="text-sm text-foreground-lighter mt-2">
                      This project has a{' '}
                      <InlineLink
                        className="text-foreground-light hover:text-foreground"
                        href={`/project/${ref}/storage/settings`}
                        onClick={() => onOpenChange(false)}
                      >
                        global file size limit
                      </InlineLink>{' '}
                      of {formattedGlobalUploadLimit}.
                    </p>
                  )}
                </div>
              )}
            </DialogSection>

            <DialogSectionSeparator />

            <DialogSection className="space-y-2">
              <FormItemLayout
                name="has_allowed_mime_types"
                label="Restrict MIME types"
                description="Allow only certain types of files to be uploaded"
                layout="flex"
              >
                <FormControl_Shadcn_>
                  <Switch
                    id="has_allowed_mime_types"
                    size="large"
                    checked={hasAllowedMimeTypes}
                    onCheckedChange={setHasAllowedMimeTypes}
                  />
                </FormControl_Shadcn_>
              </FormItemLayout>
              {hasAllowedMimeTypes && (
                <FormField_Shadcn_
                  key="allowed_mime_types"
                  name="allowed_mime_types"
                  control={form.control}
                  render={({ field }) => (
                    <FormItemLayout
                      name="allowed_mime_types"
                      label="Allowed MIME types"
                      labelOptional="Comma separated values"
                      description="Wildcards are allowed, e.g. image/*."
                    >
                      <FormControl_Shadcn_>
                        <Input_Shadcn_
                          id="allowed_mime_types"
                          {...field}
                          placeholder="e.g image/jpeg, image/png, audio/mpeg, video/mp4, etc"
                        />
                      </FormControl_Shadcn_>
                    </FormItemLayout>
                  )}
                />
              )}
            </DialogSection>
          </form>
        </Form_Shadcn_>

        <DialogFooter>
          <Button type="default" disabled={isCreatingBucket} onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            form={formId}
            htmlType="submit"
            loading={isCreatingBucket}
            disabled={isCreatingBucket}
          >
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
