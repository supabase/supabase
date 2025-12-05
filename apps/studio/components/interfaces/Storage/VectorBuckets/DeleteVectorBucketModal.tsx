import { useState } from 'react'
import { toast } from 'sonner'

import { TextConfirmModal } from 'components/ui/TextConfirmModalWrapper'
import { useFDWDeleteMutation } from 'data/fdw/fdw-delete-mutation'
import { useVectorBucketDeleteMutation } from 'data/storage/vector-bucket-delete-mutation'
import { deleteVectorBucketIndex } from 'data/storage/vector-bucket-index-delete-mutation'
import { useVectorBucketsIndexesQuery } from 'data/storage/vector-buckets-indexes-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { useS3VectorsWrapperInstance } from './useS3VectorsWrapperInstance'

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
  const { data: project } = useSelectedProjectQuery()
  // Has to be a state because we're using a promise.all to delete the indexes
  const [isDeletingIndexes, setIsDeletingIndexes] = useState(false)

  const { data: vectorBucketWrapper, meta: wrapperMeta } = useS3VectorsWrapperInstance({
    bucketId: bucketName,
  })

  const { mutate: deleteFDW } = useFDWDeleteMutation()

  const { mutateAsync: deleteBucket, isPending: isDeletingBucket } = useVectorBucketDeleteMutation({
    onSuccess: async () => {
      toast.success(`Bucket "${bucketName}" deleted successfully`)
      if (vectorBucketWrapper) {
        deleteFDW({
          projectRef: project?.ref,
          connectionString: project?.connectionString,
          wrapper: vectorBucketWrapper,
          wrapperMeta: wrapperMeta!,
        })
      }
      onSuccess()
    },
  })

  const { data: { indexes = [] } = {}, isLoading: isLoadingIndexes } = useVectorBucketsIndexesQuery(
    {
      projectRef: project?.ref,
      vectorBucketName: bucketName,
    }
  )

  const onConfirmDelete = async () => {
    if (!project?.ref) return console.error('Project ref is required')
    if (!bucketName) return console.error('No bucket is selected')

    try {
      setIsDeletingIndexes(true)
      // delete all indexes from the bucket first
      const promises = indexes.map((index) =>
        deleteVectorBucketIndex({
          projectRef: project?.ref,
          bucketName: bucketName,
          indexName: index.indexName,
        })
      )
      await Promise.all(promises)

      await deleteBucket({ projectRef: project?.ref, bucketName })
    } catch (error) {
      toast.error(
        `Failed to delete bucket: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    } finally {
      setIsDeletingIndexes(false)
    }
  }

  return (
    <TextConfirmModal
      visible={visible}
      size="medium"
      variant="destructive"
      title={`Delete bucket “${bucketName}”`}
      loading={isDeletingBucket || isDeletingIndexes || isLoadingIndexes}
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
