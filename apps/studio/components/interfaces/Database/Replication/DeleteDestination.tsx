import TextConfirmModal from 'ui-patterns/Dialogs/TextConfirmModal'

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
      title="Delete this destination"
      confirmLabel={isLoading ? 'Deleting...' : `Delete destination`}
      confirmPlaceholder="Type in name of destination"
      confirmString={name ?? 'Unknown'}
      text={`This will delete the destination "${name}"`}
      alert={{ title: 'You cannot recover this destination once deleted.' }}
      onCancel={() => setVisible(!visible)}
      onConfirm={onDelete}
    />
  )
}
