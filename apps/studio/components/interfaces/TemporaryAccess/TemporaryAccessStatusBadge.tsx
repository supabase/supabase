import dayjs from 'dayjs'
import { Badge } from 'ui'

import type { TemporaryAccessRoleGrantDraft, TemporaryAccessStatus } from './TemporaryAccess.types'
import {
  computeStatusFromGrants,
  getMinutesUntilExpiry,
  getTemporaryAccessStatusDisplay,
} from './TemporaryAccess.utils'

type TemporaryAccessStatusBadgeProps = {
  grants?: TemporaryAccessRoleGrantDraft[]
  status?: TemporaryAccessStatus
  showGuestBadge?: boolean
}

export function TemporaryAccessStatusBadge({
  grants,
  status,
  showGuestBadge = false,
}: TemporaryAccessStatusBadgeProps) {
  const resolvedStatus = status ?? (grants ? computeStatusFromGrants(grants) : null)
  if (!resolvedStatus) return null

  const minutesLeft = grants ? getMinutesUntilExpiry(grants) : null
  const { badges } = getTemporaryAccessStatusDisplay(resolvedStatus)

  if (resolvedStatus.active === 0 && resolvedStatus.expired === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {showGuestBadge && <Badge variant="secondary">Guest</Badge>}
      {resolvedStatus.expired > 0 && resolvedStatus.active === 0 ? (
        <Badge variant="destructive">Expired</Badge>
      ) : minutesLeft !== null ? (
        <Badge variant="warning">
          Active · {minutesLeft === 0 ? '<1m' : `${minutesLeft}m`} left
        </Badge>
      ) : (
        badges.map((badge) => (
          <Badge key={badge.label} variant={badge.variant}>
            {badge.label}
          </Badge>
        ))
      )}
    </div>
  )
}

export function formatTemporaryAccessExpiryLabel(expiryIso: string) {
  if (!expiryIso || !dayjs(expiryIso).isValid()) return null
  return dayjs(expiryIso).format('ddd D MMM YYYY, h:mma')
}
