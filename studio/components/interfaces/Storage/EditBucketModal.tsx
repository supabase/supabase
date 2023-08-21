import clsx from 'clsx'
import { useParams } from 'common'
import { StorageSizeUnits } from 'components/to-be-cleaned/Storage/StorageSettings/StorageSettings.constants'
import {
  convertFromBytes,
  convertToBytes,
} from 'components/to-be-cleaned/Storage/StorageSettings/StorageSettings.utils'
import { useProjectStorageConfigQuery } from 'data/config/project-storage-config-query'
import { useBucketUpdateMutation } from 'data/storage/bucket-update-mutation'
import { useStore } from 'hooks'
import { IS_PLATFORM } from 'lib/constants'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import {
  Alert,
  Button,
  Collapsible,
  Form,
  IconChevronDown,
  Input,
  Listbox,
  Modal,
  Toggle,
} from 'ui'
import { StorageBucket } from './Storage.types'

export interface EditBucketModalProps {
  visible: boolean
  bucket?: StorageBucket
  onClose: () => void
}

const EditBucketModal = ({ visible, bucket, onClose }: EditBucketModalProps) => {
  const { ui } = useStore()
  const { ref } = useParams()

  const { mutate: updateBucket, isLoading: isUpdating } = useBucketUpdateMutation({
    onSuccess: () => {
      ui.setNotification({
        category: 'success',
        message: `Successfully updated bucket "${bucket?.name}"`,
      })
      onClose()
    },
  })
  const { data } = useProjectStorageConfigQuery({ projectRef: ref }, { enabled: IS_PLATFORM })
  const { value, unit } = convertFromBytes(data?.fileSizeLimit ?? 0)
  const formattedGlobalUploadLimit = `${value} ${unit}`

  const [selectedUnit, setSelectedUnit] = useState<StorageSizeUnits>(StorageSizeUnits.BYTES)
  const [showConfiguration, setShowConfiguration] = useState(false)

  const validate = (values: any) => {
    const errors = {} as any
    if (values.has_file_size_limit && values.formatted_size_limit < 0) {
      errors.formatted_size_limit = 'File size upload limit has to be at least 0'
    }
    return errors
  }

  const onSubmit = async (values: any) => {
    if (bucket === undefined) return console.error('Bucket is required')
    if (ref === undefined) return console.error('Project ref is required')

    updateBucket({
      projectRef: ref,
      id: bucket.id,
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
      const { unit } = convertFromBytes(bucket?.file_size_limit ?? 0)
      setSelectedUnit(unit)
      setShowConfiguration(false)
    }
  }, [visible])

  return (
    <Modal
      hideFooter
      visible={visible}
      size="medium"
      header={`Edit bucket "${bucket?.name}"`}
      onCancel={onClose}
    >
      <Form validateOnBlur={false} initialValues={{}} validate={validate} onSubmit={onSubmit}>
        {({ values, resetForm }: { values: any; resetForm: any }) => {
          // [Alaister] although this "technically" is breaking the rules of React hooks
          // it won't error because the hooks are always rendered in the same order
          // eslint-disable-next-line react-hooks/rules-of-hooks
          useEffect(() => {
            if (visible && bucket !== undefined) {
              const { value: fileSizeLimit } = convertFromBytes(bucket.file_size_limit ?? 0)

              const values = {
                name: bucket.name ?? '',
                public: bucket.public,
                file_size_limit: bucket.file_size_limit,
                allowed_mime_types: (bucket.allowed_mime_types ?? []).join(', '),

                has_file_size_limit: bucket.file_size_limit !== null,
                formatted_size_limit: fileSizeLimit ?? 0,
              }
              resetForm({ values, initialValues: values })
            }
          }, [visible])

          return (
            <div className="space-y-4 py-4">
              <Modal.Content>
                <Input
                  disabled
                  id="name"
                  name="name"
                  type="text"
                  className="w-full"
                  layout="vertical"
                  label="Name of bucket"
                  labelOptional="Buckets cannot be renamed once created."
                />
                <div className="space-y-2 mt-6">
                  <Toggle
                    id="public"
                    name="public"
                    layout="flex"
                    label="Public bucket"
                    descriptionText="Anyone can read any object without any authorization"
                  />
                  {bucket?.public !== values.public && (
                    <Alert
                      title={
                        !bucket?.public && values.public
                          ? 'Warning: Making bucket public'
                          : bucket?.public && !values.public
                          ? 'Warning: Making bucket private'
                          : ''
                      }
                      variant="warning"
                      withIcon
                    >
                      <p className="mb-2">
                        {!bucket?.public && values.public
                          ? `This will make all objects in the bucket "${bucket?.name}" public`
                          : bucket?.public && !values.public
                          ? `All objects in "${bucket?.name}" will be made private and will only be accessible via signed URLs or downloaded with the right authorisation headers`
                          : ''}
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
                              <p className="text-scale-1000 text-sm">
                                Note: The{' '}
                                <Link href={`/project/${ref}/settings/storage`}>
                                  <a className="text-brand opacity-80 hover:opacity-100 transition">
                                    global upload limit
                                  </a>
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
                      placeholder="e.g image/jpg, image/png, audio/mpeg, video/mp4, etc"
                      labelOptional="Comma separated values"
                      descriptionText="Leave the field blank to allow any MIME type to be uploaded"
                    />
                  </div>
                </Collapsible.Content>
              </Collapsible>
              <div className="w-full border-t border-scale-500 !mt-0" />
              <Modal.Content>
                <div className="flex items-center space-x-2 justify-end">
                  <Button type="default" disabled={isUpdating} onClick={() => onClose()}>
                    Cancel
                  </Button>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={isUpdating}
                    disabled={isUpdating}
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

export default EditBucketModal
