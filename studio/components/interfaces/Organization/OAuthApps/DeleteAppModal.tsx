import { useParams } from 'common'
import { useOAuthAppDeleteMutation } from 'data/oauth/oauth-app-delete-mutation'
import { OAuthApp } from 'data/oauth/oauth-apps-query'
import { useStore } from 'hooks'
import { useEffect, useState } from 'react'
import { Alert, Modal } from 'ui'

export interface DeleteAppModalProps {
  selectedApp?: OAuthApp
  onClose: () => void
}

const DeleteAppModal = ({ selectedApp, onClose }: DeleteAppModalProps) => {
  const { ui } = useStore()
  const { slug } = useParams()
  const [isDeleting, setIsDeleting] = useState(false)
  const { mutateAsync: deleteOAuthApp } = useOAuthAppDeleteMutation()

  useEffect(() => {
    if (selectedApp) setIsDeleting(false)
  }, [selectedApp])

  const onConfirmDelete = async () => {
    if (!slug) return console.error('Slug is required')
    if (!selectedApp?.id) return console.error('App ID is required')

    try {
      setIsDeleting(true)
      await deleteOAuthApp({ slug, id: selectedApp?.id })
      ui.setNotification({
        category: 'success',
        message: `Successfully deleted the app "${selectedApp?.name}"`,
      })
      onClose()
    } catch (error) {
      ui.setNotification({
        category: 'error',
        message: `Failed to delete OAuth app: ${(error as any).message}`,
      })
      setIsDeleting(false)
    }
  }

  return (
    <Modal
      size="medium"
      alignFooter="right"
      header={`Confirm to delete ${selectedApp?.name}`}
      visible={selectedApp !== undefined}
      loading={isDeleting}
      onCancel={onClose}
      onConfirm={onConfirmDelete}
    >
      <Modal.Content>
        <div className="py-4">
          <Alert withIcon variant="warning" title="This action cannot be undone">
            Any applications which have been authorized through this app will no longer have access
            to your organization's settings and projects.
          </Alert>
        </div>
      </Modal.Content>
    </Modal>
  )
}

export default DeleteAppModal
