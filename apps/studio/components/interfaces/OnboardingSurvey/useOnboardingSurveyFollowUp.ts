import { useCallback, useEffect, useState } from 'react'

import {
  getFollowUpRemainingMs,
  getFollowUpStorageKey,
  parseFollowUpState,
  type OnboardingSurveyFollowUpStatus,
} from './OnboardingSurveyFollowUp.utils'
import { useLocalStorageQuery } from '@/hooks/misc/useLocalStorage'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import { useProfile } from '@/lib/profile'

const UNKNOWN_STORAGE_KEY = 'supabase-onboarding-survey-follow-up-unknown'

/**
 * Whether the selected org's creator should be asked the onboarding survey
 * again: they left it blank on the new-org form in this browser, haven't
 * answered or skipped since, and the org is less than five minutes old.
 * `hasExpired` turns true once those five minutes pass with no answer or skip.
 */
export function useOnboardingSurveyFollowUp() {
  const { profile } = useProfile()
  const { data: organization } = useSelectedOrganizationQuery()

  const profileId = profile?.gotrue_id
  const orgSlug = organization?.slug
  const storageKey =
    profileId && orgSlug ? getFollowUpStorageKey(profileId, orgSlug) : UNKNOWN_STORAGE_KEY

  const [storedState, setStoredState] = useLocalStorageQuery<unknown>(storageKey, null)
  const followUpState = parseFollowUpState(storedState)
  const pendingOrgCreatedAt =
    followUpState?.status === 'pending' ? followUpState.orgCreatedAt : undefined

  // The window is time-based, so a timer (not render) decides when it closes.
  const [activeOrgCreatedAt, setActiveOrgCreatedAt] = useState<string>()
  const [expiredOrgCreatedAt, setExpiredOrgCreatedAt] = useState<string>()

  useEffect(() => {
    if (!pendingOrgCreatedAt) return

    const remainingMs = getFollowUpRemainingMs(pendingOrgCreatedAt, Date.now())
    if (remainingMs <= 0) {
      setExpiredOrgCreatedAt(pendingOrgCreatedAt)
      return
    }

    setActiveOrgCreatedAt(pendingOrgCreatedAt)
    const timeout = setTimeout(() => {
      setActiveOrgCreatedAt(undefined)
      setExpiredOrgCreatedAt(pendingOrgCreatedAt)
    }, remainingMs)
    return () => {
      clearTimeout(timeout)
      setActiveOrgCreatedAt(undefined)
    }
  }, [pendingOrgCreatedAt])

  const isEligible = !!pendingOrgCreatedAt && activeOrgCreatedAt === pendingOrgCreatedAt
  const hasExpired = !!pendingOrgCreatedAt && expiredOrgCreatedAt === pendingOrgCreatedAt

  const resolveFollowUp = useCallback(
    (status: Exclude<OnboardingSurveyFollowUpStatus, 'pending'>) => {
      setStoredState((previous: unknown) => {
        const previousState = parseFollowUpState(previous)
        return previousState ? { ...previousState, status } : previous
      })
    },
    [setStoredState]
  )

  return {
    isEligible,
    hasExpired,
    orgSlug,
    orgKind: followUpState?.kind,
    orgSize: followUpState?.size,
    resolveFollowUp,
  }
}
