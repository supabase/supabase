import { useParams } from 'common'
import { useOAuthAppDeleteMutation } from 'data/oauth/oauth-app-delete-mutation'
import { OAuthApp } from 'data/oauth/oauth-apps-query'
import { useStore } from 'hooks'
import { Alert, IconAlertOctagon, IconLock, IconShieldOff, Modal } from 'ui'

export interface DeleteAppModalProps {
  selectedApp?: OAuthApp
  onClose: () => void
}

const DeleteAppModal = ({ selectedApp, onClose }: DeleteAppModalProps) => {
  const { ui } = useStore()
  const { slug } = useParams()
  const { mutateAsync: deleteOAuthApp, isLoading: isDeleting } = useOAuthAppDeleteMutation()

  const onConfirmDelete = async () => {
    if (!slug) return console.error('Slug is required')
    if (!selectedApp?.id) return console.error('App ID is required')

    try {
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
            You will no longer have access to any applications that were authorized through this app
          </Alert>
          <ul className="mt-4 space-y-5">
            <li className="flex gap-3 text-sm">
              <div>
                <IconAlertOctagon />
              </div>
              <span>
                You will no longer have access to any applications that were authorized through this
                app
              </span>
            </li>

            <li className="flex gap-3 text-sm">
              <IconLock w={14} className="flex-shrink-0" />
              <div>
                <strong>Before you remove this app, consider:</strong>
                <ul className="space-y-2 mt-2">
                  <li className="list-disc ml-4">
                    Any authorized apps that were granted access to your organization
                  </li>
                  <li className="list-disc ml-4">
                    Anyone will be able to modify, add or delete any row in this table.
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
