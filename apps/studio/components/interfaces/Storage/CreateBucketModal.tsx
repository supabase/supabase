import { zodResolver } from '@hookform/resolvers/zod'
import { ChevronDown } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { SubmitHandler, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import z from 'zod'

import { useParams } from 'common'
import { StorageSizeUnits } from 'components/to-be-cleaned/Storage/StorageSettings/StorageSettings.constants'
import {
  convertFromBytes,
  convertToBytes,
} from 'components/to-be-cleaned/Storage/StorageSettings/StorageSettings.utils'
import { useProjectStorageConfigQuery } from 'data/config/project-storage-config-query'
import { useBucketCreateMutation } from 'data/storage/bucket-create-mutation'
import { IS_PLATFORM } from 'lib/constants'
import {
  Button,
  cn,
  Collapsible,
  Form_Shadcn_,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  Input_Shadcn_,
  Listbox,
  Modal,
  Toggle,
} from 'ui'
import { Admonition } from 'ui-patterns'
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
  const router = useRouter()

  const { mutate: createBucket, isLoading: isCreating } = useBucketCreateMutation({
    onSuccess: (res) => {
      toast.success(`Successfully created bucket ${res.name}`)
      router.push(`/project/${ref}/storage/buckets/${res.name}`)
      onClose()
    },
  })

  const { data } = useProjectStorageConfigQuery(
    { projectRef: ref },
    { enabled: IS_PLATFORM && visible }
  )
  const { value, unit } = convertFromBytes(data?.fileSizeLimit ?? 0)
  const formattedGlobalUploadLimit = `${value} ${unit}`

  const [selectedUnit, setSelectedUnit] = useState<StorageSizeUnits>(StorageSizeUnits.BYTES)
  const [showConfiguration, setShowConfiguration] = useState(false)

  const form = useForm<CreateBucketForm>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: '',
      public: false,
      has_file_size_limit: false,
      formatted_size_limit: 0,
      allowed_mime_types: '',
    },
  })

  const isPublicBucket = form.watch('public')
  const hasFileSizeLimit = form.watch('has_file_size_limit')
  const formattedSizeLimit = form.watch('formatted_size_limit')

  const onSubmit: SubmitHandler<CreateBucketForm> = async (values) => {
    if (!ref) return console.error('Project ref is required')

    createBucket({
      projectRef: ref,
      id: values.name,
      isPublic: values.public,
      file_size_limit: values.has_file_size_limit
        ? convertToBytes(values.formatted_size_limit, selectedUnit)
        : null,
      allowed_mime_types:
        values.allowed_mime_types.length > 0
          ? values.allowed_mime_types.split(',').map((x: string) => x.trim())
          : null,
    })
  }

  useEffect(() => {
    if (visible) {
      form.reset()
      setSelectedUnit(StorageSizeUnits.BYTES)
      setShowConfiguration(false)
    }
  }, [visible, form])

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
          <Modal.Content className={cn('!px-0', isPublicBucket && '!pb-0')}>
            <FormField_Shadcn_
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItemLayout
                  label="Name of bucket"
                  labelOptional="Buckets cannot be renamed once created."
                  description="Only lowercase letters, numbers, dots, and hyphens"
                  layout="vertical"
                  className="px-5"
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
                    Row level security (RLS) policies are still required for other operations such
                    as object uploads and deletes.
                  </p>
                </Admonition>
              )}
            </div>
          </Modal.Content>
          <Collapsible
            open={showConfiguration}
            onOpenChange={() => setShowConfiguration(!showConfiguration)}
          >
            <Collapsible.Trigger asChild>
              <div className="w-full cursor-pointer py-3 px-5 flex items-center justify-between border-t border-default">
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
                                {convertToBytes(formattedSizeLimit, selectedUnit).toLocaleString()}{' '}
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
          <Modal.Separator />
          <Modal.Content className="flex items-center space-x-2 justify-end">
            <Button
              type="default"
              htmlType="button"
              disabled={isCreating}
              onClick={() => onClose()}
            >
              Cancel
            </Button>
            <Button type="primary" htmlType="submit" loading={isCreating} disabled={isCreating}>
              Save
            </Button>
          </Modal.Content>
        </form>
      </Form_Shadcn_>
    </Modal>
  )
}

export default CreateBucketModal
