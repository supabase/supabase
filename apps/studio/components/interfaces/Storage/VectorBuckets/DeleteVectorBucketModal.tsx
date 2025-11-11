import { toast } from 'sonner'

import { useParams } from 'common'
import { useVectorBucketDeleteMutation } from 'data/storage/vector-bucket-delete-mutation'
import { deleteVectorBucketIndex } from 'data/storage/vector-bucket-index-delete-mutation'
import { useVectorBucketsIndexesQuery } from 'data/storage/vector-buckets-indexes-query'
import TextConfirmModal from 'ui-patterns/Dialogs/TextConfirmModal'

export interface DeleteVectorBucketModalProps {
  visible: boolean
  bucketName?: string
  onCancel: () => void
  onSuccess: () => void
}

export const DeleteVectorBucketModal = ({
  visible,
  bucketName,
  onCancel,
  onSuccess,
}: DeleteVectorBucketModalProps) => {
  const { ref: projectRef } = useParams()

  const { mutate: deleteBucket, isLoading: isDeletingBucket } = useVectorBucketDeleteMutation({
    onSuccess: async () => {
      toast.success(`Bucket "${bucketName}" deleted successfully`)
      onSuccess()
    },
  })

  const { data: { indexes = [] } = {}, isLoading: isDeletingIndexes } =
    useVectorBucketsIndexesQuery({
      projectRef,
      vectorBucketName: bucketName,
    })

  const onConfirmDelete = async () => {
    if (!projectRef) return console.error('Project ref is required')
    if (!bucketName) return console.error('No bucket is selected')

    try {
      // delete all indexes from the bucket first
      const promises = indexes.map((index) =>
        deleteVectorBucketIndex({
          projectRef,
          bucketName: bucketName,
          indexName: index.indexName,
        })
      )
      await Promise.all(promises)
      deleteBucket({ projectRef, bucketName })
    } catch (error) {
      toast.error(
        `Failed to delete bucket: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  return (
    <TextConfirmModal
      visible={visible}
      size="medium"
      variant="destructive"
      title={`Delete bucket “${bucketName}”`}
      loading={isDeletingBucket || isDeletingIndexes}
      confirmPlaceholder="Type bucket name"
      confirmString={bucketName ?? ''}
      confirmLabel="Delete bucket"
      onCancel={onCancel}
      onConfirm={onConfirmDelete}
      alert={{
        title: 'You cannot recover this bucket once deleted',
        description: 'This action cannot be undone',
      }}
    >
      <p className="text-sm">
        Your bucket <span className="font-bold text-foreground">{bucketName}</span> and all of its
        contents will be permanently deleted.
      </p>
    </TextConfirmModal>
  )
}
