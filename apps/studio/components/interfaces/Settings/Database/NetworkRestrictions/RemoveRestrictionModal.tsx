import { useParams } from 'common'
import { Alert, Button, Modal } from 'ui'

import { useNetworkRestrictionsApplyMutation } from 'data/network-restrictions/network-retrictions-apply-mutation'
import { useStore } from 'hooks'
import { useNetworkRestrictionsQuery } from 'data/network-restrictions/network-restrictions-query'

interface RemoveRestrictionModalProps {
  visible: boolean
  selectedRestriction?: string
  onClose: () => void
}

const RemoveRestrictionModal = ({
  visible,
  selectedRestriction,
  onClose,
}: RemoveRestrictionModalProps) => {
  const { ui } = useStore()
  const { ref } = useParams()

  const { data } = useNetworkRestrictionsQuery({ projectRef: ref })
  const ipv4Restrictions = data?.config?.dbAllowedCidrs ?? []
  // @ts-ignore [Joshen] API typing issue
  const ipv6Restrictions: string[] = data?.config?.dbAllowedCidrsV6 ?? []
  const restrictedIps = ipv4Restrictions.concat(ipv6Restrictions)

  const { mutate: applyNetworkRestrictions, isLoading: isApplying } =
    useNetworkRestrictionsApplyMutation({
      onSuccess: () => onClose(),
      onError: (error) => {
        ui.setNotification({
          category: 'error',
          message: `Failed to remove restriction: ${error.message}`,
        })
      },
    })

  const isRemovingOnlyRestriction =
    restrictedIps.length === 1 && restrictedIps[0] === selectedRestriction

  const onSubmit = async () => {
    if (!ref) return console.error('Project ref is required')
    if (!selectedRestriction) return console.error('Missing selected restriction')

    const dbAllowedCidrs = ipv4Restrictions.includes(selectedRestriction)
      ? ipv4Restrictions.filter((ip) => ip !== selectedRestriction)
      : ipv4Restrictions
    const dbAllowedCidrsV6 = ipv6Restrictions.includes(selectedRestriction)
      ? ipv6Restrictions.filter((ip) => ip !== selectedRestriction)
      : ipv6Restrictions

    if (dbAllowedCidrs.length === 0 && dbAllowedCidrsV6.length === 0) {
      applyNetworkRestrictions({
        projectRef: ref,
        dbAllowedCidrs: ['0.0.0.0/0'],
        dbAllowedCidrsV6: ['::/0'],
      })
    } else {
      applyNetworkRestrictions({ projectRef: ref, dbAllowedCidrs, dbAllowedCidrsV6 })
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
          <p className="text-sm text-foreground-light">
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
        <Button type="default" disabled={isApplying} onClick={() => onClose()}>
          Cancel
        </Button>
        <Button loading={isApplying} disabled={isApplying} onClick={() => onSubmit()}>
          Remove restriction
        </Button>
      </div>
    </Modal>
  )
}

export default RemoveRestrictionModal
