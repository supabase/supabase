import { useState } from 'react'
import { toast } from 'sonner'
import { Admonition } from 'ui-patterns/Admonition'

import { CorrectRestrictionsModal } from './CorrectRestrictionsModal'
import { getCorrectedRestrictions } from './NetworkRestrictions.utils'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { useNetworkRestrictionsApplyMutation } from '@/data/network-restrictions/network-retrictions-apply-mutation'

interface InvalidRestrictionsNoticeProps {
  projectRef: string
  ipv4: string[]
  ipv6: string[]
  disabledReason?: string
}

export const InvalidRestrictionsNotice = ({
  projectRef,
  ipv4,
  ipv6,
  disabledReason,
}: InvalidRestrictionsNoticeProps) => {
  const [isConfirming, setIsConfirming] = useState(false)
  const { mutate: applyNetworkRestrictions, isPending: isApplying } =
    useNetworkRestrictionsApplyMutation()

  const corrected = getCorrectedRestrictions({ ipv4, ipv6 })
  const hasCorrectedEntries =
    corrected.dbAllowedCidrs.length > 0 || corrected.dbAllowedCidrsV6.length > 0

  // Saving an empty list would block all access, which isn't a correction
  const getFixDisabledReason = () => {
    if (disabledReason !== undefined) return disabledReason
    if (!hasCorrectedEntries) {
      return 'None of the entries can be corrected. Remove them or allow all access instead.'
    }
    return undefined
  }
  const fixDisabledReason = getFixDisabledReason()

  const handleFix = () =>
    applyNetworkRestrictions(
      {
        projectRef,
        dbAllowedCidrs: corrected.dbAllowedCidrs,
        dbAllowedCidrsV6: corrected.dbAllowedCidrsV6,
      },
      {
        onSuccess: () => {
          setIsConfirming(false)
          toast.success('Network restrictions fixed')
        },
      }
    )

  return (
    <>
      <Admonition
        type="warning"
        layout="responsive"
        title="Some restrictions aren't valid IP ranges"
        description="Adding or removing restrictions fails until these entries are fixed. Hover over an entry marked Invalid to see why."
        actions={
          <ButtonTooltip
            variant="default"
            disabled={fixDisabledReason !== undefined}
            onClick={() => setIsConfirming(true)}
            tooltip={{ content: { side: 'bottom', text: fixDisabledReason } }}
          >
            Fix entries
          </ButtonTooltip>
        }
      />
      <CorrectRestrictionsModal
        visible={isConfirming}
        title="Fix invalid entries"
        confirmLabel="Fix entries"
        corrections={corrected.corrections}
        loading={isApplying}
        onConfirm={handleFix}
        onCancel={() => setIsConfirming(false)}
      />
    </>
  )
}
