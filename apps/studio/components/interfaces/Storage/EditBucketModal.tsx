import { zodResolver } from '@hookform/resolvers/zod'
import { useParams } from 'common'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useForm, useWatch, type SubmitHandler } from 'react-hook-form'
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
  Form,
  FormControl,
  FormField,
  FormMessage,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
} from 'ui'
import { Admonition } from 'ui-patterns/Admonition'
import { ConfirmationModal } from 'ui-patterns/Dialogs/ConfirmationModal'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { z } from 'zod'

import { BucketDataProtectionFields } from '@/components/interfaces/Storage/BucketDataProtectionFields'
import {
  bucketProtectionFormFields,
  superRefineBucketProtection,
} from '@/components/interfaces/Storage/BucketDataProtectionFields.schema'
import {
  getMockBucketProtection,
  getVersioningPlanLimits,
  setMockBucketProtection,
  useIsStorageProtectionEnabled,
  type VersioningPlanLimits,
} from '@/components/interfaces/Storage/StorageProtection.constants'
import { StorageSizeUnits } from '@/components/interfaces/Storage/StorageSettings/StorageSettings.constants'
import {
  convertFromBytes,
  convertToBytes,
} from '@/components/interfaces/Storage/StorageSettings/StorageSettings.utils'
import { InlineLink } from '@/components/ui/InlineLink'
import { useProjectStorageConfigQuery } from '@/data/config/project-storage-config-query'
import { useBucketUpdateMutation } from '@/data/storage/bucket-update-mutation'
import { Bucket } from '@/data/storage/buckets-query'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import { DOCS_URL, IS_PLATFORM } from '@/lib/constants'

export interface EditBucketModalProps {
  visible: boolean
  bucket: Bucket
  onClose: () => void
}

const buildBucketSchema = (planLimits: VersioningPlanLimits | null) =>
  z
    .object({
      name: z.string(),
      public: z.boolean().default(false),
      has_file_size_limit: z.boolean().default(false),
      formatted_size_limit: z.coerce
        .number()
        .min(0, 'File size upload limit has to be at least 0')
        .optional(),
      allowed_mime_types: z.string().trim().default(''),
      ...bucketProtectionFormFields,
    })
    .superRefine((data, ctx) => superRefineBucketProtection(data, ctx, planLimits))

const formId = 'edit-storage-bucket-form'

export const EditBucketModal = ({ visible, bucket, onClose }: EditBucketModalProps) => {
  const { ref } = useParams()

  const { data } = useProjectStorageConfigQuery({ projectRef: ref }, { enabled: IS_PLATFORM })
  const { value, unit } = convertFromBytes(data?.fileSizeLimit ?? 0)
  const formattedGlobalUploadLimit = `${value} ${unit}`

  const { data: organization } = useSelectedOrganizationQuery()
  const planLimits = getVersioningPlanLimits(organization?.plan.id)
  const bucketProtection = getMockBucketProtection(bucket?.name)

  const bucketIdRef = useRef<string | null>(null)
  const [selectedUnit, setSelectedUnit] = useState<string>(StorageSizeUnits.MB)
  const { value: fileSizeLimit } = convertFromBytes(bucket?.file_size_limit ?? 0)

  const { mutate: updateBucket, isPending: isUpdating } = useBucketUpdateMutation({
    onSuccess: () => {
      toast.success(`Successfully updated bucket "${bucket?.name}"`)
      onClose()
    },
    onError: (error) => {
      // Handle specific error cases for inline display
      const errorMessage = error.message?.toLowerCase() || ''

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
        toast.error(`Failed to update bucket: ${error.message || 'Unknown error'}`)
      }
    },
  })

  // Prefill the two expiration inputs with sensible starter values when the
  // bucket has never had versioning turned on — so toggling versioning on
  // for the first time surfaces a policy ready to save, matching the create
  // form's defaults. If versioning is already on (or has been in the past)
  // respect the bucket's own values, including `null` which means the user
  // explicitly opted out of that particular condition.
  const hasEverBeenVersioned = bucketProtection.versioning !== 'disabled'
  const defaultVersionExpiryDays = hasEverBeenVersioned
    ? (bucketProtection.versionExpiryDays ?? ('' as const))
    : 30
  const defaultMaxNoncurrentVersions = hasEverBeenVersioned
    ? (bucketProtection.maxNoncurrentVersions ?? ('' as const))
    : 10

  const defaultValues = {
    name: bucket?.name ?? '',
    public: bucket?.public,
    has_file_size_limit: Boolean(bucket?.file_size_limit),
    formatted_size_limit: bucket?.file_size_limit ? (fileSizeLimit ?? 0) : undefined,
    allowed_mime_types: (bucket?.allowed_mime_types ?? []).join(', '),
    enable_versioning: !!planLimits && bucketProtection.versioning === 'enabled',
    version_expiry_days: defaultVersionExpiryDays,
    max_noncurrent_versions: defaultMaxNoncurrentVersions,
    expiration_mode: bucketProtection.expirationMode,
  }

  // Depends on the org's plan, which loads asynchronously — rebuild the
  // schema (and its versioning min/max validation) once it resolves.
  const bucketSchema = useMemo(() => buildBucketSchema(planLimits), [planLimits])

  const form = useForm<z.infer<typeof bucketSchema>>({
    resolver: zodResolver(bucketSchema),
    defaultValues,
    values: defaultValues,
    mode: 'onSubmit',
  })
  const { formatted_size_limit: formattedSizeLimitError } = form.formState.errors

  const isPublicBucket = useWatch({ control: form.control, name: 'public' })
  const hasFileSizeLimit = useWatch({ control: form.control, name: 'has_file_size_limit' })
  const [hasAllowedMimeTypes, setHasAllowedMimeTypes] = useState(
    Boolean(bucket?.allowed_mime_types?.length)
  )

  const showProtection = useIsStorageProtectionEnabled()
  const isChangingBucketVisibility = bucket?.public !== isPublicBucket
  const isMakingBucketPrivate = bucket?.public && !isPublicBucket
  const isMakingBucketPublic = !bucket?.public && isPublicBucket

  // Suspending a live-versioning bucket is the one action here that needs a
  // second confirmation — the switch alone doesn't communicate that
  // "already-retained data stays, no new versions get created" nuance
  // (the inline admonition is intentionally sparse per the redesign), so we
  // put the full picture in a follow-up AlertDialog and only actually save
  // when the user confirms it. Values are stashed at submit time; confirming
  // replays the write, cancelling bails.
  const [pendingSuspendedValues, setPendingSuspendedValues] =
    useState<z.infer<typeof bucketSchema>>()

  const closeModal = () => {
    form.reset()
    setPendingSuspendedValues(undefined)
    onClose()
  }

  const onSubmit: SubmitHandler<z.infer<typeof bucketSchema>> = async (values) => {
    if (bucket === undefined) return console.error('Bucket is required')
    if (ref === undefined) return console.error('Project ref is required')

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
        return form.setError('formatted_size_limit', {
          type: 'manual',
          message: 'exceed_global_limit',
        })
      }
    }

    // Suspending versioning is the one path that needs a second look — stash
    // the resolved values and hand off to the AlertDialog; it'll call
    // persistChanges once the user confirms.
    if (bucketProtection.versioning === 'enabled' && !values.enable_versioning) {
      setPendingSuspendedValues(values)
      return
    }

    persistChanges(values)
  }

  const persistChanges = (values: z.infer<typeof bucketSchema>) => {
    if (bucket === undefined || ref === undefined) return

    // [Prototype] Object versioning has no platform API yet — persist it to
    // the in-memory mock store so the buckets list reflects it right away.
    // Versioning can't go back to a plain "disabled" state once it's ever
    // been turned on — turning the switch off here suspends it instead.
    // When versioning is on, the form is the source of truth for both
    // retention fields — an empty input means "no limit for that condition"
    // and must persist as `null`, not silently fall back to the previous
    // value. When versioning is off but the bucket was previously versioned
    // (now suspended), the last retention settings are kept as-is so any
    // versions already retained keep expiring on the same schedule they
    // were created under.
    setMockBucketProtection(bucket.name, {
      versioning: values.enable_versioning
        ? 'enabled'
        : bucketProtection.versioning !== 'disabled'
          ? 'suspended'
          : 'disabled',
      versionExpiryDays: values.enable_versioning
        ? typeof values.version_expiry_days === 'number'
          ? values.version_expiry_days
          : null
        : bucketProtection.versioning !== 'disabled'
          ? bucketProtection.versionExpiryDays
          : null,
      maxNoncurrentVersions: values.enable_versioning
        ? typeof values.max_noncurrent_versions === 'number'
          ? values.max_noncurrent_versions
          : null
        : bucketProtection.versioning !== 'disabled'
          ? bucketProtection.maxNoncurrentVersions
          : null,
      expirationMode: values.expiration_mode,
    })

    updateBucket({
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
  }

  useEffect(() => {
    if (visible && bucket) {
      // Only set the selectedUnit when the bucket changes (different bucket ID)
      // This preserves the user's unit selection when reopening the modal for the same bucket
      if (bucketIdRef.current !== bucket.id && bucket.file_size_limit) {
        const { unit } = convertFromBytes(bucket.file_size_limit)
        setSelectedUnit(unit)
        bucketIdRef.current = bucket.id
      }
    }
  }, [visible, bucket, form])

  return (
    <>
      <Dialog
        open={visible}
        onOpenChange={(open) => {
          if (!open) closeModal()
        }}
      >
        <DialogContent>
        <DialogHeader>
          <DialogTitle>{`Edit bucket “${bucket?.name}”`}</DialogTitle>
        </DialogHeader>

        <DialogSectionSeparator />

        <Form {...form}>
          <form id={formId} onSubmit={form.handleSubmit(onSubmit)}>
            <DialogSection className="space-y-6">
              <FormField
                key="name"
                name="name"
                control={form.control}
                render={({ field }) => (
                  <FormItemLayout
                    hideMessage
                    name="name"
                    label="Bucket name"
                    labelOptional="Cannot be changed after creation"
                  >
                    <FormControl>
                      <Input id="name" {...field} disabled />
                    </FormControl>
                  </FormItemLayout>
                )}
              />

              <div className="flex flex-col gap-y-3">
                <FormField
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
                      <FormControl>
                        <Switch
                          id="public"
                          size="large"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItemLayout>
                  )}
                />

                {isChangingBucketVisibility && (
                  <Admonition
                    type="warning"
                    title={`Warning: Making bucket ${isMakingBucketPublic ? 'public' : 'private'}`}
                    description={
                      <>
                        {isMakingBucketPublic && (
                          <p>This will make all objects in your bucket publicly accessible.</p>
                        )}

                        {isMakingBucketPrivate && (
                          <>
                            <p className="mb-2 leading-normal!">
                              All objects in your bucket will only accessible via signed URLs, or
                              downloaded with the right authorization headers.
                            </p>
                            <p className="leading-normal!">
                              Assets cached in the CDN may still be publicly accessible. You can
                              consider{' '}
                              <InlineLink
                                href={`${DOCS_URL}/guides/storage/cdn/smart-cdn#cache-eviction`}
                              >
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
              </div>
            </DialogSection>

            <DialogSectionSeparator />

            <DialogSection className="space-y-2">
              <FormField
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
                    <FormControl>
                      <Switch
                        id="has_file_size_limit"
                        size="large"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItemLayout>
                )}
              />
              {hasFileSizeLimit && (
                <div>
                  <FormField
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
                            <FormControl>
                              <Input
                                id="formatted_size_limit"
                                aria-label="File size limit"
                                type="number"
                                min={0}
                                placeholder="0"
                                {...field}
                              />
                            </FormControl>
                          </div>
                          <div className="col-span-4">
                            <Select value={selectedUnit} onValueChange={setSelectedUnit}>
                              <SelectTrigger aria-label="File size limit unit" size="small">
                                <SelectValue>{selectedUnit}</SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                {Object.values(StorageSizeUnits).map((unit: string) => (
                                  <SelectItem key={unit} value={unit} className="text-xs">
                                    {unit}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </FormItemLayout>
                    )}
                  />
                  {formattedSizeLimitError?.message === 'exceed_global_limit' && (
                    <FormMessage className="mt-2">
                      Exceeds global limit of {formattedGlobalUploadLimit}. Increase limit in{' '}
                      <InlineLink
                        className="text-destructive decoration-destructive-500 hover:decoration-destructive"
                        href={`/project/${ref}/storage/settings`}
                        onClick={onClose}
                      >
                        Storage Settings
                      </InlineLink>{' '}
                      first.
                    </FormMessage>
                  )}

                  {IS_PLATFORM && (
                    <p className="text-sm text-foreground-lighter mt-2">
                      This project has a{' '}
                      <InlineLink
                        className="text-foreground-light hover:text-foreground"
                        href={`/project/${ref}/storage/settings`}
                        onClick={onClose}
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
                <FormControl>
                  <Switch
                    id="has_allowed_mime_types"
                    size="large"
                    checked={hasAllowedMimeTypes}
                    onCheckedChange={setHasAllowedMimeTypes}
                  />
                </FormControl>
              </FormItemLayout>
              {hasAllowedMimeTypes && (
                <FormField
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
                      <FormControl>
                        <Input
                          id="allowed_mime_types"
                          {...field}
                          placeholder="e.g image/jpeg, image/png, audio/mpeg, video/mp4, etc"
                        />
                      </FormControl>
                    </FormItemLayout>
                  )}
                />
              )}
            </DialogSection>

            {showProtection && (
              <BucketDataProtectionFields
                initialVersioningState={bucketProtection.versioning}
                initialRetentionDays={bucketProtection.versionExpiryDays}
                initialMaxVersions={bucketProtection.maxNoncurrentVersions}
                isPublicBucket={isPublicBucket}
              />
            )}
          </form>
        </Form>

          <DialogFooter>
            <Button variant="default" disabled={isUpdating} onClick={closeModal}>
              Cancel
            </Button>
            <Button form={formId} type="submit" loading={isUpdating}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmationModal
        variant="warning"
        visible={pendingSuspendedValues !== undefined}
        title="Suspend versioning?"
        confirmLabel="Suspend versioning"
        confirmLabelLoading="Saving..."
        loading={isUpdating}
        onCancel={() => setPendingSuspendedValues(undefined)}
        onConfirm={() => {
          if (pendingSuspendedValues) persistChanges(pendingSuspendedValues)
        }}
      >
        <p className="text-sm text-foreground-light">
          New noncurrent versions won't be created and archived files won't accumulate. Every
          version and archived file this bucket is already retaining stays exactly where it is
          until it's deleted or a lifecycle policy expires it. You can re-enable versioning at any
          time.
        </p>
      </ConfirmationModal>
    </>
  )
}
