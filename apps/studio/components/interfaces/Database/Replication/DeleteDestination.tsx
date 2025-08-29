import TextConfirmModal from 'ui-patterns/Dialogs/TextConfirmModal'

interface DeleteDestinationProps {
  visible: boolean
  setVisible: (value: boolean) => void
  onDelete: () => void
  isLoading: boolean
  name: string
}

export const DeleteDestination = ({
  visible,
  setVisible,
  onDelete,
  isLoading,
  name,
}: DeleteDestinationProps) => {
  return (
    <>
      <TextConfirmModal
        variant="destructive"
        visible={visible}
        onCancel={() => setVisible(!visible)}
        onConfirm={onDelete}
        title={isLoading ? 'Deleting destination' : 'Delete this destination'}
        loading={isLoading}
        confirmLabel={isLoading ? 'Deleting…' : `Delete destination`}
        confirmPlaceholder="Type in name of destination"
        confirmString={name ?? 'Unknown'}
        text={
          <>
            {isLoading ? (
              <span>
                Deletion started. This may take a few seconds as the pipeline is stopped and
                removed.
              </span>
            ) : (
              <span>This will delete the destination</span>
            )}{' '}
          </>
        }
        alert={{ title: 'You cannot recover this destination once deleted.' }}
      />
    </>
  )
}
