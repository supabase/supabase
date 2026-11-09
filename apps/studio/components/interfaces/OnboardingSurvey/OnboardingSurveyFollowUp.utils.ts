import { LOCAL_STORAGE_KEYS, safeLocalStorage } from 'common'
import { z } from 'zod'

import { ONBOARDING_SURVEY_FOLLOW_UP_WINDOW_MS } from './OnboardingSurvey.constants'

const followUpStateSchema = z.object({
  status: z.enum(['pending', 'submitted', 'dismissed']),
  orgCreatedAt: z.string(),
  // The org's type and size from the new-org form, saved with the follow-up's
  // answers since the form sent nothing at creation
  kind: z.string().optional(),
  size: z.string().optional(),
})

export type OnboardingSurveyFollowUpState = z.infer<typeof followUpStateSchema>
export type OnboardingSurveyFollowUpStatus = OnboardingSurveyFollowUpState['status']

export function getFollowUpStorageKey(profileId: string, orgSlug: string) {
  return LOCAL_STORAGE_KEYS.ONBOARDING_SURVEY_FOLLOW_UP(profileId, orgSlug)
}

export function parseFollowUpState(value: unknown): OnboardingSurveyFollowUpState | null {
  const result = followUpStateSchema.safeParse(value)
  return result.success ? result.data : null
}

/**
 * Records that the org's creator left the survey blank on the new-org form, so
 * the follow-up card can ask again. Written to the creator's browser only,
 * which is what limits the follow-up to the creator.
 */
export function markFollowUpPending({
  profileId,
  orgSlug,
  kind,
  size,
  now = new Date(),
}: {
  profileId: string
  orgSlug: string
  kind?: string
  size?: string
  now?: Date
}) {
  const state: OnboardingSurveyFollowUpState = {
    status: 'pending',
    orgCreatedAt: now.toISOString(),
    kind,
    size,
  }
  safeLocalStorage.setItem(getFollowUpStorageKey(profileId, orgSlug), JSON.stringify(state))
}

/** Milliseconds left to show the follow-up for an org created at `orgCreatedAt`. */
export function getFollowUpRemainingMs(orgCreatedAt: string, now: number) {
  const createdAt = Date.parse(orgCreatedAt)
  if (Number.isNaN(createdAt)) return 0
  return Math.max(0, createdAt + ONBOARDING_SURVEY_FOLLOW_UP_WINDOW_MS - now)
}

/**
 * Project creation pages (/new/[slug] and the Vercel deploy-button flow) are
 * where the creator is likely to land right after making the org; keep the
 * follow-up out of their way there.
 */
export function isProjectCreationPath(pathname: string | null | undefined) {
  if (!pathname) return false
  return pathname === '/new' || pathname.startsWith('/new/') || pathname.endsWith('/new-project')
}
