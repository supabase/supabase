import { useParams } from 'common'
import { useOAuthAppDeleteMutation } from 'data/oauth/oauth-app-delete-mutation'
import { OAuthApp } from 'data/oauth/oauth-apps-query'
import { useStore } from 'hooks'
import { Alert, IconLock, Modal } from 'ui'

export interface DeleteAppModalProps {
  selectedApp?: OAuthApp
  onClose: () => void
}

const DeleteAppModal = ({ selectedApp, onClose }: DeleteAppModalProps) => {
  const { ui } = useStore()
  const { slug } = useParams()
  const { mutate: deleteOAuthApp, isLoading: isDeleting } = useOAuthAppDeleteMutation({
    onSuccess: () => {
      ui.setNotification({
        category: 'success',
        message: `Successfully deleted the app "${selectedApp?.name}"`,
      })
      onClose()
    },
  })

  const onConfirmDelete = async () => {
    if (!slug) return console.error('Slug is required')
    if (!selectedApp?.id) return console.error('App ID is required')
    deleteOAuthApp({ slug, id: selectedApp?.id })
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
            Deleting {selectedApp?.name} will invalidate any access tokens from this application
            that were authorized by users.
          </Alert>
          <ul className="mt-4 space-y-5">
            <li className="flex gap-3 text-sm">
              <IconLock w={14} className="flex-shrink-0" />
              <div>
                <strong>Before you remove this application, consider:</strong>
                <ul className="space-y-2 mt-2">
                  <li className="list-disc ml-4">
                    No users are currently using this application. It will no longer be available
                    for use after deletion.
                  </li>
                </ul>
              </div>
            </li>
          </ul>
        </div>
      </Modal.Content>
    </Modal>
  )
}

export default DeleteAppModal
