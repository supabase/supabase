import { FC, useEffect, useState } from 'react'
import { Modal, Button, Input, Space, Typography } from '@supabase/ui'

interface Props {
  visible: boolean
  bucket: any
  onSelectCancel: () => void
  onSelectDelete: (bucket: any) => void
}

const DeleteBucketModal: FC<Props> = ({
  visible = false,
  bucket = {},
  onSelectCancel,
  onSelectDelete,
}) => {
  const [deleting, setDeleting] = useState(false)
  const [validationInput, setValidationInput] = useState('')

  useEffect(() => {
    setValidationInput('')
    setDeleting(false)
  }, [visible])

  const onConfirmDelete = () => {
    setDeleting(true)
    onSelectDelete(bucket)
  }

  return (
    <Modal
      visible={visible}
      title={`Confirm deletion of ${bucket.name}`}
      description="Are you sure you want to delete the selected bucket? This action cannot be undone."
      size="small"
      customFooter={
        <Space>
          <Button type="secondary" onClick={onSelectCancel}>
            Cancel
          </Button>
          <Button
            type="primary"
            danger
            loading={deleting}
            onClick={onConfirmDelete}
            disabled={bucket.name !== validationInput}
          >
            {deleting ? 'Deleting' : 'Delete'}
          </Button>
        </Space>
      }
    >
      <div className="w-full">
        <p className="mb-2 text-sm">
          <Typography.Text>
            Please type <span className="font-bold">{bucket.name}</span> to confirm
          </Typography.Text>
        </p>
        <Input
          autoFocus
          type="text"
          className="w-full"
          value={validationInput}
          onChange={(event) => setValidationInput(event.target.value)}
        />
      </div>
    </Modal>
  )
}

export default DeleteBucketModal
