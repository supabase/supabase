import { useEffect, useState } from 'react'
import { Modal, Alert, Button, Space } from '@supabase/ui'

const ToggleBucketPublicModal = ({
  visible = false,
  bucket = {},
  onSelectCancel = () => {},
  onSelectSave = () => {},
}) => {
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setSaving(false)
  }, [visible])

  const onToggleBucketPublic = () => {
    setSaving(true)
    onSelectSave(bucket)
  }

  const title = bucket.public
    ? `Confirm making ${bucket.name} private`
    : `Confirm making ${bucket.name} public`

  const alertTitle = bucket.public
    ? `Warning: Making bucket private`
    : `Warning: Making bucket public`

  const alertDescription = bucket.public
    ? `This will make all objects in ${bucket.name} private. They can only be accessed via signed URLs or downloaded with the right authorisation headers`
    : `This will make all objects in ${bucket.name} public`

  return (
    <Modal
      visible={visible}
      title={title}
      size="large"
      customFooter={
        <Space>
          <Button type="secondary" onClick={onSelectCancel}>
            Cancel
          </Button>
          <Button type="primary" loading={saving} onClick={onToggleBucketPublic}>
            {saving ? 'Updating bucket' : 'Update bucket'}
          </Button>
        </Space>
      }
    >
      <div className="space-y-6 w-full pb-3">
        <Alert title={alertTitle} variant="warning" withIcon>
          {alertDescription}
        </Alert>
      </div>
    </Modal>
  )
}

export default ToggleBucketPublicModal
