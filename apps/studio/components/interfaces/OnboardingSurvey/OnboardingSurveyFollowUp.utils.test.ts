import { describe, expect, it } from 'vitest'

import { ONBOARDING_SURVEY_FOLLOW_UP_WINDOW_MS } from './OnboardingSurvey.constants'
import { getFollowUpRemainingMs, isProjectCreationPath } from './OnboardingSurveyFollowUp.utils'

describe('getFollowUpRemainingMs', () => {
  const createdAt = '2026-10-30T10:00:00.000Z'
  const createdAtMs = Date.parse(createdAt)

  it('counts down within the window', () => {
    expect(getFollowUpRemainingMs(createdAt, createdAtMs + 60_000)).toBe(
      ONBOARDING_SURVEY_FOLLOW_UP_WINDOW_MS - 60_000
    )
  })

  it('never goes below 0 once the window has passed', () => {
    expect(
      getFollowUpRemainingMs(createdAt, createdAtMs + ONBOARDING_SURVEY_FOLLOW_UP_WINDOW_MS + 1)
    ).toBe(0)
  })

  // NaN here would leave the follow-up pending forever
  it('treats an unparseable timestamp as expired', () => {
    expect(getFollowUpRemainingMs('not-a-date', createdAtMs)).toBe(0)
  })
})

describe('isProjectCreationPath', () => {
  it.each(['/new', '/new/my-org', '/integrations/vercel/my-org/deploy-button/new-project'])(
    'treats %s as project creation',
    (pathname) => {
      expect(isProjectCreationPath(pathname)).toBe(true)
    }
  )

  it.each(['/project/abc', '/org/my-org', '/newsletter', null, undefined])(
    'does not treat %s as project creation',
    (pathname) => {
      expect(isProjectCreationPath(pathname)).toBe(false)
    }
  )
})
