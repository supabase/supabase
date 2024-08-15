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
    applyNetworkRestrictions({
      projectRef: ref,
      dbAllowedCidrs: ['0.0.0.0/0'],
      dbAllowedCidrsV6: ['::/0'],
    })
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
      <Modal.Content className="space-y-4">
        <p className="text-sm text-foreground-light">
          This will allow any IP address to access your project's database. Are you sure?
        </p>
      </Modal.Content>
      <Modal.Separator />
      <Modal.Content className="flex items-center justify-end space-x-2">
        <Button type="default" disabled={isApplying} onClick={() => onClose()}>
          Cancel
        </Button>
        <Button loading={isApplying} disabled={isApplying} onClick={() => onSubmit()}>
          Confirm
        </Button>
      </Modal.Content>
    </Modal>
  )
}

export default AllowAllModal
