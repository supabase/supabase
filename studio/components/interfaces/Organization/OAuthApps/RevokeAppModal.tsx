import { useParams } from 'common'
import { useAuthorizedAppRevokeMutation } from 'data/oauth/authorized-app-revoke-mutation'
import { AuthorizedApp } from 'data/oauth/authorized-apps-query'
import { useStore } from 'hooks'
import { Alert, IconAlertOctagon, IconLock, Modal } from 'ui'

export interface RevokeAppModalProps {
  selectedApp?: AuthorizedApp
  onClose: () => void
}

const RevokeAppModal = ({ selectedApp, onClose }: RevokeAppModalProps) => {
  const { ui } = useStore()
  const { slug } = useParams()
  const { mutate: revokeAuthorizedApp, isLoading: isDeleting } = useAuthorizedAppRevokeMutation({
    onSuccess: () => {
      ui.setNotification({
        category: 'success',
        message: `Successfully revoked the app "${selectedApp?.name}"`,
      })
      onClose()
    },
  })

  const onConfirmDelete = async () => {
    if (!slug) return console.error('Slug is required')
    if (!selectedApp?.id) return console.error('App ID is required')
    revokeAuthorizedApp({ slug, id: selectedApp?.id })
  }

  return (
    <Modal
      size="medium"
      alignFooter="right"
      header={`Confirm to revoke ${selectedApp?.name}`}
      visible={selectedApp !== undefined}
      loading={isDeleting}
      onCancel={onClose}
      onConfirm={onConfirmDelete}
    >
      <Modal.Content>
        <div className="py-4">
          <Alert withIcon variant="warning" title="This action cannot be undone">
            {selectedApp?.name} application will no longer have access to your organization's
            settings and projects.
          </Alert>
          <ul className="mt-4 space-y-5">
            <li className="flex gap-3 text-sm">
              <IconLock w={14} className="flex-shrink-0" />
              <div>
                <strong>Before you remove this app, consider:</strong>
                <ul className="space-y-2 mt-2">
                  <li className="list-disc ml-4">
                    No users are currently using this application. The application will no longer
                    have access to your organization after being revoked.
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

export default RevokeAppModal
