import { Button, Modal } from 'ui'

import { useParams } from 'common/hooks'
import InformationBox from 'components/ui/InformationBox'
import { useNetworkRestrictionsApplyMutation } from 'data/network-restrictions/network-retrictions-apply-mutation'

interface DisallowAllModalProps {
  visible: boolean
  onClose: () => void
}

const DisallowAllModal = ({ visible, onClose }: DisallowAllModalProps) => {
  const { ref } = useParams()
  const { mutate: applyNetworkRestrictions, isLoading: isApplying } =
    useNetworkRestrictionsApplyMutation({ onSuccess: () => onClose() })

  const onSubmit = async () => {
    if (!ref) return console.error('Project ref is required')
    await applyNetworkRestrictions({ projectRef: ref, dbAllowedCidrs: ['127.0.0.1/32'] })
  }

  return (
    <Modal
      closable
      hideFooter
      size="medium"
      visible={visible}
      onCancel={onClose}
      header="Restrict access from all IP addresses"
    >
      <Modal.Content>
        <div className="py-6 space-y-4">
          <p className="text-sm text-foreground-light">
            This will prevent any external IP addresses from accessing your project's database. Are
            you sure?
          </p>
          <InformationBox
            defaultVisibility
            hideCollapse
            title="Note: Restrictions only apply to direct connections to your database and PgBouncer"
            description="They do not currently apply to Supavisor and to APIs offered over HTTPS, such as PostgREST, Storage, or Authentication"
          />
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

export default DisallowAllModal
