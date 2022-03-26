import { useEffect, useState } from 'react'
import { Modal, Alert, Button } from '@supabase/ui'
import ConfirmationModal from 'components/ui/ConfirmationModal'

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
    <ConfirmationModal
      danger
      visible={visible}
      title={title}
      children={
        <div className="py-4">
          <Modal.Content>
            <Alert title={alertTitle} variant="warning" withIcon>
              {alertDescription}
            </Alert>
          </Modal.Content>
        </div>
      }
      buttonLabel="Update bucket"
      buttonLoadingLabel="Updating bucket"
      onSelectCancel={onSelectCancel}
      onSelectConfirm={onToggleBucketPublic}
    />
  )
}

export default ToggleBucketPublicModal
