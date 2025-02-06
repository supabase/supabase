import { useParams } from 'common'
import { useDeletePublicationMutation } from 'data/replication/delete-publication-mutation'
import { toast } from 'sonner'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'

export type DeletePublicationModalProps = {
  visible: boolean
  title: string
  sourceId: number
  publicationName: string
  onClose: () => void
}

export const DeletePublicationModal = ({
  visible,
  title,
  sourceId,
  publicationName,
  onClose,
}: DeletePublicationModalProps) => {
  const { ref } = useParams()
  const { mutate: deletePublication, isLoading: isCreating } = useDeletePublicationMutation({
    onSuccess: (res) => {
      toast.success('Successfully deleted publication')
      onClose()
    },
  })
  const onConfirm = () => {
    deletePublication({
      projectRef: ref!,
      sourceId,
      publicationName,
    })
  }
  return (
    <ConfirmationModal
      variant="destructive"
      visible={visible}
      title={title}
      confirmLabel="Delete"
      confirmLabelLoading="Deleting"
      onCancel={() => {
        onClose()
      }}
      onConfirm={onConfirm}
    >
      <div className="space-y-4">
        <p className="text-sm text-foreground-light">
          Are you sure you want to delete the selected publication? This action cannot be undone.
        </p>
      </div>
    </ConfirmationModal>
  )
}
