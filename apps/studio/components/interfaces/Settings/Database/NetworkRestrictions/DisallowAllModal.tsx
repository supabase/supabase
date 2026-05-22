import { useParams } from 'common'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'

import InformationBox from '@/components/ui/InformationBox'
import { useNetworkRestrictionsApplyMutation } from '@/data/network-restrictions/network-retrictions-apply-mutation'

interface DisallowAllModalProps {
  visible: boolean
  onClose: () => void
}

const DisallowAllModal = ({ visible, onClose }: DisallowAllModalProps) => {
  const { ref } = useParams()
  const { mutate: applyNetworkRestrictions, isPending: isApplying } =
    useNetworkRestrictionsApplyMutation({ onSuccess: () => onClose() })

  const onSubmit = async () => {
    if (!ref) return console.error('Project ref is required')
    await applyNetworkRestrictions({
      projectRef: ref,
      dbAllowedCidrs: [],
      dbAllowedCidrsV6: [],
    })
  }

  return (
    <ConfirmationModal
      size="medium"
      visible={visible}
      onCancel={onClose}
      onConfirm={onSubmit}
      loading={isApplying}
      title="Restrict access from all IP addresses"
      confirmLabel="Confirm"
    >
      <div className="space-y-4">
        <p className="text-sm text-foreground-light">
          This will prevent any external IP addresses from accessing your project's database. Are
          you sure?
        </p>
        <InformationBox
          defaultVisibility
          hideCollapse
          title="Note: Restrictions only apply to direct connections to your database and connection pooler"
          description="They do not currently apply to APIs offered over HTTPS, such as PostgREST, Storage, or Authentication."
        />
      </div>
    </ConfirmationModal>
  )
}

export default DisallowAllModal
