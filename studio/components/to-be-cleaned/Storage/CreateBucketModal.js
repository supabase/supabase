import { useEffect, useState } from 'react'
import { Modal, Alert, Button, Input, Space, Typography, Toggle } from '@supabase/ui'

const CreateBucketModal = ({
  visible = false,
  onSelectCancel = () => {},
  onSelectSave = () => {},
}) => {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [bucketName, setBucketName] = useState('')
  const [isPublic, setIsPublic] = useState(false)

  useEffect(() => {
    setError('')
    setBucketName('')
    setSaving(false)
    setIsPublic(false)
  }, [visible])

  const onCreateBucket = (event) => {
    if (event) {
      event.preventDefault()
    }

    if (bucketName.length === 0) {
      onSelectCancel()
    } else {
      if (bucketName.includes(' ')) {
        return setError('Bucket names should not have any spaces')
      }
      if (bucketName.match(/[:;'"/?!#$%^&*()+_{}\[\]|\s]/g)) {
        return setError('Only dots(.) or hyphens(-) are allowed')
      }
      if (bucketName !== bucketName.toLowerCase()) {
        return setError('Only lowercase letters are allowed')
      }
      setError('')
      setSaving(true)
      onSelectSave(bucketName, isPublic)
    }
  }

  return (
    <Modal
      visible={visible}
      title="Create new bucket"
      size="large"
      onCancel={onSelectCancel}
      customFooter={
        <Space>
          <Button type="secondary" onClick={onSelectCancel}>
            Cancel
          </Button>
          <Button type="primary" loading={saving} onClick={onCreateBucket}>
            {saving ? 'Creating bucket' : 'Create bucket'}
          </Button>
        </Space>
      }
    >
      <div className="space-y-6 w-full pb-3">
        <form className="space-y-6">
          <div className="flex items-center relative">
            <Input
              autoFocus
              label="Name of bucket"
              labelOptional="Buckets cannot be renamed once created."
              descriptionText={
                <Typography.Text type="secondary">
                  Only lowercase letters, numbers, dots, and hyphens
                </Typography.Text>
              }
              layout="horizontal"
              error={error}
              type="text"
              className="w-full"
              placeholder="e.g new-bucket"
              value={bucketName}
              onChange={(event) => setBucketName(event.target.value)}
            />
          </div>
          <div className="space-y-4">
            <Toggle
              name="isPublic"
              label="Make bucket public"
              layout="horizontal"
              size="medium"
              onChange={() => setIsPublic(!isPublic)}
            />
            {isPublic && (
              <Alert title="Warning: Public bucket" variant="warning" withIcon>
                Users can read objects in public buckets without any authorization. RLS policies are
                still required other operations such as object uploads and deletes.
              </Alert>
            )}
          </div>
          <button className="hidden" type="submit" onClick={onCreateBucket} />
        </form>
      </div>
    </Modal>
  )
}

export default CreateBucketModal
