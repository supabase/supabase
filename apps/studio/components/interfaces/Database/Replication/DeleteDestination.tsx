import { TextConfirmModal } from '@/components/ui/TextConfirmModalWrapper'

interface DeleteDestinationProps {
  visible: boolean
  isLoading: boolean
  name: string
  setVisible: (value: boolean) => void
  onDelete: () => void
}

export const DeleteDestination = ({
  visible,
  isLoading,
  name,
  setVisible,
  onDelete,
}: DeleteDestinationProps) => {
  return (
    <TextConfirmModal
      variant="destructive"
      visible={visible}
      loading={isLoading}
      title="Delete this pipeline"
      confirmLabel={isLoading ? 'Deleting...' : `Delete pipeline`}
      confirmPlaceholder="Type in name of pipeline"
      confirmString={name ?? 'Unknown'}
      text={`This will delete the pipeline "${name}" and stop replication. Already replicated data stays at the destination, and pipeline-hour billing ends when deletion completes.`}
      alert={{ title: 'You cannot recover this pipeline after deletion.' }}
      onCancel={() => setVisible(!visible)}
      onConfirm={onDelete}
    />
  )
}
