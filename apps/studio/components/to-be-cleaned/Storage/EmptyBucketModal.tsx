import { useParams } from 'common'
import toast from 'react-hot-toast'

import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { useBucketEmptyMutation } from 'data/storage/bucket-empty-mutation'
import type { Bucket } from 'data/storage/buckets-query'
import { useStorageStore } from 'localStores/storageExplorer/StorageExplorerStore'
import {
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  IconAlertTriangle,
  Modal,
} from 'ui'

export interface EmptyBucketModalProps {
  visible: boolean
  bucket?: Bucket
  onClose: () => void
}

export const EmptyBucketModal = ({ visible = false, bucket, onClose }: EmptyBucketModalProps) => {
  const { ref: projectRef } = useParams()
  const { fetchFolderContents } = useStorageStore()

  const { mutate: emptyBucket, isLoading } = useBucketEmptyMutation({
    onSuccess: async () => {
      if (bucket === undefined) return
      await fetchFolderContents(bucket.id, bucket.name, -1)
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
      danger
      size="small"
      visible={visible}
      onSelectCancel={() => onClose()}
      onSelectConfirm={onEmptyBucket}
      header={`Confirm to delete all contents from ${bucket?.name}`}
      buttonLabel="Empty bucket"
    >
      <Modal.Content className="py-4 space-y-2">
        <Alert_Shadcn_ variant="warning">
          <IconAlertTriangle strokeWidth={2} />
          <AlertTitle_Shadcn_>This action cannot be undone</AlertTitle_Shadcn_>
          <AlertDescription_Shadcn_>
            The contents of your bucket cannot be recovered once deleted
          </AlertDescription_Shadcn_>
        </Alert_Shadcn_>
        <p className="text-sm">Are you sure you want to empty the bucket "{bucket?.name}"?</p>
      </Modal.Content>
    </ConfirmationModal>
  )
}
