import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'

import { PrivateApp } from '../PrivateAppsContext'

interface DeleteAppModalProps {
  app: PrivateApp | null
  visible: boolean
  isLoading?: boolean
  onClose: () => void
  onConfirm: () => void
}

export function DeleteAppModal({
  app,
  visible,
  isLoading,
  onClose,
  onConfirm,
}: DeleteAppModalProps) {
  return (
    <ConfirmationModal
      variant="destructive"
      visible={visible}
      title={`Delete "${app?.name}"`}
      confirmLabel="Delete app"
      confirmLabelLoading="Deleting..."
      loading={isLoading}
      onCancel={onClose}
      onConfirm={onConfirm}
      alert={{
        title: 'This action cannot be undone',
        description:
          'Deleting this app will invalidate any tokens generated using its private key. All installations will also be removed.',
      }}
    >
      <p className="text-sm text-foreground-light">
        Are you sure you want to delete <strong>{app?.name}</strong>? This will also remove all
        installations associated with this app.
      </p>
    </ConfirmationModal>
  )
}
