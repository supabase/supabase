import { useParams } from 'common'
import { toast } from 'sonner'

import { useBucketEmptyMutation } from 'data/storage/bucket-empty-mutation'
import type { Bucket } from 'data/storage/buckets-query'
import { useStorageExplorerStateSnapshot } from 'state/storage-explorer'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'

export interface EmptyBucketModalProps {
  visible: boolean
  bucket?: Bucket
  onClose: () => void
}

export const EmptyBucketModal = ({ visible = false, bucket, onClose }: EmptyBucketModalProps) => {
  const { ref: projectRef } = useParams()
  const { fetchFolderContents } = useStorageExplorerStateSnapshot()

  const { mutate: emptyBucket, isLoading } = useBucketEmptyMutation({
    onSuccess: async () => {
      if (bucket === undefined) return
      await fetchFolderContents({ folderId: bucket.id, folderName: bucket.name, index: -1 })
      toast.success(`Successfully deleted bucket ${bucket!.name}`)
      onClose()
    },
  })

  const onEmptyBucket = async () => {
    if (!projectRef) return console.error('Project ref is required')
    if (!bucket) return console.error('No bucket is selected')
    emptyBucket({ projectRef, id: bucket.id })
  }

  return (
    <ConfirmationModal
      variant={'destructive'}
      size="small"
      title={`Confirm to delete all contents from ${bucket?.name}`}
      confirmLabel="Empty bucket"
      visible={visible}
      loading={isLoading}
      onCancel={() => onClose()}
      onConfirm={onEmptyBucket}
      alert={{
        title: 'This action cannot be undone',
        description: 'The contents of your bucket cannot be recovered once deleted',
      }}
    >
      <p className="text-sm">Are you sure you want to empty the bucket "{bucket?.name}"?</p>
    </ConfirmationModal>
  )
}
