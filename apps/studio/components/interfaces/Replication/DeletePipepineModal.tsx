import { useParams } from 'common'
import { useDeletePipelineMutation } from 'data/replication/delete-pipeline-mutation'
import { toast } from 'sonner'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'

export type DeletePipelineModalProps = {
  visible: boolean
  title: string
  pipelineId: number
  onClose: () => void
}

export const DeletePipelineModal = ({
  visible,
  title,
  pipelineId,
  onClose,
}: DeletePipelineModalProps) => {
  const { ref } = useParams()
  const { mutate: deletePipeline, isLoading: isCreating } = useDeletePipelineMutation({
    onSuccess: (res) => {
      toast.success('Successfully deleted pipeline')
      onClose()
    },
  })
  const onConfirm = () => {
    deletePipeline({
      projectRef: ref!,
      pipelineId,
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
          Are you sure you want to delete the selected pipeline? This action cannot be undone.
        </p>
      </div>
    </ConfirmationModal>
  )
}
