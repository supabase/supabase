import { useState } from 'react'
import { toast } from 'sonner'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import type { OAuthApp } from 'pages/project/[ref]/auth/oauth-apps'

interface DeleteOAuthAppModalProps {
  visible: boolean
  selectedApp?: OAuthApp
  onClose: () => void
  onSuccess: () => void
}

const DeleteOAuthAppModal = ({
  visible,
  selectedApp,
  onClose,
  onSuccess,
}: DeleteOAuthAppModalProps) => {
  const [isDeleting, setIsDeleting] = useState(false)

  const onConfirmDeleteApp = async () => {
    if (!selectedApp) return console.error('No OAuth app selected')

    setIsDeleting(true)

    try {
      // Remove from localStorage
      const existingApps = JSON.parse(localStorage.getItem('oauth_apps') || '[]')
      const updatedApps = existingApps.filter((app: OAuthApp) => app.id !== selectedApp.id)
      localStorage.setItem('oauth_apps', JSON.stringify(updatedApps))

      toast.success(`Successfully deleted OAuth app "${selectedApp.name}"`)
      onSuccess()
      onClose()
    } catch (error) {
      toast.error('Failed to delete OAuth app')
      console.error('Error deleting OAuth app:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <ConfirmationModal
      variant={'destructive'}
      size="medium"
      loading={isDeleting}
      visible={visible}
      title={
        <>
          Confirm to delete OAuth app <code className="text-sm">{selectedApp?.name}</code>
        </>
      }
      confirmLabel="Confirm delete"
      confirmLabelLoading="Deleting..."
      onCancel={onClose}
      onConfirm={() => onConfirmDeleteApp()}
      alert={{
        title: 'This action cannot be undone',
        description: 'You will need to re-create the OAuth app if you want to revert the deletion.',
      }}
    >
      <p className="text-sm">Before deleting this OAuth app, consider:</p>
      <ul className="space-y-2 mt-2 text-sm text-foreground-light">
        <li className="list-disc ml-6">Any applications using this OAuth app will lose access</li>
        <li className="list-disc ml-6">This OAuth app is no longer in use by any applications</li>
      </ul>
    </ConfirmationModal>
  )
}

export default DeleteOAuthAppModal
