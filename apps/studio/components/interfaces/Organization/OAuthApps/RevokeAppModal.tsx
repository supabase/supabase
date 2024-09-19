import { useParams } from 'common'
import { Lock } from 'lucide-react'
import { toast } from 'sonner'
import { Alert, Modal } from 'ui'

import { useAuthorizedAppRevokeMutation } from 'data/oauth/authorized-app-revoke-mutation'
import type { AuthorizedApp } from 'data/oauth/authorized-apps-query'

export interface RevokeAppModalProps {
  selectedApp?: AuthorizedApp
  onClose: () => void
}

const RevokeAppModal = ({ selectedApp, onClose }: RevokeAppModalProps) => {
  const { slug } = useParams()
  const { mutate: revokeAuthorizedApp, isLoading: isDeleting } = useAuthorizedAppRevokeMutation({
    onSuccess: () => {
      toast.success(`Successfully revoked the app "${selectedApp?.name}"`)
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
        <Alert withIcon variant="warning" title="This action cannot be undone">
          {selectedApp?.name} application will no longer have access to your organization's settings
          and projects.
        </Alert>
      </Modal.Content>
      <Modal.Content>
        <ul className="space-y-5">
          <li className="flex gap-3 text-sm">
            <Lock size={14} className="flex-shrink-0" />
            <div>
              <strong>Before you remove this app, consider:</strong>
              <ul className="space-y-2 mt-2">
                <li className="list-disc ml-4">
                  No users are currently using this application. The application will no longer have
                  access to your organization after being revoked.
                </li>
              </ul>
            </div>
          </li>
        </ul>
      </Modal.Content>
    </Modal>
  )
}

export default RevokeAppModal
