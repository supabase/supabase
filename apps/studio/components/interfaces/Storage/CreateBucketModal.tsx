import { zodResolver } from '@hookform/resolvers/zod'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { snakeCase } from 'lodash'
import { Plus } from 'lucide-react'
import { useRouter } from 'next/router'
import { useState } from 'react'
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
  DialogTrigger,
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
import { useIsNewStorageUIEnabled } from '../App/FeaturePreview/FeaturePreviewContext'
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
    type: z.enum(['STANDARD', 'ANALYTICS']).default('STANDARD'),
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
  buttonSize?: 'tiny' | 'small'
  buttonType?: 'default' | 'primary'
  buttonClassName?: string
  label?: string
}

export const CreateBucketModal = ({
  buttonSize = 'tiny',
  buttonType = 'default',
  buttonClassName,
  label = 'New bucket',
}: CreateBucketModalProps) => {
  const router = useRouter()
  const { ref } = useParams()
  const { data: org } = useSelectedOrganizationQuery()
  const isStorageV2 = useIsNewStorageUIEnabled()

  const [visible, setVisible] = useState(false)
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
      type: 'STANDARD',
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
      setVisible(false)
      if (!isStorageV2) router.push(`/project/${ref}/storage/buckets/${values.name}`)
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
    setVisible(false)
  }

  return (
    <Dialog
      open={visible}
      onOpenChange={(open) => {
        if (!open) {
          handleClose()
        }
      }}
    >
      <DialogTrigger asChild>
        <ButtonTooltip
          block
          size={buttonSize}
          type={buttonType}
          className={buttonClassName}
          icon={<Plus size={14} />}
          disabled={!canCreateBuckets}
          style={{ justifyContent: 'start' }}
          onClick={() => setVisible(true)}
          tooltip={{
            content: {
              side: 'bottom',
              text: !canCreateBuckets
                ? 'You need additional permissions to create buckets'
                : undefined,
            },
          }}
        >
          {label}
        </ButtonTooltip>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create storage bucket</DialogTitle>
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
                    label="Name of bucket"
                    labelOptional="Buckets cannot be renamed once created."
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

              {!isStorageV2 && (
                <FormField_Shadcn_
                  key="type"
                  name="type"
                  control={form.control}
                  render={({ field }) => (
                    <FormItemLayout label="Bucket type">
                      <FormControl_Shadcn_>
                        <RadioGroupStacked
                          id="type"
                          value={field.value}
                          onValueChange={(v) => field.onChange(v)}
                        >
                          <RadioGroupStackedItem
                            id="STANDARD"
                            value="STANDARD"
                            label="Standard bucket"
                            description="Compatible with S3 buckets."
                            showIndicator={false}
                          />
                          {IS_PLATFORM && (
                            <RadioGroupStackedItem
                              id="ANALYTICS"
                              value="ANALYTICS"
                              label="Analytics bucket"
                              showIndicator={false}
                              disabled={!icebergCatalogEnabled}
                            >
                              <>
                                <p className="text-foreground-light text-left">
                                  Stores Iceberg files and is optimized for analytical workloads.
                                </p>

                                {icebergCatalogEnabled ? null : (
                                  <div className="w-full flex gap-x-2 py-2 items-center">
                                    <WarningIcon />
                                    <span className="text-xs text-left">
                                      This feature is currently in alpha and not yet enabled for
                                      your project. Sign up{' '}
                                      <InlineLink href="https://forms.supabase.com/analytics-buckets">
                                        here
                                      </InlineLink>
                                      .
                                    </span>
                                  </div>
                                )}
                              </>
                            </RadioGroupStackedItem>
                          )}
                        </RadioGroupStacked>
                      </FormControl_Shadcn_>
                    </FormItemLayout>
                  )}
                />
              )}
            </DialogSection>

            <DialogSectionSeparator />

            {isStandardBucket ? (
              <>
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
                                <Select_Shadcn_
                                  value={selectedUnit}
                                  onValueChange={setSelectedUnit}
                                >
                                  <SelectTrigger_Shadcn_
                                    aria-label="File size limit unit"
                                    size="small"
                                  >
                                    <SelectValue_Shadcn_>{selectedUnit}</SelectValue_Shadcn_>
                                  </SelectTrigger_Shadcn_>
                                  <SelectContent_Shadcn_>
                                    {Object.values(StorageSizeUnits).map((unit: string) => (
                                      <SelectItem_Shadcn_
                                        key={unit}
                                        value={unit}
                                        className="text-xs"
                                      >
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
                            onClick={() => setVisible(false)}
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
                            onClick={() => setVisible(false)}
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
              </>
            ) : (
              <>
                {icebergWrapperExtensionState === 'installed' ? (
                  <Label_Shadcn_ className="text-foreground-lighter leading-1 flex flex-col gap-y-2">
                    <p>
                      <span>Supabase will setup a </span>
                      <a
                        href={`${BASE_PATH}/project/${ref}/integrations/iceberg_wrapper/overview`}
                        target="_blank"
                        className="underline text-foreground-light"
                      >
                        foreign data wrapper
                        {bucketName && <span className="text-brand"> {`${bucketName}_fdw`}</span>}
                      </a>
                      <span>
                        {' '}
                        for easier access to the data. This action will also create{' '}
                        <a
                          href={`${BASE_PATH}/project/${ref}/storage/access-keys`}
                          target="_blank"
                          className="underline text-foreground-light"
                        >
                          S3 Access Keys
                          {bucketName && (
                            <>
                              {' '}
                              named <span className="text-brand"> {`${bucketName}_keys`}</span>
                            </>
                          )}
                        </a>
                        <span> and </span>
                        <a
                          href={`${BASE_PATH}/project/${ref}/integrations/vault/secrets`}
                          target="_blank"
                          className="underline text-foreground-light"
                        >
                          four Vault Secrets
                          {bucketName && (
                            <>
                              {' '}
                              prefixed with{' '}
                              <span className="text-brand"> {`${bucketName}_vault_`}</span>
                            </>
                          )}
                        </a>
                        .
                      </span>
                    </p>
                    <p>
                      As a final step, you'll need to create an{' '}
                      <span className="text-foreground-light">Iceberg namespace</span> before you
                      connect the Iceberg data to your database.
                    </p>
                  </Label_Shadcn_>
                ) : (
                  <Alert_Shadcn_ variant="warning">
                    <WarningIcon />
                    <AlertTitle_Shadcn_>
                      You need to install the Iceberg wrapper extension to connect your Analytic
                      bucket to your database.
                    </AlertTitle_Shadcn_>
                    <AlertDescription_Shadcn_ className="flex flex-col gap-y-2">
                      <p>
                        You need to install the <span className="text-brand">wrappers</span>{' '}
                        extension (with the minimum version of <span>0.5.3</span>) if you want to
                        connect your Analytics bucket to your database.
                      </p>
                    </AlertDescription_Shadcn_>
                  </Alert_Shadcn_>
                )}
              </>
            )}
          </form>
        </Form_Shadcn_>

        <DialogFooter>
          <Button
            type="default"
            disabled={isCreating || isCreatingIcebergWrapper}
            onClick={() => setVisible(false)}
          >
            Cancel
          </Button>
          <Button
            form={formId}
            htmlType="submit"
            loading={isCreating || isCreatingIcebergWrapper}
            disabled={isCreating || isCreatingIcebergWrapper}
          >
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
