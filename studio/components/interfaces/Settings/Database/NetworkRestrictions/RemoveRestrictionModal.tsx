import { FC, useState } from 'react'
import { Alert, Button, Form, Input, Modal } from 'ui'

import { useStore, useParams } from 'hooks'
import { useNetworkRestrictionsApplyMutation } from 'data/network-restrictions/network-retrictions-apply-mutation'

interface Props {
  visible: boolean
  restrictedIps: string[]
  selectedRestriction?: string
  onClose: () => void
}

const RemoveRestrictionModal: FC<Props> = ({
  visible,
  restrictedIps,
  selectedRestriction,
  onClose,
}) => {
  const { ui } = useStore()
  const { ref } = useParams()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { mutateAsync: applyNetworkRestrictions } = useNetworkRestrictionsApplyMutation()

  const isRemovingOnlyRestriction =
    restrictedIps.length === 1 && restrictedIps[0] === selectedRestriction

  const onSubmit = async () => {
    if (!ref) return console.error('Project ref is required')

    setIsSubmitting(true)
    const dbAllowedCidrs = restrictedIps.filter((ip) => ip !== selectedRestriction)

    try {
      if (dbAllowedCidrs.length === 0) {
        await applyNetworkRestrictions({ projectRef: ref, dbAllowedCidrs: ['0.0.0.0/0'] })
      } else {
        await applyNetworkRestrictions({ projectRef: ref, dbAllowedCidrs })
      }
      onClose()
    } catch (error: any) {
      ui.setNotification({
        category: 'error',
        message: `Failed to remove restriction: ${error.message}`,
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
      header="Confirm to remove restriction"
    >
      <Modal.Content>
        <div className="py-6 space-y-4">
          <p className="text-sm text-scale-1100">
            The IPv4 address <code className="text-xs">{selectedRestriction}</code> will be removed
            from your list of network restrictions
            {isRemovingOnlyRestriction
              ? '.'
              : ", and no longer have access to your project's database."}
          </p>
          {isRemovingOnlyRestriction && (
            <Alert withIcon variant="warning" title="Database access will no longer be restricted">
              Removing all network restrictions will default to your database being accessible from
              all IP addresses.
            </Alert>
          )}
        </div>
      </Modal.Content>
      <div className="flex items-center justify-end px-6 py-4 border-t space-x-2">
        <Button type="default" disabled={isSubmitting} onClick={() => onClose()}>
          Cancel
        </Button>
        <Button loading={isSubmitting} disabled={isSubmitting} onClick={() => onSubmit()}>
          Remove restriction
        </Button>
      </div>
    </Modal>
  )
}

export default RemoveRestrictionModal
