import { FC, useState } from 'react'
import { Modal, Button } from 'ui'

import { useStore, useParams } from 'hooks'
import { useNetworkRestrictionsApplyMutation } from 'data/network-restrictions/network-retrictions-apply-mutation'
import InformationBox from 'components/ui/InformationBox'

interface Props {
  visible: boolean
  onClose: () => void
}

const DisallowAllModal: FC<Props> = ({ visible, onClose }) => {
  const { ui } = useStore()
  const { ref } = useParams()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { mutateAsync: applyNetworkRestrictions } = useNetworkRestrictionsApplyMutation()

  const onSubmit = async () => {
    if (!ref) return console.error('Project ref is required')

    setIsSubmitting(true)
    try {
      await applyNetworkRestrictions({ projectRef: ref, dbAllowedCidrs: ['127.0.0.1/32'] })
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
      size="medium"
      visible={visible}
      onCancel={onClose}
      header="Restrict access from all IP addresses"
    >
      <Modal.Content>
        <div className="py-6 space-y-4">
          <p className="text-sm text-scale-1100">
            This will prevent any external IP addresses from accessing your project's database. Are
            you sure?
          </p>
          <InformationBox
            defaultVisibility
            hideCollapse
            title="Note: Restrictions only apply to your database and PgBouncer"
            description="They do not currently apply to APIs offered over HTTPS, such as PostgREST, Storage, or Authentication"
          />
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

export default DisallowAllModal
