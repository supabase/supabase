import clsx from 'clsx'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import {
  Alert,
  Button,
  Modal,
  Input,
  Toggle,
  Form,
  Collapsible,
  IconChevronDown,
  Listbox,
} from 'ui'
import { BucketCreatePayload } from './Storage.types'
import { useStorageStore } from 'localStores/storageExplorer/StorageExplorerStore'
import { StorageSizeUnits } from 'components/to-be-cleaned/Storage/StorageSettings/StorageSettings.constants'
import {
  convertToBytes,
  convertFromBytes,
} from 'components/to-be-cleaned/Storage/StorageSettings/StorageSettings.utils'
import { useStore } from 'hooks'
import { useParams } from 'common'
import { useProjectStorageConfigQuery } from 'data/config/project-storage-config-query'
import { useRouter } from 'next/router'

export interface CreateBucketModalProps {
  visible: boolean
  onClose: () => void
}

const CreateBucketModal = ({ visible, onClose }: CreateBucketModalProps) => {
  const { ui } = useStore()
  const { ref } = useParams()
  const router = useRouter()
  const storageExplorerStore = useStorageStore()
  const { createBucket } = storageExplorerStore

  const { data } = useProjectStorageConfigQuery({ projectRef: ref })
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
    if (values.has_file_size_limit && values.formatted_size_limit < 0) {
      errors.formatted_size_limit = 'File size upload limit has to be at least 0'
    }
    return errors
  }

  const onSubmit = async (values: any, { setSubmitting }: any) => {
    const payload: BucketCreatePayload = {
      id: values.name,
      public: values.public,
      file_size_limit: values.has_file_size_limit
        ? convertToBytes(values.formatted_size_limit, selectedUnit)
        : null,
      allowed_mime_types:
        values.allowed_mime_types.length > 0
          ? values.allowed_mime_types.split(',').map((x: string) => x.trim())
          : null,
    }

    setSubmitting(true)
    const res = await createBucket(payload)
    if (res.error) {
      setSubmitting(false)
    } else {
      ui.setNotification({
        category: 'success',
        message: `Successfully created bucket "${res.name}"`,
      })
      router.push(`/project/${ref}/storage/buckets/${res.name}`)
      onClose()
    }
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
      onCancel={onClose}
    >
      <Form
        validateOnBlur={false}
        initialValues={initialValues}
        validate={validate}
        onSubmit={onSubmit}
      >
        {({ values, isSubmitting }: { values: any; isSubmitting: boolean }) => {
          return (
            <div className="space-y-4 py-4">
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
                  <div className="w-full cursor-pointer py-3 px-5 flex items-center justify-between border-t border-scale-500">
                    <p className="text-sm">Additional configuration</p>
                    <IconChevronDown
                      size={18}
                      strokeWidth={2}
                      className={clsx('text-scale-1100', showConfiguration && 'rotate-180')}
                    />
                  </div>
                </Collapsible.Trigger>
                <Collapsible.Content className="py-4">
                  <div className="w-full space-y-4 px-5">
                    <div className="space-y-2">
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
                          <div className="col-span-12">
                            <p className="text-scale-1000 text-sm">
                              Note: The{' '}
                              <Link href={`/project/${ref}/settings/storage`}>
                                <a className="text-brand-900 opacity-80 hover:opacity-100 transition">
                                  global upload limit
                                </a>
                              </Link>{' '}
                              takes precedence over this value ({formattedGlobalUploadLimit})
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                    <Input
                      id="allowed_mime_types"
                      name="allowed_mime_types"
                      layout="vertical"
                      label="Allowed MIME types"
                      placeholder="e.g image/jpg, image/png, audio/mpeg, video/mp4, etc"
                      descriptionText="Comma separated values"
                    />
                  </div>
                </Collapsible.Content>
              </Collapsible>
              <div className="w-full border-t border-scale-500 !mt-0" />
              <Modal.Content>
                <div className="flex items-center space-x-2 justify-end">
                  <Button type="default" disabled={isSubmitting} onClick={() => onClose()}>
                    Cancel
                  </Button>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={isSubmitting}
                    disabled={isSubmitting}
                  >
                    Save
                  </Button>
                </div>
              </Modal.Content>
            </div>
          )
        }}
      </Form>
    </Modal>
  )
}

export default CreateBucketModal
