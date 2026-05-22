import { useParams } from 'common/hooks'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'

import { useNetworkRestrictionsApplyMutation } from '@/data/network-restrictions/network-retrictions-apply-mutation'

interface AllowAllModalProps {
  visible: boolean
  onClose: () => void
}

const AllowAllModal = ({ visible, onClose }: AllowAllModalProps) => {
  const { ref } = useParams()
  const { mutate: applyNetworkRestrictions, isPending: isApplying } =
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
    <ConfirmationModal
      size="small"
      visible={visible}
      onCancel={onClose}
      onConfirm={onSubmit}
      loading={isApplying}
      title="Allow access from all IP addresses"
      confirmLabel="Confirm"
    >
      <p className="text-sm text-foreground-light">
        This will allow any IP address to access your project's database. Are you sure?
      </p>
    </ConfirmationModal>
  )
}

export default AllowAllModal
