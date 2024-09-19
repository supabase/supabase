import { ChevronDown } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { useParams } from 'common'
import { StorageSizeUnits } from 'components/to-be-cleaned/Storage/StorageSettings/StorageSettings.constants'
import {
  convertFromBytes,
  convertToBytes,
} from 'components/to-be-cleaned/Storage/StorageSettings/StorageSettings.utils'
import { useProjectStorageConfigQuery } from 'data/config/project-storage-config-query'
import { useBucketCreateMutation } from 'data/storage/bucket-create-mutation'
import { IS_PLATFORM } from 'lib/constants'
import { Alert, Button, Collapsible, Form, Input, Listbox, Modal, Toggle, cn } from 'ui'

export interface CreateBucketModalProps {
  visible: boolean
  onClose: () => void
}

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

  const { data } = useProjectStorageConfigQuery({ projectRef: ref }, { enabled: IS_PLATFORM })
  const { value, unit } = convertFromBytes(data?.fileSizeLimit ?? 0)
  const formattedGlobalUploadLimit = `${value} ${unit}`

  const [selectedUnit, setSelectedUnit] = useState<StorageSizeUnits>(StorageSizeUnits.BYTES)
  const [showConfiguration, setShowConfiguration] = useState(false)

  const initialValues = {
    name: '',
    public: false,
    file_size_limit: 0,
    allowed_mime_types: '',
    has_file_size_limit: false,
    formatted_size_limit: 0,
  }

  const validate = (values: any) => {
    const errors = {} as any
    if (!values.name) {
      errors.name = 'Please provide a name for your bucket'
    }
    if (values.name && values.name.endsWith(' ')) {
      errors.name = 'The name of the bucket cannot end with a whitespace'
    }

    if (values.has_file_size_limit && values.formatted_size_limit < 0) {
      errors.formatted_size_limit = 'File size upload limit has to be at least 0'
    }
    if (values.name === 'public') {
      errors.name = '"public" is a reserved name. Please choose another name'
    }
    return errors
  }

  const onSubmit = async (values: any) => {
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
      setSelectedUnit(StorageSizeUnits.BYTES)
      setShowConfiguration(false)
    }
  }, [visible])

  return (
    <Modal
      hideFooter
      visible={visible}
      size="medium"
      header="Create storage bucket"
      onCancel={() => onClose()}
    >
      <Form
        validateOnBlur={false}
        initialValues={initialValues}
        validate={validate}
        onSubmit={onSubmit}
      >
        {({ values }: { values: any }) => {
          return (
            <>
              <Modal.Content>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  className="w-full"
                  layout="vertical"
                  label="Name of bucket"
                  labelOptional="Buckets cannot be renamed once created."
                  descriptionText="Only lowercase letters, numbers, dots, and hyphens"
                />
                <div className="space-y-2 mt-6">
                  <Toggle
                    id="public"
                    name="public"
                    layout="flex"
                    label="Public bucket"
                    descriptionText="Anyone can read any object without any authorization"
                  />
                  {values.public && (
                    <Alert title="Public buckets are not protected" variant="warning" withIcon>
                      <p className="mb-2">
                        Users can read objects in public buckets without any authorization.
                      </p>
                      <p>
                        Row level security (RLS) policies are still required for other operations
                        such as object uploads and deletes.
                      </p>
                    </Alert>
                  )}
                </div>
              </Modal.Content>
              <Collapsible
                open={showConfiguration}
                onOpenChange={() => setShowConfiguration(!showConfiguration)}
              >
                <Collapsible.Trigger asChild>
                  <div className="w-full cursor-pointer py-3 px-5 flex items-center justify-between border-t border-default">
                    <p className="text-sm">Additional configuration</p>
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
                      <Toggle
                        id="has_file_size_limit"
                        name="has_file_size_limit"
                        layout="flex"
                        label="Restrict file upload size for bucket"
                        descriptionText="Prevent uploading of file sizes greater than a specified limit"
                      />
                      {values.has_file_size_limit && (
                        <div className="grid grid-cols-12 col-span-12 gap-x-2 gap-y-1">
                          <div className="col-span-8">
                            <Input
                              type="number"
                              step={1}
                              id="formatted_size_limit"
                              name="formatted_size_limit"
                              disabled={false}
                              onKeyPress={(event) => {
                                if (event.charCode < 48 || event.charCode > 57) {
                                  event.preventDefault()
                                }
                              }}
                              descriptionText={`Equivalent to ${convertToBytes(
                                values.formatted_size_limit,
                                selectedUnit
                              ).toLocaleString()} bytes.`}
                            />
                          </div>
                          <div className="col-span-4">
                            <Listbox
                              id="size_limit_units"
                              disabled={false}
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
                                Note: The{' '}
                                <Link
                                  href={`/project/${ref}/settings/storage`}
                                  className="text-brand opacity-80 hover:opacity-100 transition"
                                >
                                  global upload limit
                                </Link>{' '}
                                takes precedence over this value ({formattedGlobalUploadLimit})
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <Input
                      id="allowed_mime_types"
                      name="allowed_mime_types"
                      layout="vertical"
                      label="Allowed MIME types"
                      placeholder="e.g image/jpeg, image/png, audio/mpeg, video/mp4, etc"
                      labelOptional="Comma separated values"
                      descriptionText="Wildcards are allowed, e.g. image/*. Leave blank to allow any MIME type."
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
            </>
          )
        }}
      </Form>
    </Modal>
  )
}

export default CreateBucketModal
