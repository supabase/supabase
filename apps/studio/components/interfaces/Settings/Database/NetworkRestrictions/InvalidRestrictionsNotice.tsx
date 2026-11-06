import { useState } from 'react'
import { toast } from 'sonner'
import { Admonition } from 'ui-patterns/Admonition'

import { CorrectRestrictionsModal } from './CorrectRestrictionsModal'
import { useApplyCorrectedRestrictions } from './useApplyCorrectedRestrictions'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'

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
  const { corrected, hasCorrectedEntries, applyCorrected, isApplyingCorrected } =
    useApplyCorrectedRestrictions({
      projectRef,
      ipv4,
      ipv6,
      onSuccess: () => {
        setIsConfirming(false)
        toast.success('Network restrictions fixed')
      },
    })

  // Saving an empty list would block all access, which isn't a correction
  const getFixDisabledReason = () => {
    if (disabledReason !== undefined) return disabledReason
    if (!hasCorrectedEntries) {
      return 'None of the entries can be corrected. Remove them or allow all access instead.'
    }
    return undefined
  }
  const fixDisabledReason = getFixDisabledReason()

  return (
    <>
      <Admonition
        type="warning"
        layout="responsive"
        title="Some restrictions aren't valid IP ranges"
        description="Adding or removing restrictions fails until these entries are fixed."
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
        loading={isApplyingCorrected}
        onConfirm={applyCorrected}
        onCancel={() => setIsConfirming(false)}
      />
    </>
  )
}
