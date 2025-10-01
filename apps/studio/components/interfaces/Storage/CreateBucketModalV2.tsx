import { zodResolver } from '@hookform/resolvers/zod'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { snakeCase } from 'lodash'
import { Edit } from 'lucide-react'
import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import { SubmitHandler, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import z from 'zod'

import { useParams } from 'common'
import { useIcebergWrapperExtension } from 'components/interfaces/Storage/AnalyticBucketDetails/useIcebergWrapper'
import { StorageSizeUnits } from 'components/interfaces/Storage/StorageSettings/StorageSettings.constants'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { InlineLink } from 'components/ui/InlineLink'
import { useProjectStorageConfigQuery } from 'data/config/project-storage-config-query'
import { useBucketCreateMutation } from 'data/storage/bucket-create-mutation'
import { useIcebergWrapperCreateMutation } from 'data/storage/iceberg-wrapper-create-mutation'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { BASE_PATH, IS_PLATFORM } from 'lib/constants'
import {
  Alert_Shadcn_,
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
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
  Label_Shadcn_,
  RadioGroupStacked,
  RadioGroupStackedItem,
  Select_Shadcn_,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
  Switch,
  WarningIcon,
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
    type: z.enum(['STANDARD', 'ANALYTICS', 'VECTORS']).default('STANDARD'),
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

interface CreateBucketModalV2Props {
  visible: boolean
  onOpenChange: (open: boolean) => void
  defaultBucketType?: 'STANDARD' | 'ANALYTICS' | 'VECTORS'
}

export const CreateBucketModalV2 = ({
  visible,
  onOpenChange,
  defaultBucketType = 'STANDARD',
}: CreateBucketModalV2Props) => {
  const router = useRouter()
  const { ref } = useParams()
  const { data: org } = useSelectedOrganizationQuery()

  const [selectedUnit, setSelectedUnit] = useState<string>(StorageSizeUnits.MB)

  const { can: canCreateBuckets } = useAsyncCheckPermissions(PermissionAction.STORAGE_WRITE, '*')

  const { mutate: sendEvent } = useSendEventMutation()
  const { mutateAsync: createBucket, isLoading: isCreating } = useBucketCreateMutation({
    // [Joshen] Silencing the error here as it's being handled in onSubmit
    onError: () => {},
  })
  const { mutateAsync: createIcebergWrapper, isLoading: isCreatingIcebergWrapper } =
    useIcebergWrapperCreateMutation()

  const { data } = useProjectStorageConfigQuery({ projectRef: ref }, { enabled: IS_PLATFORM })
  const { value, unit } = convertFromBytes(data?.fileSizeLimit ?? 0)
  const formattedGlobalUploadLimit = `${value} ${unit}`

  const form = useForm<CreateBucketForm>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: '',
      public: false,
      type: defaultBucketType,
      has_file_size_limit: false,
      formatted_size_limit: undefined,
      allowed_mime_types: '',
    },
  })
  const { formatted_size_limit: formattedSizeLimitError } = form.formState.errors

  const bucketName = snakeCase(form.watch('name'))
  const isPublicBucket = form.watch('public')
  const isStandardBucket = form.watch('type') === 'STANDARD'
  const hasFileSizeLimit = form.watch('has_file_size_limit')
  const [hasAllowedMimeTypes, setHasAllowedMimeTypes] = useState(false)
  const icebergWrapperExtensionState = useIcebergWrapperExtension()
  const icebergCatalogEnabled = data?.features?.icebergCatalog?.enabled

  // Reset form when modal opens/closes
  useEffect(() => {
    if (visible) {
      form.reset({
        name: '',
        public: false,
        type: defaultBucketType,
        has_file_size_limit: false,
        formatted_size_limit: undefined,
        allowed_mime_types: '',
      })
      setSelectedUnit(StorageSizeUnits.MB)
      setHasAllowedMimeTypes(false)
    }
  }, [visible, defaultBucketType, form])

  const onSubmit: SubmitHandler<CreateBucketForm> = async (values) => {
    if (!ref) return console.error('Project ref is required')

    if (values.type === 'ANALYTICS' && !icebergCatalogEnabled) {
      return toast.error(
        'The Analytics catalog feature is not enabled for your project. Please contact support to enable it.'
      )
    }

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
        type: values.type,
        isPublic: values.public,
        file_size_limit: fileSizeLimit,
        allowed_mime_types: allowedMimeTypes,
      })
      sendEvent({
        action: 'storage_bucket_created',
        properties: { bucketType: values.type },
        groups: { project: ref ?? 'Unknown', organization: org?.slug ?? 'Unknown' },
      })

      if (values.type === 'ANALYTICS' && icebergWrapperExtensionState === 'installed') {
        await createIcebergWrapper({ bucketName: values.name })
      }

      toast.success(`Successfully created bucket ${values.name}`)
      form.reset()

      setSelectedUnit(StorageSizeUnits.MB)
      onOpenChange(false)
      router.push(`/project/${ref}/storage/buckets/${values.name}`)
    } catch (error: any) {
      // Handle specific error cases for inline display
      const errorMessage = error.message?.toLowerCase() || ''
      if (errorMessage.includes('already exists')) {
        form.setError('name', {
          type: 'manual',
          message: 'A bucket with this name already exists',
        })
      } else if (errorMessage.includes('invalid name')) {
        form.setError('name', {
          type: 'manual',
          message: 'Invalid bucket name',
        })
      } else {
        toast.error(`Failed to create bucket: ${error.message}`)
      }
    }
  }

  if (!canCreateBuckets) {
    return null
  }

  return (
    <Dialog open={visible} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <Form_Shadcn_ {...form}>
          <form id={formId} onSubmit={form.handleSubmit(onSubmit)}>
            <DialogHeader>
              <DialogTitle>Create a new bucket</DialogTitle>
            </DialogHeader>

            <DialogSection>
              <FormField_Shadcn_
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItemLayout
                    layout="flex-row-reverse"
                    label="Name"
                    description="This is the name of your bucket. It cannot be changed after creation."
                  >
                    <FormControl_Shadcn_>
                      <Input_Shadcn_
                        placeholder="e.g my-awesome-bucket"
                        autoComplete="off"
                        {...field}
                      />
                    </FormControl_Shadcn_>
                    <FormMessage_Shadcn_ />
                  </FormItemLayout>
                )}
              />

              <FormField_Shadcn_
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItemLayout
                    layout="flex-row-reverse"
                    label="Type"
                    description="Select the type of bucket you want to create."
                  >
                    <FormControl_Shadcn_>
                      <RadioGroupStacked
                        value={field.value}
                        onValueChange={field.onChange}
                        className="grid grid-cols-1 gap-3"
                      >
                        <RadioGroupStackedItem
                          value="STANDARD"
                          label="Standard"
                          description="General file storage"
                        />
                        <RadioGroupStackedItem
                          value="ANALYTICS"
                          label="Analytics"
                          description="Purpose-built for analytical workloads"
                        />
                        <RadioGroupStackedItem
                          value="VECTORS"
                          label="Vectors"
                          description="Purpose-built for vector data"
                        />
                      </RadioGroupStacked>
                    </FormControl_Shadcn_>
                    <FormMessage_Shadcn_ />
                  </FormItemLayout>
                )}
              />

              <FormField_Shadcn_
                control={form.control}
                name="public"
                render={({ field }) => (
                  <FormItemLayout
                    layout="flex-row-reverse"
                    label="Public bucket"
                    description="Anyone can read objects in this bucket"
                  >
                    <FormControl_Shadcn_>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl_Shadcn_>
                    <FormMessage_Shadcn_ />
                  </FormItemLayout>
                )}
              />

              {/* File size limit section */}
              <div className="space-y-4">
                <FormField_Shadcn_
                  control={form.control}
                  name="has_file_size_limit"
                  render={({ field }) => (
                    <FormItemLayout
                      layout="flex-row-reverse"
                      label="File size limit"
                      description="Restrict the maximum size of files that can be uploaded"
                    >
                      <FormControl_Shadcn_>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl_Shadcn_>
                      <FormMessage_Shadcn_ />
                    </FormItemLayout>
                  )}
                />

                {hasFileSizeLimit && (
                  <div className="grid grid-cols-12 gap-4">
                    <div className="col-span-8">
                      <FormField_Shadcn_
                        control={form.control}
                        name="formatted_size_limit"
                        render={({ field }) => (
                          <FormItemLayout
                            layout="flex-row-reverse"
                            label="Maximum file size"
                            description={`Global limit: ${formattedGlobalUploadLimit}`}
                          >
                            <FormControl_Shadcn_>
                              <Input_Shadcn_
                                type="number"
                                placeholder="100"
                                {...field}
                                onChange={(e) => field.onChange(Number(e.target.value))}
                              />
                            </FormControl_Shadcn_>
                            <FormMessage_Shadcn_ />
                          </FormItemLayout>
                        )}
                      />
                    </div>
                    <div className="col-span-4">
                      <Label_Shadcn_>Unit</Label_Shadcn_>
                      <Select_Shadcn_ value={selectedUnit} onValueChange={setSelectedUnit}>
                        <SelectTrigger_Shadcn_>
                          <SelectValue_Shadcn_ />
                        </SelectTrigger_Shadcn_>
                        <SelectContent_Shadcn_>
                          <SelectItem_Shadcn_ value={StorageSizeUnits.BYTES}>
                            Bytes
                          </SelectItem_Shadcn_>
                          <SelectItem_Shadcn_ value={StorageSizeUnits.KB}>KB</SelectItem_Shadcn_>
                          <SelectItem_Shadcn_ value={StorageSizeUnits.MB}>MB</SelectItem_Shadcn_>
                          <SelectItem_Shadcn_ value={StorageSizeUnits.GB}>GB</SelectItem_Shadcn_>
                          <SelectItem_Shadcn_ value={StorageSizeUnits.TB}>TB</SelectItem_Shadcn_>
                        </SelectContent_Shadcn_>
                      </Select_Shadcn_>
                    </div>
                  </div>
                )}
              </div>

              {/* Allowed MIME types section */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch checked={hasAllowedMimeTypes} onCheckedChange={setHasAllowedMimeTypes} />
                  <Label_Shadcn_>Allowed MIME types</Label_Shadcn_>
                </div>

                {hasAllowedMimeTypes && (
                  <FormField_Shadcn_
                    control={form.control}
                    name="allowed_mime_types"
                    render={({ field }) => (
                      <FormItemLayout
                        layout="flex-row-reverse"
                        label="MIME types"
                        description="Comma-separated list of allowed MIME types (e.g. image/jpeg, image/png)"
                      >
                        <FormControl_Shadcn_>
                          <Input_Shadcn_ placeholder="image/jpeg, image/png" {...field} />
                        </FormControl_Shadcn_>
                        <FormMessage_Shadcn_ />
                      </FormItemLayout>
                    )}
                  />
                )}
              </div>

              {/* Bucket name preview */}
              {bucketName && (
                <div className="p-3 bg-muted rounded-md">
                  <p className="text-sm text-foreground-light">
                    <span className="font-medium">Preview:</span> {bucketName}
                  </p>
                </div>
              )}

              {/* Warnings */}
              {isPublicBucket && (
                <Alert_Shadcn_ variant="warning">
                  <WarningIcon />
                  <AlertTitle_Shadcn_>Warning: Public bucket</AlertTitle_Shadcn_>
                  <AlertDescription_Shadcn_>
                    Anyone can read objects in this bucket. Make sure you understand the security
                    implications.
                  </AlertDescription_Shadcn_>
                </Alert_Shadcn_>
              )}

              {formattedSizeLimitError?.message === 'exceed_global_limit' && (
                <Alert_Shadcn_ variant="destructive">
                  <WarningIcon />
                  <AlertTitle_Shadcn_>File size limit exceeded</AlertTitle_Shadcn_>
                  <AlertDescription_Shadcn_>
                    The file size limit cannot exceed the global limit of{' '}
                    {formattedGlobalUploadLimit}.
                  </AlertDescription_Shadcn_>
                </Alert_Shadcn_>
              )}
            </DialogSection>

            <DialogSectionSeparator />

            <DialogFooter>
              <Button type="secondary" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={isCreating || isCreatingIcebergWrapper}
                disabled={isCreating || isCreatingIcebergWrapper}
              >
                Create bucket
              </Button>
            </DialogFooter>
          </form>
        </Form_Shadcn_>
      </DialogContent>
    </Dialog>
  )
}
