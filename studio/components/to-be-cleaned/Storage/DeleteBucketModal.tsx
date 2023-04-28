import { FC, useEffect, useState } from 'react'
import TextConfirmModal from 'components/ui/Modals/TextConfirmModal'

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
    <TextConfirmModal
      visible={visible}
      title={`Confirm deletion of ${bucket.name}`}
      confirmPlaceholder="Type in name of bucket"
      onConfirm={onConfirmDelete}
      onCancel={onSelectCancel}
      confirmString={bucket.name}
      loading={deleting}
      text={
        <>
          Your bucket <span className="font-bold">{bucket.name}</span> and all its contents will be
          permanently deleted.
        </>
      }
      alert="You cannot recover this bucket once it is deleted."
      confirmLabel={`Delete bucket ${bucket.name}`}
    />
  )
}

export default DeleteBucketModal
