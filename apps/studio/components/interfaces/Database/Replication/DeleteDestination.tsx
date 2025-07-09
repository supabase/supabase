import TextConfirmModal from 'ui-patterns/Dialogs/TextConfirmModal'

interface DeleteDestinationProps {
  visible: boolean
  setVisible: (value: boolean) => void
  onDelete: () => void
  isLoading: boolean
  name: string
}

const DeleteDestination = ({
  visible,
  setVisible,
  onDelete,
  isLoading,
  name,
}: DeleteDestinationProps) => {
  return (
    <>
      <TextConfirmModal
        variant={'warning'}
        visible={visible}
        onCancel={() => setVisible(!visible)}
        onConfirm={onDelete}
        title="Delete this destination"
        loading={isLoading}
        confirmLabel={`Delete destination`}
        confirmPlaceholder="Type in name of destination"
        confirmString={name ?? 'Unknown'}
        text={
          <>
            <span>This will delete the destination</span>{' '}
          </>
        }
        alert={{ title: 'You cannot recover this destination once deleted.' }}
      />
    </>
  )
}

export default DeleteDestination
