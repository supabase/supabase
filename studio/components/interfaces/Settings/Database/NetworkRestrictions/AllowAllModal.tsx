import { Button, Modal } from 'ui'

import { useParams } from 'common/hooks'
import { useNetworkRestrictionsApplyMutation } from 'data/network-restrictions/network-retrictions-apply-mutation'

interface AllowAllModalProps {
  visible: boolean
  onClose: () => void
}

const AllowAllModal = ({ visible, onClose }: AllowAllModalProps) => {
  const { ref } = useParams()
  const { mutate: applyNetworkRestrictions, isLoading: isApplying } =
    useNetworkRestrictionsApplyMutation({
      onSuccess: () => onClose(),
    })

  const onSubmit = async () => {
    if (!ref) return console.error('Project ref is required')
    applyNetworkRestrictions({ projectRef: ref, dbAllowedCidrs: ['0.0.0.0/0'] })
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
          <p className="text-sm text-foreground-light">
            This will allow any IP address to access your project's database. Are you sure?
          </p>
        </div>
      </Modal.Content>
      <div className="flex items-center justify-end px-6 py-4 border-t space-x-2">
        <Button type="default" disabled={isApplying} onClick={() => onClose()}>
          Cancel
        </Button>
        <Button loading={isApplying} disabled={isApplying} onClick={() => onSubmit()}>
          Confirm
        </Button>
      </div>
    </Modal>
  )
}

export default AllowAllModal
