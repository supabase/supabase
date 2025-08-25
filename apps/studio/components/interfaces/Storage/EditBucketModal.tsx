import { zodResolver } from '@hookform/resolvers/zod'
import { useParams } from 'common'
import { ChevronDown } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { type SubmitHandler, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import {
  Button,
  CollapsibleContent_Shadcn_,
  CollapsibleTrigger_Shadcn_,
  Collapsible_Shadcn_,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogSectionSeparator,
  DialogTitle,
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
  cn,
} from 'ui'
import { z } from 'zod'

import { StorageSizeUnits } from 'components/interfaces/Storage/StorageSettings/StorageSettings.constants'
import {
  convertFromBytes,
  convertToBytes,
} from 'components/interfaces/Storage/StorageSettings/StorageSettings.utils'
import { InlineLink } from 'components/ui/InlineLink'
import { useProjectStorageConfigQuery } from 'data/config/project-storage-config-query'
import { useBucketUpdateMutation } from 'data/storage/bucket-update-mutation'
import { Bucket } from 'data/storage/buckets-query'
import { IS_PLATFORM } from 'lib/constants'
import { isNonNullable } from 'lib/isNonNullable'
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
    .default(0),
  allowed_mime_types: z.string().trim().default(''),
})

const formId = 'edit-storage-bucket-form'

export const EditBucketModal = ({ visible, bucket, onClose }: EditBucketModalProps) => {
  const { ref } = useParams()

  const { mutate: updateBucket, isLoading: isUpdating } = useBucketUpdateMutation()
  const { data } = useProjectStorageConfigQuery({ projectRef: ref }, { enabled: IS_PLATFORM })
  const { value, unit } = convertFromBytes(data?.fileSizeLimit ?? 0)
  const formattedGlobalUploadLimit = `${value} ${unit}`

  const [selectedUnit, setSelectedUnit] = useState<string>(StorageSizeUnits.BYTES)
  const [showConfiguration, setShowConfiguration] = useState(false)
  const { value: fileSizeLimit } = convertFromBytes(bucket?.file_size_limit ?? 0)

  const form = useForm<z.infer<typeof BucketSchema>>({
    resolver: zodResolver(BucketSchema),
    defaultValues: {
      name: bucket?.name ?? '',
      public: bucket?.public,
      has_file_size_limit: isNonNullable(bucket?.file_size_limit),
      formatted_size_limit: fileSizeLimit ?? 0,
      allowed_mime_types: (bucket?.allowed_mime_types ?? []).join(', '),
    },
    values: {
      name: bucket?.name ?? '',
      public: bucket?.public,
      has_file_size_limit: isNonNullable(bucket?.file_size_limit),
      formatted_size_limit: fileSizeLimit ?? 0,
      allowed_mime_types: (bucket?.allowed_mime_types ?? []).join(', '),
    },
    mode: 'onSubmit',
  })

  const isPublicBucket = form.watch('public')
  const hasFileSizeLimit = form.watch('has_file_size_limit')
  const formattedSizeLimit = form.watch('formatted_size_limit')
  const isChangingBucketVisibility = bucket?.public !== isPublicBucket
  const isMakingBucketPrivate = bucket?.public && !isPublicBucket
  const isMakingBucketPublic = !bucket?.public && isPublicBucket

  const onSubmit: SubmitHandler<z.infer<typeof BucketSchema>> = async (values) => {
    if (bucket === undefined) return console.error('Bucket is required')
    if (ref === undefined) return console.error('Project ref is required')

    updateBucket(
      {
        projectRef: ref,
        id: bucket.id,
        isPublic: values.public,
        file_size_limit: values.has_file_size_limit
          ? convertToBytes(values.formatted_size_limit, selectedUnit as StorageSizeUnits)
          : null,
        allowed_mime_types:
          values.allowed_mime_types.length > 0
            ? values.allowed_mime_types.split(',').map((x: string) => x.trim())
            : null,
      },
      {
        onSuccess: () => {
          toast.success(`Successfully updated bucket "${bucket?.name}"`)
          onClose()
        },
      }
    )
  }

  useEffect(() => {
    if (visible && bucket) {
      setShowConfiguration(false)
      const { unit } = convertFromBytes(bucket.file_size_limit ?? 0)
      setSelectedUnit(unit)
    }
  }, [visible, bucket])

  return (
    <Dialog
      open={visible}
      onOpenChange={(open) => {
        if (!open) {
          form.reset()
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
              <Collapsible_Shadcn_
                open={showConfiguration}
                onOpenChange={() => setShowConfiguration(!showConfiguration)}
              >
                <CollapsibleTrigger_Shadcn_ asChild>
                  <button className="w-full cursor-pointer flex items-center justify-between">
                    <p className="text-sm">Additional configuration</p>
                    <ChevronDown
                      size={18}
                      strokeWidth={2}
                      className={cn('text-foreground-light', showConfiguration && 'rotate-180')}
                    />
                  </button>
                </CollapsibleTrigger_Shadcn_>
                <CollapsibleContent_Shadcn_ className="pt-4 space-y-4">
                  <div className="space-y-2">
                    <FormField_Shadcn_
                      key="has_file_size_limit"
                      name="has_file_size_limit"
                      control={form.control}
                      render={({ field }) => (
                        <FormItemLayout
                          name="has_file_size_limit"
                          label="Restrict file upload size for bucket"
                          description="Prevent uploading of file sizes greater than a specified limit"
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
                      <div className="grid grid-cols-12 col-span-12 gap-x-2 gap-y-1">
                        <div className="col-span-8">
                          <FormField_Shadcn_
                            key="formatted_size_limit"
                            name="formatted_size_limit"
                            control={form.control}
                            render={({ field }) => (
                              <FormItemLayout
                                name="formatted_size_limit"
                                description={`Equivalent to ${convertToBytes(
                                  formattedSizeLimit,
                                  selectedUnit as StorageSizeUnits
                                ).toLocaleString()} bytes.`}
                              >
                                <FormControl_Shadcn_>
                                  <Input_Shadcn_
                                    id="formatted_size_limit"
                                    aria-label="File size limit"
                                    type="number"
                                    min={0}
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
                        {IS_PLATFORM && (
                          <div className="col-span-12 mt-2">
                            <p className="text-foreground-light text-sm">
                              Note: Individual bucket upload will still be capped at the{' '}
                              <Link
                                href={`/project/${ref}/settings/storage`}
                                className="font-bold underline"
                              >
                                global upload limit
                              </Link>{' '}
                              of {formattedGlobalUploadLimit}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <FormField_Shadcn_
                    key="allowed_mime_types"
                    name="allowed_mime_types"
                    control={form.control}
                    render={({ field }) => (
                      <FormItemLayout
                        name="allowed_mime_types"
                        label="Allowed MIME types"
                        labelOptional="Comma separated values"
                        description="Wildcards are allowed, e.g. image/*. Leave blank to allow any MIME type."
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
                </CollapsibleContent_Shadcn_>
              </Collapsible_Shadcn_>
            </DialogSection>
          </form>
        </Form_Shadcn_>

        <DialogFooter>
          <Button
            type="default"
            disabled={isUpdating}
            onClick={() => {
              form.reset()
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
