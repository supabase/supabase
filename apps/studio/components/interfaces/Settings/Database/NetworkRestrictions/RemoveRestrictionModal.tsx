import { useParams } from 'common'
import { toast } from 'sonner'
import { Admonition } from 'ui-patterns'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'

import { useNetworkRestrictionsQuery } from '@/data/network-restrictions/network-restrictions-query'
import { useNetworkRestrictionsApplyMutation } from '@/data/network-restrictions/network-retrictions-apply-mutation'

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
  const { ref } = useParams()

  const { data } = useNetworkRestrictionsQuery({ projectRef: ref }, { enabled: visible })
  const ipv4Restrictions = data?.config?.dbAllowedCidrs ?? []
  // @ts-ignore [Joshen] API typing issue
  const ipv6Restrictions: string[] = data?.config?.dbAllowedCidrsV6 ?? []
  const restrictedIps = ipv4Restrictions.concat(ipv6Restrictions)

  const { mutate: applyNetworkRestrictions, isPending: isApplying } =
    useNetworkRestrictionsApplyMutation({
      onSuccess: () => onClose(),
      onError: (error) => {
        toast.error(`Failed to remove restriction: ${error.message}`)
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
    <ConfirmationModal
      size="medium"
      visible={visible}
      onCancel={onClose}
      onConfirm={onSubmit}
      loading={isApplying}
      title="Confirm to remove restriction"
      confirmLabel="Remove restriction"
    >
      <div className="space-y-4">
        <p className="text-sm text-foreground-light">
          The IPv4 address <code className="text-code-inline">{selectedRestriction}</code> will be
          removed from your list of network restrictions
          {isRemovingOnlyRestriction
            ? '.'
            : ", and no longer have access to your project's database."}
        </p>
        {isRemovingOnlyRestriction && (
          <Admonition
            type="warning"
            title="Database access will no longer be restricted"
            description="Removing all network restrictions will default to your database being accessible from
            all IP addresses."
          />
        )}
      </div>
    </ConfirmationModal>
  )
}

export default RemoveRestrictionModal
