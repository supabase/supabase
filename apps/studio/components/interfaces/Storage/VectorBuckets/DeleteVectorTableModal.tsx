import { toast } from 'sonner'

import { useParams } from 'common'
import { useVectorBucketIndexDeleteMutation } from 'data/storage/vector-bucket-index-delete-mutation'
import { VectorBucketIndex } from 'data/storage/vector-buckets-indexes-query'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'

interface DeleteVectorTableModalProps {
  visible: boolean
  table?: VectorBucketIndex
  onClose: () => void
}

export const DeleteVectorTableModal = ({
  visible,
  table,
  onClose,
}: DeleteVectorTableModalProps) => {
  const { ref: projectRef } = useParams()

  const { mutate: deleteIndex, isLoading: isDeleting } = useVectorBucketIndexDeleteMutation({
    onSuccess: (_, vars) => {
      toast.success(`Table "${vars.indexName}" deleted successfully`)
      onClose()
    },
  })

  const onConfirmDelete = () => {
    if (!projectRef) return console.error('Project ref is required')
    if (!table) return console.error('Vector table is required')

    deleteIndex({
      projectRef,
      bucketName: table.vectorBucketName,
      indexName: table.indexName,
    })
  }

  return (
    <ConfirmationModal
      visible={visible}
      loading={isDeleting}
      variant="destructive"
      title={`Confirm to delete table "${table?.indexName}"`}
      onConfirm={onConfirmDelete}
      onCancel={onClose}
    >
      {/* [Joshen] Can probably beef up more details here - what are potential side effects of deleting a table */}
      <p className="text-sm">This action cannot be undone.</p>
    </ConfirmationModal>
  )
}
