import { useAuth, useFeatureFlags, useFlag, useUser } from 'common'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

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
  resetRecoveryReminderSession,
} from '@/lib/account-recovery/recovery-reminder'
import { IS_PLATFORM } from '@/lib/constants'
import { useTrack } from '@/lib/telemetry/track'

// Router adapters pass the full internal destination, including search and hash.
export const RecoveryReminderController = ({
  href,
  onNavigate,
  children,
}: {
  children?: ReactNode
  href: string
  onNavigate: (href: string) => void
}) => {
  const user = useUser()
  const { session, isLoading } = useAuth()
  const { hasLoaded, isConfigCatStale } = useFeatureFlags()
  const flagsReady = hasLoaded === true && !isConfigCatStale
  const [admittedUser, setAdmittedUser] = useState<string | null>(null)
  const isRolloutEnabled = useFlag('enableAccountRecoveryInterstitial')
  const isRouteEligible = canInterruptRecoveryRoute(href)
  const isEnabled =
    IS_PLATFORM &&
    flagsReady &&
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
    if (!session || !user?.id) {
      lastRedirect.current = null
      setAdmittedUser(null)
      return
    }
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
    session,
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

  const isFirstEntry = admittedUser !== user?.id
  const isWaiting =
    isLoading ||
    !flagsReady ||
    (isEnabled && assurance.isPending) ||
    (hasVerifiedSession && (recovery.isPending || recovery.isFetching))
  const shouldInterrupt =
    hasVerifiedSession &&
    !recovery.isError &&
    !!gap &&
    !!user?.id &&
    !isRecoveryReminderSnoozed(readRecoveryReminderSnooze(user.id), gap)
  const shouldHoldDashboard =
    IS_PLATFORM && isRouteEligible && isFirstEntry && (isWaiting || shouldInterrupt)

  useEffect(() => {
    if (IS_PLATFORM && isRouteEligible && user?.id && !isWaiting && !shouldInterrupt) {
      setAdmittedUser(user.id)
    }
  }, [isRouteEligible, isWaiting, shouldInterrupt, user?.id])

  useEffect(() => {
    const userId = user?.id
    return () => {
      if (userId) resetRecoveryReminderSession(userId)
    }
  }, [user?.id])

  if (shouldHoldDashboard)
    return (
      <div
        role="status"
        aria-label="Loading dashboard"
        className="flex min-h-screen items-center justify-center bg-studio"
      >
        <ShimmeringLoader className="h-5 w-40 py-0" />
      </div>
    )
  return children
}
