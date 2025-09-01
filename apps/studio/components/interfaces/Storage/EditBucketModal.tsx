import { zodResolver } from '@hookform/resolvers/zod'
import { useParams } from 'common'
import { useEffect, useRef, useState } from 'react'
import { type SubmitHandler, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogSectionSeparator,
  DialogTitle,
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
} from 'ui'
import { z } from 'zod'

import { StorageSizeUnits } from 'components/interfaces/Storage/StorageSettings/StorageSettings.constants'
import {
  convertFromBytes,
  convertToBytes,
} from 'components/interfaces/Storage/StorageSettings/StorageSettings.utils'
import { InlineLink } from 'components/ui/InlineLink'
import { useProjectStorageConfigQuery } from 'data/config/project-storage-config-query'
import { updateBucket } from 'data/storage/bucket-update-mutation'
import { Bucket } from 'data/storage/buckets-query'
import { IS_PLATFORM } from 'lib/constants'
import { Admonition } from 'ui-patterns'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

export interface EditBucketModalProps {
  visible: boolean
  bucket: Bucket
  onClose: () => void
}

const BucketSchema = z.object({
  name: z.string(),
  public: z.boolean().default(false),
  has_file_size_limit: z.boolean().default(false),
  formatted_size_limit: z.coerce
    .number()
    .min(0, 'File size upload limit has to be at least 0')
    .optional(),
  allowed_mime_types: z.string().trim().default(''),
})

const formId = 'edit-storage-bucket-form'

export const EditBucketModal = ({ visible, bucket, onClose }: EditBucketModalProps) => {
  const { ref } = useParams()

  const [isUpdating, setIsUpdating] = useState(false)
  const { data } = useProjectStorageConfigQuery({ projectRef: ref }, { enabled: IS_PLATFORM })
  const { value, unit } = convertFromBytes(data?.fileSizeLimit ?? 0)
  const formattedGlobalUploadLimit = `${value} ${unit}`

  const [selectedUnit, setSelectedUnit] = useState<string>(StorageSizeUnits.MB)
  const { value: fileSizeLimit } = convertFromBytes(bucket?.file_size_limit ?? 0)
  const bucketIdRef = useRef<string | null>(null)

  const defaultValues = {
    name: bucket?.name ?? '',
    public: bucket?.public,
    has_file_size_limit: Boolean(bucket?.file_size_limit),
    formatted_size_limit: bucket?.file_size_limit ? fileSizeLimit ?? 0 : undefined,
    allowed_mime_types: (bucket?.allowed_mime_types ?? []).join(', '),
  }

  const form = useForm<z.infer<typeof BucketSchema>>({
    resolver: zodResolver(BucketSchema),
    defaultValues,
    values: defaultValues,
    mode: 'onSubmit',
  })
  const { formatted_size_limit: formattedSizeLimitError } = form.formState.errors

  const isPublicBucket = form.watch('public')
  const hasFileSizeLimit = form.watch('has_file_size_limit')
  const [hasAllowedMimeTypes, setHasAllowedMimeTypes] = useState(
    Boolean(bucket?.allowed_mime_types?.length)
  )

  const isChangingBucketVisibility = bucket?.public !== isPublicBucket
  const isMakingBucketPrivate = bucket?.public && !isPublicBucket
  const isMakingBucketPublic = !bucket?.public && isPublicBucket

  const onSubmit: SubmitHandler<z.infer<typeof BucketSchema>> = async (values) => {
    if (bucket === undefined) return console.error('Bucket is required')
    if (ref === undefined) return console.error('Project ref is required')

    form.clearErrors()
    setIsUpdating(true)

    // Client-side validation: Check if bucket limit exceeds global limit
    // [Joshen] Should shift this into superRefine in the form schema
    if (
      values.has_file_size_limit &&
      values.formatted_size_limit !== undefined &&
      data?.fileSizeLimit
    ) {
      const bucketLimitInBytes = convertToBytes(
        values.formatted_size_limit,
        selectedUnit as StorageSizeUnits
      )

      if (bucketLimitInBytes > data.fileSizeLimit) {
        form.setError('formatted_size_limit', { type: 'manual', message: 'exceed_global_limit' })
        return setIsUpdating(false)
      }
    }

    try {
      const result = await updateBucket({
        projectRef: ref,
        id: bucket.id,
        isPublic: values.public,
        file_size_limit:
          values.has_file_size_limit && values.formatted_size_limit
            ? convertToBytes(values.formatted_size_limit, selectedUnit as StorageSizeUnits)
            : null,
        allowed_mime_types: hasAllowedMimeTypes
          ? values.allowed_mime_types.length > 0
            ? values.allowed_mime_types.split(',').map((x: string) => x.trim())
            : null
          : null,
      })

      if (result.error) {
        // Handle specific error cases for inline display
        const errorMessage = result.error.message?.toLowerCase() || ''

        if (
          errorMessage.includes('exceeded the maximum allowed size') ||
          errorMessage.includes('maximum allowed size') ||
          errorMessage.includes('entity too large') ||
          errorMessage.includes('payload too large')
        ) {
          // Set form error for the file size limit field
          form.setError('formatted_size_limit', {
            type: 'manual',
            message: `Exceeds global limit of ${formattedGlobalUploadLimit}.`,
          })
        } else if (
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
          toast.error(`Failed to update bucket: ${result.error.message || 'Unknown error'}`)
        }
      } else {
        // Success case
        toast.success(`Successfully updated bucket "${bucket?.name}"`)
        onClose()
      }
    } catch (error: any) {
      // This should not happen anymore, but keeping as fallback
      toast.error(`Failed to update bucket: ${error.message}`)
    } finally {
      setIsUpdating(false)
    }
  }

  useEffect(() => {
    if (visible && bucket) {
      // Only set the selectedUnit when the bucket changes (different bucket ID)
      // This preserves the user's unit selection when reopening the modal for the same bucket
      if (bucketIdRef.current !== bucket.id) {
        const { unit } = convertFromBytes(bucket.file_size_limit ?? 0)
        setSelectedUnit(unit)
        bucketIdRef.current = bucket.id
      }
      // Clear errors when modal opens
      form.clearErrors()
    }
  }, [visible, bucket, form])

  return (
    <Dialog
      open={visible}
      onOpenChange={(open) => {
        if (!open) {
          form.reset()
          form.clearErrors()
          onClose()
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{`Edit bucket "${bucket?.name}"`}</DialogTitle>
        </DialogHeader>

        <DialogSectionSeparator />

        <Form_Shadcn_ {...form}>
          <form id={formId} onSubmit={form.handleSubmit(onSubmit)}>
            <DialogSection className="flex flex-col gap-y-4">
              <FormField_Shadcn_
                key="name"
                name="name"
                control={form.control}
                render={({ field }) => (
                  <FormItemLayout
                    hideMessage
                    name="name"
                    label="Name of bucket"
                    labelOptional="Buckets cannot be renamed once created."
                  >
                    <FormControl_Shadcn_>
                      <Input_Shadcn_ id="name" {...field} disabled />
                    </FormControl_Shadcn_>
                  </FormItemLayout>
                )}
              />
              <FormField_Shadcn_
                key="public"
                name="public"
                control={form.control}
                render={({ field }) => (
                  <FormItemLayout
                    name="public"
                    label="Public bucket"
                    description="Anyone can read any object without any authorization"
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
            </DialogSection>

            {isChangingBucketVisibility && (
              <Admonition
                type="warning"
                className="rounded-none border-x-0 border-b-0 mb-0 [&>div>p]:!leading-normal"
                title={`Warning: Making bucket ${isMakingBucketPublic ? 'public' : 'private'}`}
                description={
                  <>
                    {isMakingBucketPublic && (
                      <p>This will make all objects in your bucket publicly accessible.</p>
                    )}

                    {isMakingBucketPrivate && (
                      <>
                        <p className="mb-2">
                          All objects in your bucket will be private and only accessible via signed
                          URLs, or downloaded with the right authorisation headers.
                        </p>
                        <p>
                          Assets cached in the CDN may still be publicly accessible. You can
                          consider{' '}
                          <InlineLink href="https://supabase.com/docs/guides/storage/cdn/smart-cdn#cache-eviction">
                            purging the cache
                          </InlineLink>{' '}
                          or moving your assets to a new bucket.
                        </p>
                      </>
                    )}
                  </>
                }
              />
            )}

            <DialogSectionSeparator />

            <DialogSection>
              <div className="space-y-4">
                <div className="space-y-2">
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
                    <>
                      <div className="grid grid-cols-12 col-span-12 gap-x-2 gap-y-1">
                        <div className="col-span-8">
                          <FormField_Shadcn_
                            key="formatted_size_limit"
                            name="formatted_size_limit"
                            control={form.control}
                            render={({ field }) => (
                              <FormItemLayout hideMessage name="formatted_size_limit">
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
                              </FormItemLayout>
                            )}
                          />
                        </div>
                        <Select_Shadcn_ value={selectedUnit} onValueChange={setSelectedUnit}>
                          <SelectTrigger_Shadcn_
                            aria-label="File size limit unit"
                            size="small"
                            className="col-span-4"
                          >
                            <SelectValue_Shadcn_ asChild>
                              <>{selectedUnit}</>
                            </SelectValue_Shadcn_>
                          </SelectTrigger_Shadcn_>
                          <SelectContent_Shadcn_>
                            {Object.values(StorageSizeUnits).map((unit: string) => (
                              <SelectItem_Shadcn_ key={unit} value={unit} className="text-xs">
                                <div>{unit}</div>
                              </SelectItem_Shadcn_>
                            ))}
                          </SelectContent_Shadcn_>
                        </Select_Shadcn_>
                      </div>

                      {formattedSizeLimitError?.message === 'exceed_global_limit' && (
                        <FormMessage_Shadcn_>
                          Exceeds global limit of {formattedGlobalUploadLimit}. Increase limit in{' '}
                          <InlineLink
                            className="text-destructive decoration-destructive-500 hover:decoration-destructive"
                            href={`/project/${ref}/settings/storage`}
                          >
                            Storage Settings
                          </InlineLink>{' '}
                          first.
                        </FormMessage_Shadcn_>
                      )}

                      {IS_PLATFORM ? (
                        <p className="text-sm text-foreground-light !mt-3">
                          This project has a{' '}
                          <InlineLink href={`/project/${ref}/settings/storage`}>
                            global file size limit
                          </InlineLink>{' '}
                          of {formattedGlobalUploadLimit}.
                        </p>
                      ) : undefined}
                    </>
                  )}
                </div>
              </div>
            </DialogSection>

            <DialogSectionSeparator />

            <DialogSection>
              <div className="space-y-2">
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
              </div>
            </DialogSection>
          </form>
        </Form_Shadcn_>

        <DialogFooter>
          <Button
            type="default"
            disabled={isUpdating}
            onClick={() => {
              form.reset()
              form.clearErrors()
              onClose()
            }}
          >
            Cancel
          </Button>
          <Button form={formId} htmlType="submit" loading={isUpdating}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
