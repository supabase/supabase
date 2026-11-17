import dayjs from 'dayjs'
import { useState } from 'react'
import { toast } from 'sonner'
import { Card, CardContent } from 'ui'
import { Admonition } from 'ui-patterns/Admonition'
import { ConfirmationModal } from 'ui-patterns/Dialogs/ConfirmationModal'

import { CorrectRestrictionsModal } from './CorrectRestrictionsModal'
import { getRestrictionIssues, getRestrictionsDiff } from './NetworkRestrictions.utils'
import { RestrictionRow } from './RestrictionRow'
import { useApplyCorrectedRestrictions } from './useApplyCorrectedRestrictions'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { useNetworkRestrictionsReviewMutation } from '@/data/network-restrictions/network-restrictions-review-mutation'
import { useGrant } from '@/lib/grants'

type RestrictionLists = { ipv4: string[]; ipv6: string[] }

interface NetworkRestrictionsReviewProps {
  projectRef: string
  enforced: RestrictionLists
  pending: RestrictionLists
  requestedAt: string
  disabledReason?: string
}

const hasRestrictionIssue = (entries: string[]) =>
  getRestrictionIssues(entries).some((issue) => issue !== undefined)

export const NetworkRestrictionsReview = ({
  projectRef,
  enforced,
  pending,
  requestedAt,
  disabledReason,
}: NetworkRestrictionsReviewProps) => {
  const [isDiscarding, setIsDiscarding] = useState(false)
  const [isConfirmingCorrections, setIsConfirmingCorrections] = useState(false)

  const reviewGrant = useGrant('POST /v1/projects/{ref}/network-restrictions/review', {
    projectRef,
  })

  // Success is handled on the hooks rather than per call: the refetch that follows a successful change can unmount
  // this review first, and a per-call callback doesn't run once its component has unmounted
  const {
    mutate: reviewNetworkRestrictions,
    isPending: isReviewing,
    variables: reviewVariables,
  } = useNetworkRestrictionsReviewMutation({
    onSuccess: (_data, { action }) => {
      if (action === 'apply') {
        toast.success('Applying network restrictions change')
      } else {
        setIsDiscarding(false)
        toast.success('Network restrictions change discarded')
      }
    },
  })
  const { corrected, hasCorrectedEntries, applyCorrected, isApplyingCorrected } =
    useApplyCorrectedRestrictions({
      projectRef,
      ipv4: pending.ipv4,
      ipv6: pending.ipv6,
      onSuccess: () => {
        setIsConfirmingCorrections(false)
        toast.success('Network restrictions change applied')
      },
    })

  const rows = [
    ...getRestrictionsDiff(enforced.ipv4, pending.ipv4).map((row) => ({
      ...row,
      type: 'IPv4' as const,
    })),
    ...getRestrictionsDiff(enforced.ipv6, pending.ipv6).map((row) => ({
      ...row,
      type: 'IPv6' as const,
    })),
  ]

  const pendingEntries = [...pending.ipv4, ...pending.ipv6]

  // The review endpoint refuses a change when either list has an entry that isn't a valid range, so such a change is
  // saved as a new, corrected list instead, which also ends the review
  const hasIssues =
    hasRestrictionIssue([...enforced.ipv4, ...enforced.ipv6]) || hasRestrictionIssue(pendingEntries)
  const hasCorrections = corrected.corrections.length > 0
  const canApplyCorrected = hasCorrectedEntries || pendingEntries.length === 0

  const isAllowingAll = pendingEntries.includes('0.0.0.0/0') && pendingEntries.includes('::/0')
  const isBlockingAll = pendingEntries.length === 0
  const isApplying = isApplyingCorrected || (isReviewing && reviewVariables?.action === 'apply')
  const isDiscardPending = isReviewing && reviewVariables?.action === 'reject'
  const isBusy = isReviewing || isApplyingCorrected

  const getReviewDisabledReason = () => {
    if (disabledReason !== undefined) return disabledReason
    if (reviewGrant.status === 'denied') {
      return 'You need additional permissions to review network restrictions'
    }
    return undefined
  }
  const reviewDisabledReason = getReviewDisabledReason()
  const canReview = reviewGrant.status === 'granted' && reviewDisabledReason === undefined

  const getApplyDisabledReason = () => {
    if (reviewDisabledReason !== undefined) return reviewDisabledReason
    if (hasIssues && !canApplyCorrected) {
      return 'None of the entries in this change are valid IP ranges. Discard it and add the restrictions again.'
    }
    return undefined
  }
  const applyDisabledReason = getApplyDisabledReason()

  const handleApply = () => {
    if (hasCorrections) return setIsConfirmingCorrections(true)
    if (hasIssues) return applyCorrected()
    if (reviewGrant.status !== 'granted') return
    reviewNetworkRestrictions({
      projectRef,
      grant: reviewGrant.grant,
      action: 'apply',
      requestedAt,
    })
  }

  const handleDiscard = () => {
    if (reviewGrant.status !== 'granted') return
    reviewNetworkRestrictions({
      projectRef,
      grant: reviewGrant.grant,
      action: 'reject',
      requestedAt,
    })
  }

  return (
    <div className="space-y-4">
      <Admonition
        type="warning"
        layout="responsive"
        title="Network restrictions change waiting for review"
        description={
          <div className="space-y-1">
            <p>
              Requested {dayjs(requestedAt).format('D MMM YYYY, HH:mm')} but never applied. Your
              current restrictions stay in place until you apply or discard it.
            </p>
            {isAllowingAll && <p>Applying it allows access from all IP addresses.</p>}
            {isBlockingAll && <p>Applying it blocks all external access to your database.</p>}
            {hasIssues && <p>Some entries aren't valid IP ranges.</p>}
          </div>
        }
        actions={
          <div className="flex items-center gap-x-2">
            <ButtonTooltip
              variant="default"
              disabled={!canReview || isBusy}
              onClick={() => setIsDiscarding(true)}
              tooltip={{ content: { side: 'bottom', text: reviewDisabledReason } }}
            >
              Discard change
            </ButtonTooltip>
            <ButtonTooltip
              variant="primary"
              loading={isApplying}
              disabled={!canReview || applyDisabledReason !== undefined || isBusy}
              onClick={handleApply}
              tooltip={{ content: { side: 'bottom', text: applyDisabledReason } }}
            >
              {hasCorrections ? 'Apply corrected change' : 'Apply change'}
            </ButtonTooltip>
          </div>
        }
      />

      <Card>
        <CardContent className="py-0">
          <div className="divide-y">
            {rows.map((row, index) => (
              <RestrictionRow
                key={`${row.type}-${row.entry}-${index}`}
                entry={row.entry}
                type={row.type}
                change={row.change}
                issue={row.issue}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      <ConfirmationModal
        visible={isDiscarding}
        variant="destructive"
        title="Discard network restrictions change"
        description="The pending list will be deleted. Your current restrictions stay as they are."
        confirmLabel="Discard change"
        loading={isDiscardPending}
        onConfirm={handleDiscard}
        onCancel={() => setIsDiscarding(false)}
      />
      <CorrectRestrictionsModal
        visible={isConfirmingCorrections}
        title="Apply corrected change"
        confirmLabel="Apply corrected change"
        corrections={corrected.corrections}
        loading={isApplyingCorrected}
        onConfirm={applyCorrected}
        onCancel={() => setIsConfirmingCorrections(false)}
      />
    </div>
  )
}
