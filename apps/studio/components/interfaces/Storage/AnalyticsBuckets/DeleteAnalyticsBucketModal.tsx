import { toast } from 'sonner'

import { useParams } from 'common'
import { useAnalyticsBucketDeleteMutation } from 'data/storage/analytics-bucket-delete-mutation'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import TextConfirmModal from 'ui-patterns/Dialogs/TextConfirmModal'
import {
  useAnalyticsBucketAssociatedEntities,
  useAnalyticsBucketDeleteCleanUp,
} from './AnalyticsBucketDetails/useAnalyticsBucketAssociatedEntities'

export interface DeleteAnalyticsBucketModalProps {
  visible: boolean
  bucketId?: string
  onClose: () => void
  onSuccess?: () => void
}

export const DeleteAnalyticsBucketModal = ({
  visible,
  bucketId,
  onClose,
  onSuccess,
}: DeleteAnalyticsBucketModalProps) => {
  const { ref: projectRef } = useParams()
  const { data: project } = useSelectedProjectQuery()

  const { icebergWrapper, icebergWrapperMeta, s3AccessKey, publication } =
    useAnalyticsBucketAssociatedEntities({ projectRef, bucketId: bucketId })

  const { mutateAsync: deleteAnalyticsBucketCleanUp, isLoading: isCleaningUpAnalyticsBucket } =
    useAnalyticsBucketDeleteCleanUp()

  const { mutate: deleteAnalyticsBucket, isLoading: isDeletingAnalyticsBucket } =
    useAnalyticsBucketDeleteMutation({
      onSuccess: async () => {
        if (project?.connectionString) {
          await deleteAnalyticsBucketCleanUp({
            projectRef,
            connectionString: project.connectionString,
            bucketId: bucketId,
            icebergWrapper,
            icebergWrapperMeta,
            s3AccessKey,
            publication,
          })
        }
        toast.success(`Successfully deleted analytics bucket ${bucketId}`)
        onClose()
        onSuccess?.()
      },
    })

  const onConfirmDelete = async () => {
    if (!projectRef) return console.error('Project ref is required')
    if (!bucketId) return console.error('No bucket is selected')
    deleteAnalyticsBucket({ projectRef, id: bucketId })
  }

  const isDeleting = isDeletingAnalyticsBucket || isCleaningUpAnalyticsBucket

  return (
    <TextConfirmModal
      visible={visible}
      size="medium"
      variant="destructive"
      title={`Delete bucket “${bucketId}”`}
      loading={isDeleting}
      confirmPlaceholder="Type bucket name"
      confirmString={bucketId ?? ''}
      confirmLabel="Delete bucket"
      onCancel={onClose}
      onConfirm={onConfirmDelete}
      alert={{
        title: 'You cannot recover this bucket once deleted',
        description: 'This action cannot be undone',
      }}
    >
      <p className="text-sm">
        Your bucket <span className="font-bold text-foreground">{bucketId}</span> and all of its
        contents will be permanently deleted.
      </p>
    </TextConfirmModal>
  )
}
