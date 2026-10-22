import { useAuth, useFlag, useUser } from 'common'
import { useEffect, useRef } from 'react'

import {
  getRecoveryGap,
  getRecoveryReturnTo,
} from './RecoveryInterstitial/RecoveryInterstitial.utils'
import { useAuthenticatorAssuranceLevelQuery } from '@/data/profile/mfa-authenticator-assurance-level-query'
import { useAccountRecovery } from '@/hooks/misc/useAccountRecovery'
import {
  canInterruptRecoveryRoute,
  isRecoveryReminderSnoozed,
  readRecoveryReminderSnooze,
} from '@/lib/account-recovery/recovery-reminder'
import { IS_PLATFORM } from '@/lib/constants'
import { useTrack } from '@/lib/telemetry/track'

// Router adapters pass the full internal destination, including search and hash.
export const RecoveryReminderController = ({
  href,
  onNavigate,
}: {
  href: string
  onNavigate: (href: string) => void
}) => {
  const user = useUser()
  const { session, isLoading } = useAuth()
  const isRolloutEnabled = useFlag('enableAccountRecoveryInterstitial')
  const isRouteEligible = canInterruptRecoveryRoute(href)
  const isEnabled =
    IS_PLATFORM &&
    isRolloutEnabled === true &&
    !!session &&
    !!user?.id &&
    !isLoading &&
    isRouteEligible
  const assurance = useAuthenticatorAssuranceLevelQuery({ enabled: isEnabled })
  const hasVerifiedSession =
    isEnabled && assurance.isSuccess && assurance.data.currentLevel === assurance.data.nextLevel
  const recovery = useAccountRecovery({ enabled: hasVerifiedSession })
  const gap = getRecoveryGap(recovery.findings)
  const track = useTrack()
  const lastRedirect = useRef<string | null>(null)

  useEffect(() => {
    if (!isRouteEligible) lastRedirect.current = null
    if (
      !hasVerifiedSession ||
      recovery.isPending ||
      recovery.isFetching ||
      recovery.isError ||
      !gap ||
      !user?.id
    )
      return
    if (isRecoveryReminderSnoozed(readRecoveryReminderSnooze(user.id), gap)) return
    const destination = getRecoveryReturnTo(href)
    const redirectKey = `${user.id}:${destination}:${gap}`
    if (lastRedirect.current === redirectKey) return
    lastRedirect.current = redirectKey
    track('account_recovery_reminder_exposed', { gap })
    onNavigate(`/account-recovery?${new URLSearchParams({ returnTo: destination })}`)
  }, [
    gap,
    hasVerifiedSession,
    href,
    isRouteEligible,
    onNavigate,
    recovery.isError,
    recovery.isFetching,
    recovery.isPending,
    track,
    user?.id,
  ])

  return null
}
