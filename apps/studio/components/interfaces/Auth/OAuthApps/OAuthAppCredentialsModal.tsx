import { Button, Modal, Input } from 'ui'
import { Admonition } from 'ui-patterns'

interface OAuthAppCredentialsModalProps {
  visible: boolean
  onClose: () => void
  clientId?: string
  clientSecret?: string
}

const OAuthAppCredentialsModal = ({
  visible,
  onClose,
  clientId,
  clientSecret,
}: OAuthAppCredentialsModalProps) => {
  return (
    <Modal
      hideFooter
      size="medium"
      visible={visible}
      onCancel={onClose}
      header="OAuth App Credentials"
    >
      <Modal.Content className="space-y-6">
        <div className="space-y-4">
          <Admonition type="warning" title="Save your credentials">
            Please copy and save your client secret in a secure location. For security purposes, you
            won't be able to view it again after closing this modal.
          </Admonition>

          <div className="space-y-4">
            <Input
              label="Client ID"
              readOnly
              copy
              className="input-mono"
              value={clientId}
              layout="vertical"
            />
            <Input
              label="Client Secret"
              readOnly
              copy
              className="input-mono"
              value={clientSecret}
              layout="vertical"
            />
          </div>
        </div>
      </Modal.Content>
      <Modal.Separator />
      <Modal.Content className="flex items-center justify-end space-x-2">
        <Button type="default" onClick={onClose}>
          Close
        </Button>
      </Modal.Content>
    </Modal>
  )
}

export default OAuthAppCredentialsModal
