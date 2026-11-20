import { useAuth, useFeatureFlags, useFlag, useUser } from 'common'
import { useEffect, useRef, useState, type ReactNode } from 'react'

import { RecoveryInterstitial } from './RecoveryInterstitial/RecoveryInterstitial'
import { getRecoveryGap, type RecoveryGap } from './RecoveryInterstitial/RecoveryInterstitial.utils'
import { RecoveryTakeover } from './RecoveryTakeover'
import { useAuthenticatorAssuranceLevelQuery } from '@/data/profile/mfa-authenticator-assurance-level-query'
import { useAccountRecovery } from '@/hooks/misc/useAccountRecovery'
import {
  canInterruptRecoveryRoute,
  isRecoveryReminderSnoozed,
  readRecoveryReminderSnooze,
  resetRecoveryReminderSession,
} from '@/lib/account-recovery/recovery-reminder'
import { BASE_PATH, IS_PLATFORM } from '@/lib/constants'
import { useTrack } from '@/lib/telemetry/track'

export const RecoveryReminderController = ({
  href,
  children,
}: {
  children?: ReactNode
  href: string
}) => {
  const user = useUser()
  const { session, isLoading } = useAuth()
  const { hasLoaded, isConfigCatStale } = useFeatureFlags()
  const isRolloutEnabled = useFlag('enableAccountRecoveryInterstitial')
  const internalHref =
    BASE_PATH && href.startsWith(`${BASE_PATH}/`) ? href.slice(BASE_PATH.length) : href
  const isEnabled =
    IS_PLATFORM &&
    hasLoaded === true &&
    !isConfigCatStale &&
    isRolloutEnabled === true &&
    !!session &&
    !!user?.id &&
    !isLoading &&
    canInterruptRecoveryRoute(internalHref)
  const assurance = useAuthenticatorAssuranceLevelQuery({ enabled: isEnabled })
  const hasVerifiedSession =
    isEnabled && assurance.isSuccess && assurance.data.currentLevel === assurance.data.nextLevel
  const recovery = useAccountRecovery({ enabled: hasVerifiedSession })
  const gap = getRecoveryGap(recovery.findings)
  const track = useTrack()
  const [reminder, setReminder] = useState<{ userId: string; gap: RecoveryGap } | null>(null)
  const dismissedGap = useRef<string | null>(null)
  const previousFocus = useRef<HTMLElement | null>(null)
  const isShowing = hasVerifiedSession && reminder?.userId === user?.id

  useEffect(() => {
    if (!hasVerifiedSession || (reminder && reminder.userId !== user?.id)) {
      setReminder(null)
      dismissedGap.current = null
      return
    }
    if (!gap) dismissedGap.current = null
    if (
      reminder ||
      recovery.isPending ||
      recovery.isFetching ||
      recovery.isError ||
      !gap ||
      !user?.id
    )
      return
    const userId = user.id
    if (isRecoveryReminderSnoozed(readRecoveryReminderSnooze(userId), gap)) return
    const show = () => {
      if (
        dismissedGap.current === `${userId}:${gap}` ||
        isRecoveryReminderSnoozed(readRecoveryReminderSnooze(userId), gap) ||
        document.querySelector(
          '[role="dialog"]:not([data-state="closed"]), [role="alertdialog"]:not([data-state="closed"]), [role="menu"][data-state="open"]'
        )
      )
        return
      observer.disconnect()
      previousFocus.current =
        document.activeElement instanceof HTMLElement ? document.activeElement : null
      setReminder({ userId, gap })
      track('account_recovery_reminder_exposed', { gap })
    }
    const observer = new MutationObserver(show)
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-state'],
    })
    show()
    return () => observer.disconnect()
  }, [
    hasVerifiedSession,
    href,
    gap,
    reminder,
    recovery.isPending,
    recovery.isFetching,
    recovery.isError,
    track,
    user?.id,
  ])

  useEffect(() => {
    const userId = user?.id
    return () => {
      if (userId) resetRecoveryReminderSession(userId)
    }
  }, [user?.id])

  return (
    <>
      <div className="contents" inert={isShowing}>
        {children}
      </div>
      {isShowing && reminder && (
        <RecoveryTakeover restoreFocusTo={previousFocus.current}>
          <RecoveryInterstitial
            onDismiss={() => {
              if (!readRecoveryReminderSnooze(reminder.userId))
                dismissedGap.current = `${reminder.userId}:${reminder.gap}`
              setReminder(null)
            }}
          />
        </RecoveryTakeover>
      )}
    </>
  )
}
