import { FC, useEffect, useState } from 'react'
import { Modal, Alert, Button, Input, Space, Typography, Toggle } from '@supabase/ui'

interface Props {
  visible : boolean
  onSelectCancel: () => {}
  onSelectSave: () => {}
}

const CreateBucketModal: FC<Props> = ({
  visible = false,
  onSelectCancel = () => {},
  onSelectSave = (bucketName: string, isPublic: boolean) => {},
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

  const onCreateBucket = (event: React.MouseEvent<HTMLElement>) => {
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
      header="Create storage bucket"
      size="medium"
      onCancel={onSelectCancel}
      customFooter={
        <div className="flex items-center gap-2">
          <Button type="default" onClick={onSelectCancel}>
            Cancel
          </Button>
          <Button type="primary" disabled={saving} loading={saving} onClick={onCreateBucket}>
            {saving ? 'Creating bucket' : 'Create bucket'}
          </Button>
        </div>
      }
    >
      <form className="space-y-6 py-4">
        <Modal.Content>
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
              layout="vertical"
              error={error}
              type="text"
              className="w-full"
              placeholder="e.g new-bucket"
              value={bucketName}
              onChange={(event) => setBucketName(event.target.value)}
            />
          </div>
        </Modal.Content>
        <Modal.Seperator />
        <Modal.Content>
          <div className="space-y-4">
            <Toggle
              name="isPublic"
              label="Public bucket"
              descriptionText="Anyone can read any object without any authorization"
              layout="flex"
              size="medium"
              onChange={() => setIsPublic(!isPublic)}
            />
            {isPublic && (
              <Alert title="Public buckets are not protected" variant="warning" withIcon>
                <p className="mb-2">
                  Users can read objects in public buckets without any authorization.
                </p>
                <p>
                  Row level security (RLS) policies are still required for other operations such as
                  object uploads and deletes.
                </p>
              </Alert>
            )}
          </div>
        </Modal.Content>
        <button className="hidden" type="submit" onClick={onCreateBucket} />
      </form>
    </Modal>
  )
}

export default CreateBucketModal
