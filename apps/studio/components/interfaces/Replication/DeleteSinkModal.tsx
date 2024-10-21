import { useParams } from 'common'
import { useDeleteSinkMutation } from 'data/replication/delete-sink-mutation'
import { toast } from 'sonner'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'

export type DeleteSinkModalProps = {
  visible: boolean
  title: string
  sinkId: number
  onClose: () => void
}

export const DeleteSinkModal = ({ visible, title, sinkId, onClose }: DeleteSinkModalProps) => {
  const { ref } = useParams()
  const { mutate: deleteSink, isLoading: isCreating } = useDeleteSinkMutation({
    onSuccess: (res) => {
      toast.success('Successfully deleted sink')
      onClose()
    },
  })
  const onConfirm = () => {
    deleteSink({
      projectRef: ref!,
      sinkId,
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
          Are you sure you want to delete the selected sink? This action cannot be undone.
        </p>
      </div>
    </ConfirmationModal>
  )
}
