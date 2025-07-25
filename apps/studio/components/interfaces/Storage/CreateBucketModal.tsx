import { zodResolver } from '@hookform/resolvers/zod'
import { snakeCase } from 'lodash'
import { ChevronDown } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { SubmitHandler, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import z from 'zod'

import { useParams } from 'common'
import { useIcebergWrapperExtension } from 'components/interfaces/Storage/AnalyticBucketDetails/useIcebergWrapper'
import { StorageSizeUnits } from 'components/interfaces/Storage/StorageSettings/StorageSettings.constants'
import {
  convertFromBytes,
  convertToBytes,
} from 'components/interfaces/Storage/StorageSettings/StorageSettings.utils'
import { useProjectStorageConfigQuery } from 'data/config/project-storage-config-query'
import { useBucketCreateMutation } from 'data/storage/bucket-create-mutation'
import { useIcebergWrapperCreateMutation } from 'data/storage/iceberg-wrapper-create-mutation'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { BASE_PATH, IS_PLATFORM } from 'lib/constants'
import {
  Alert_Shadcn_,
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Button,
  cn,
  Collapsible,
  Form_Shadcn_,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  Input_Shadcn_,
  Label_Shadcn_,
  Listbox,
  Modal,
  RadioGroupStacked,
  RadioGroupStackedItem,
  Toggle,
  WarningIcon,
} from 'ui'
import { Admonition } from 'ui-patterns/admonition'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

export interface CreateBucketModalProps {
  visible: boolean
  onClose: () => void
}

const FormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Please provide a name for your bucket')
    .regex(
      /^[a-z0-9.-]+$/,
      'The name of the bucket must only contain lowercase letters, numbers, dots, and hyphens'
    )
    .refine((value) => !value.endsWith(' '), 'The name of the bucket cannot end with a whitespace')
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
    .default(0),
  allowed_mime_types: z.string().trim().default(''),
})

export type CreateBucketForm = z.infer<typeof FormSchema>

const CreateBucketModal = ({ visible, onClose }: CreateBucketModalProps) => {
  const { ref } = useParams()
  const org = useSelectedOrganization()
  const { mutate: sendEvent } = useSendEventMutation()
  const router = useRouter()

  const { mutateAsync: createBucket, isLoading: isCreating } = useBucketCreateMutation()
  const { mutateAsync: createIcebergWrapper, isLoading: isCreatingIcebergWrapper } =
    useIcebergWrapperCreateMutation()

  const { data } = useProjectStorageConfigQuery({ projectRef: ref }, { enabled: IS_PLATFORM })
  const { value, unit } = convertFromBytes(data?.fileSizeLimit ?? 0)
  const formattedGlobalUploadLimit = `${value} ${unit}`

  const [selectedUnit, setSelectedUnit] = useState<StorageSizeUnits>(StorageSizeUnits.BYTES)
  const [showConfiguration, setShowConfiguration] = useState(false)

  const form = useForm<CreateBucketForm>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: '',
      public: false,
      type: 'STANDARD',
      has_file_size_limit: false,
      formatted_size_limit: 0,
      allowed_mime_types: '',
    },
  })

  const bucketName = snakeCase(form.watch('name'))
  const isPublicBucket = form.watch('public')
  const isStandardBucket = form.watch('type') === 'STANDARD'
  const hasFileSizeLimit = form.watch('has_file_size_limit')
  const formattedSizeLimit = form.watch('formatted_size_limit')
  const icebergWrapperExtensionState = useIcebergWrapperExtension()

  const onSubmit: SubmitHandler<CreateBucketForm> = async (values) => {
    if (!ref) return console.error('Project ref is required')

    if (values.type === 'ANALYTICS' && !icebergCatalogEnabled) {
      toast.error(
        'The Analytics catalog feature is not enabled for your project. Please contact support to enable it.'
      )
      return
    }

    try {
      const fileSizeLimit = values.has_file_size_limit
        ? convertToBytes(values.formatted_size_limit, selectedUnit)
        : undefined

      const allowedMimeTypes =
        values.allowed_mime_types.length > 0
          ? values.allowed_mime_types.split(',').map((x) => x.trim())
          : undefined

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
      router.push(`/project/${ref}/storage/buckets/${values.name}`)
      onClose()
    } catch (error) {
      console.error(error)
      toast.error('Failed to create bucket')
    }
  }

  useEffect(() => {
    if (visible) {
      form.reset()
      setSelectedUnit(StorageSizeUnits.BYTES)
      setShowConfiguration(false)
    }
  }, [visible, form])

  const icebergCatalogEnabled = data?.features?.icebergCatalog?.enabled

  return (
    <Modal
      hideFooter
      visible={visible}
      size="medium"
      header="Create storage bucket"
      onCancel={() => onClose()}
    >
      <Form_Shadcn_ {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Modal.Content>
            <FormField_Shadcn_
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItemLayout
                  label="Name of bucket"
                  labelOptional="Buckets cannot be renamed once created."
                  description="Only lowercase letters, numbers, dots, and hyphens"
                  layout="vertical"
                >
                  <FormControl_Shadcn_>
                    <Input_Shadcn_ {...field} placeholder="Enter bucket name" />
                  </FormControl_Shadcn_>
                </FormItemLayout>
              )}
            />

            <div className="flex flex-col gap-y-2 mt-6">
              <FormField_Shadcn_
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItemLayout>
                    <FormControl_Shadcn_>
                      <RadioGroupStacked
                        id="type"
                        onValueChange={(v) => field.onChange(v)}
                        value={field.value}
                      >
                        <RadioGroupStackedItem
                          value="STANDARD"
                          id="STANDARD"
                          label="Standard bucket"
                          showIndicator={false}
                        >
                          <div className="flex  gap-x-5">
                            <div className="flex flex-col">
                              <p className="text-foreground-light text-left">
                                Compatible with S3 buckets.
                              </p>
                            </div>
                          </div>
                        </RadioGroupStackedItem>
                        {IS_PLATFORM && (
                          <RadioGroupStackedItem
                            value="ANALYTICS"
                            id="ANALYTICS"
                            label="Analytics bucket"
                            showIndicator={false}
                            disabled={!icebergCatalogEnabled}
                          >
                            <div className="flex  gap-x-5">
                              <div className="flex flex-col">
                                <p className="text-foreground-light text-left">
                                  Stores Iceberg files and is optimized for analytical workloads.
                                </p>
                              </div>
                            </div>
                            {icebergCatalogEnabled ? null : (
                              <div className="w-full flex gap-x-2 py-2 items-center">
                                <WarningIcon />
                                <span className="text-xs text-left">
                                  This feature is currently in alpha and not yet enabled for your
                                  project. Sign up{' '}
                                  <a
                                    className="underline"
                                    target="_blank"
                                    rel="noreferrer"
                                    href="https://forms.supabase.com/analytics-buckets"
                                  >
                                    here
                                  </a>
                                </span>
                              </div>
                            )}
                          </RadioGroupStackedItem>
                        )}
                      </RadioGroupStacked>
                    </FormControl_Shadcn_>
                  </FormItemLayout>
                )}
              />
            </div>
          </Modal.Content>
          <Modal.Separator />
          {isStandardBucket ? (
            <>
              <Modal.Content className="!px-0 !pb-0">
                <div className="flex flex-col gap-y-2">
                  <FormField_Shadcn_
                    control={form.control}
                    name="public"
                    render={({ field }) => (
                      <FormItemLayout className="px-5">
                        <FormControl_Shadcn_>
                          <Toggle
                            id="public"
                            checked={field.value}
                            onChange={field.onChange}
                            layout="flex"
                            label="Public bucket"
                            descriptionText="Anyone can read any object without any authorization"
                          />
                        </FormControl_Shadcn_>
                      </FormItemLayout>
                    )}
                  />
                  {isPublicBucket && (
                    <Admonition
                      type="warning"
                      className="rounded-none border-x-0 border-b-0 mb-0 [&>div>p]:!leading-normal"
                      title="Public buckets are not protected"
                    >
                      <p className="mb-2">
                        Users can read objects in public buckets without any authorization.
                      </p>
                      <p>
                        Row level security (RLS) policies are still required for other operations
                        such as object uploads and deletes.
                      </p>
                    </Admonition>
                  )}
                </div>
              </Modal.Content>
              <Modal.Separator />
              <Collapsible
                open={showConfiguration}
                onOpenChange={() => setShowConfiguration(!showConfiguration)}
              >
                <Collapsible.Trigger asChild>
                  <div className="w-full cursor-pointer py-3 px-5 flex items-center justify-between">
                    <p className="text-sm">Additional restrictions</p>
                    <ChevronDown
                      size={18}
                      strokeWidth={2}
                      className={cn('text-foreground-light', showConfiguration && 'rotate-180')}
                    />
                  </div>
                </Collapsible.Trigger>
                <Collapsible.Content className="py-4">
                  <div className="w-full space-y-5 px-5">
                    <div className="space-y-5">
                      <FormField_Shadcn_
                        control={form.control}
                        name="has_file_size_limit"
                        render={({ field }) => (
                          <FormItemLayout>
                            <FormControl_Shadcn_>
                              <Toggle
                                id="has_file_size_limit"
                                checked={field.value}
                                onChange={field.onChange}
                                layout="flex"
                                label="Restrict file upload size for bucket"
                                descriptionText="Prevent uploading of file sizes greater than a specified limit"
                              />
                            </FormControl_Shadcn_>
                          </FormItemLayout>
                        )}
                      />
                      {hasFileSizeLimit && (
                        <div className="grid grid-cols-12 col-span-12 gap-x-2 gap-y-1">
                          <div className="col-span-8">
                            <FormField_Shadcn_
                              control={form.control}
                              name="formatted_size_limit"
                              render={({ field }) => (
                                <FormItemLayout>
                                  <FormControl_Shadcn_>
                                    <Input_Shadcn_
                                      type="number"
                                      step={1}
                                      {...field}
                                      onKeyPress={(event) => {
                                        if (event.charCode < 48 || event.charCode > 57) {
                                          event.preventDefault()
                                        }
                                      }}
                                    />
                                  </FormControl_Shadcn_>
                                  <span className="text-foreground-light text-xs">
                                    Equivalent to{' '}
                                    {convertToBytes(
                                      formattedSizeLimit,
                                      selectedUnit
                                    ).toLocaleString()}{' '}
                                    bytes.
                                  </span>
                                </FormItemLayout>
                              )}
                            />
                          </div>
                          <div className="col-span-4">
                            <Listbox
                              id="size_limit_units"
                              value={selectedUnit}
                              onChange={setSelectedUnit}
                            >
                              {Object.values(StorageSizeUnits).map((unit: string) => (
                                <Listbox.Option key={unit} label={unit} value={unit}>
                                  <div>{unit}</div>
                                </Listbox.Option>
                              ))}
                            </Listbox>
                          </div>
                          {IS_PLATFORM && (
                            <div className="col-span-12">
                              <p className="text-foreground-light text-sm">
                                Note: Individual bucket uploads will still be capped at the{' '}
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
                      control={form.control}
                      name="allowed_mime_types"
                      render={({ field }) => (
                        <FormItemLayout
                          label="Allowed MIME types"
                          labelOptional="Comma separated values"
                          description="Wildcards are allowed, e.g. image/*. Leave blank to allow any MIME type."
                          layout="vertical"
                        >
                          <FormControl_Shadcn_>
                            <Input_Shadcn_
                              {...field}
                              placeholder="e.g image/jpeg, image/png, audio/mpeg, video/mp4, etc"
                            />
                          </FormControl_Shadcn_>
                        </FormItemLayout>
                      )}
                    />
                  </div>
                </Collapsible.Content>
              </Collapsible>
            </>
          ) : (
            <Modal.Content>
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
                      You need to install the <span className="text-brand">wrappers</span> extension
                      (with the minimum version of <span>0.5.3</span>) if you want to connect your
                      Analytics bucket to your database.
                    </p>
                  </AlertDescription_Shadcn_>
                </Alert_Shadcn_>
              )}
            </Modal.Content>
          )}
          <Modal.Separator />
          <Modal.Content className="flex items-center space-x-2 justify-end">
            <Button
              type="default"
              htmlType="button"
              disabled={isCreating || isCreatingIcebergWrapper}
              onClick={() => onClose()}
            >
              Cancel
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={isCreating || isCreatingIcebergWrapper}
              disabled={isCreating || isCreatingIcebergWrapper}
            >
              Create
            </Button>
          </Modal.Content>
        </form>
      </Form_Shadcn_>
    </Modal>
  )
}

export default CreateBucketModal
