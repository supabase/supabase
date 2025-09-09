import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'

interface UpdateVersionModalProps {
  visible: boolean
  currentVersionName?: string
  newVersionName?: string
  confirmLabel?: string
  confirmLabelLoading?: string
  onCancel: () => void
  onConfirm: () => Promise<void>
}

export const UpdateVersionModal = ({
  visible,
  currentVersionName,
  newVersionName,
  confirmLabel = 'Update and restart',
  confirmLabelLoading = 'Updating',
  onCancel,
  onConfirm,
}: UpdateVersionModalProps) => {
  return (
    <ConfirmationModal
      size="medium"
      visible={visible}
      title="Update pipeline version"
      confirmLabel={confirmLabel}
      confirmLabelLoading={confirmLabelLoading}
      onCancel={onCancel}
      onConfirm={onConfirm}
      alert={{
        base: { variant: 'warning' },
        title: 'Pipeline will be restarted briefly to complete the change',
        description: (
          <div className="flex flex-col gap-y-1">
            <p className="!leading-normal">
              During the update process, the replication pauses and resumes.
            </p>
            <p className="!leading-normal">
              If a long‑running transaction is in progress, some records may be reprocessed due to
              PostgreSQL logical replication limitations.
            </p>
          </div>
        ),
      }}
    >
      <p className="text-sm text-foreground prose max-w-full mb-1">
        Pipeline will be updated from <code>{currentVersionName ?? 'Current version'}</code> to{' '}
        <code>{newVersionName ?? 'New version'}</code>.
      </p>
      <p className="text-sm">Confirm to update pipeline? This action cannot be undone.</p>
    </ConfirmationModal>
  )
}
