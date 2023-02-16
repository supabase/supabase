import { FC, useState } from 'react'
import { Modal, Button } from 'ui'

import { useStore, useParams } from 'hooks'
import { useNetworkRestrictionsApplyMutation } from 'data/network-restrictions/network-retrictions-apply-mutation'

interface Props {
  visible: boolean
  onClose: () => void
}

const AllowAllModal: FC<Props> = ({ visible, onClose }) => {
  const { ui } = useStore()
  const { ref } = useParams()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { mutateAsync: applyNetworkRestrictions } = useNetworkRestrictionsApplyMutation()

  const onSubmit = async () => {
    if (!ref) return console.error('Project ref is required')

    setIsSubmitting(true)
    try {
      await applyNetworkRestrictions({ projectRef: ref, dbAllowedCidrs: ['0.0.0.0/0'] })
      onClose()
    } catch (error: any) {
      ui.setNotification({
        category: 'error',
        message: `Failed to update restriction: ${error.message}`,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal
      closable
      hideFooter
      size="small"
      visible={visible}
      onCancel={onClose}
      header="Allow access from all IP addresses"
    >
      <Modal.Content>
        <div className="py-6 space-y-4">
          <p className="text-sm text-scale-1100">
            This will allow any IP address to access your project's database. Are you sure?
          </p>
        </div>
      </Modal.Content>
      <div className="flex items-center justify-end px-6 py-4 border-t space-x-2">
        <Button type="default" disabled={isSubmitting} onClick={() => onClose()}>
          Cancel
        </Button>
        <Button loading={isSubmitting} disabled={isSubmitting} onClick={() => onSubmit()}>
          Confirm
        </Button>
      </div>
    </Modal>
  )
}

export default AllowAllModal
