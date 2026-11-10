import { LOCAL_STORAGE_KEYS } from 'common'
import { useCallback, useEffect, useState } from 'react'

import {
  getFollowUpRemainingMs,
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
    profileId && orgSlug
      ? LOCAL_STORAGE_KEYS.ONBOARDING_SURVEY_FOLLOW_UP(profileId, orgSlug)
      : UNKNOWN_STORAGE_KEY

  const [storedState, setStoredState] = useLocalStorageQuery<unknown>(storageKey, null)
  const followUpState = parseFollowUpState(storedState)
  const pendingOrgCreatedAt =
    followUpState?.status === 'pending' ? followUpState.orgCreatedAt : undefined

  // The window is time-based: it's checked against the clock on render, and a
  // timer marks it expired (and re-renders) when it closes.
  const [expiredOrgCreatedAt, setExpiredOrgCreatedAt] = useState<string>()
  const hasExpired =
    !!pendingOrgCreatedAt &&
    (expiredOrgCreatedAt === pendingOrgCreatedAt ||
      getFollowUpRemainingMs(pendingOrgCreatedAt, Date.now()) <= 0)
  const isEligible = !!pendingOrgCreatedAt && !hasExpired

  useEffect(() => {
    if (!pendingOrgCreatedAt) return
    const timeout = setTimeout(
      () => setExpiredOrgCreatedAt(pendingOrgCreatedAt),
      getFollowUpRemainingMs(pendingOrgCreatedAt, Date.now())
    )
    return () => clearTimeout(timeout)
  }, [pendingOrgCreatedAt])

  const resolveFollowUp = useCallback(
    (status: Exclude<OnboardingSurveyFollowUpStatus, 'pending'>) => {
      setStoredState((previous: unknown) => {
        const previousState = parseFollowUpState(previous)
        return previousState ? { ...previousState, status } : previous
      })
    },
    [setStoredState]
  )

  // Undoes a dismissal whose save failed, keeping the original org details and
  // creation time, so the next page load retries it
  const reopenFollowUp = useCallback(() => {
    setStoredState((previous: unknown) => {
      const previousState = parseFollowUpState(previous)
      return previousState?.status === 'dismissed'
        ? { ...previousState, status: 'pending' }
        : previous
    })
  }, [setStoredState])

  return {
    isEligible,
    hasExpired,
    orgSlug,
    orgKind: followUpState?.kind,
    orgSize: followUpState?.size,
    resolveFollowUp,
    reopenFollowUp,
  }
}
