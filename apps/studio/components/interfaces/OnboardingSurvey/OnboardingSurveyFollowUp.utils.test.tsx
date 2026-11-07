import { safeLocalStorage } from 'common'
import { afterEach, describe, expect, it } from 'vitest'

import { ONBOARDING_SURVEY_FOLLOW_UP_WINDOW_MS } from './OnboardingSurvey.constants'
import {
  getFollowUpRemainingMs,
  getFollowUpStorageKey,
  isProjectCreationPath,
  markFollowUpPending,
  parseFollowUpState,
} from './OnboardingSurveyFollowUp.utils'

describe('getFollowUpRemainingMs', () => {
  const createdAt = '2026-10-30T10:00:00.000Z'
  const createdAtMs = Date.parse(createdAt)

  it('returns the full window right after creation', () => {
    expect(getFollowUpRemainingMs(createdAt, createdAtMs)).toBe(
      ONBOARDING_SURVEY_FOLLOW_UP_WINDOW_MS
    )
  })

  it('counts down within the window', () => {
    expect(getFollowUpRemainingMs(createdAt, createdAtMs + 60_000)).toBe(
      ONBOARDING_SURVEY_FOLLOW_UP_WINDOW_MS - 60_000
    )
  })

  it('returns 0 once the window has passed', () => {
    expect(
      getFollowUpRemainingMs(createdAt, createdAtMs + ONBOARDING_SURVEY_FOLLOW_UP_WINDOW_MS + 1)
    ).toBe(0)
  })

  it('returns 0 for an unparseable timestamp', () => {
    expect(getFollowUpRemainingMs('not-a-date', createdAtMs)).toBe(0)
  })
})

describe('parseFollowUpState', () => {
  it('accepts a stored state', () => {
    const state = { status: 'pending', orgCreatedAt: '2026-10-30T10:00:00.000Z' }
    expect(parseFollowUpState(state)).toEqual(state)
  })

  it.each([null, 'pending', { status: 'unknown', orgCreatedAt: 'x' }, { status: 'pending' }])(
    'rejects %j',
    (value) => {
      expect(parseFollowUpState(value)).toBeNull()
    }
  )
})

describe('markFollowUpPending', () => {
  afterEach(() => {
    safeLocalStorage.removeItem(getFollowUpStorageKey('user-1', 'new-org'))
  })

  it('stores a pending state keyed by user and org', () => {
    const now = new Date('2026-10-30T10:00:00.000Z')
    markFollowUpPending({ profileId: 'user-1', orgSlug: 'new-org', now })

    const stored = safeLocalStorage.getItem(getFollowUpStorageKey('user-1', 'new-org'))
    expect(JSON.parse(stored!)).toEqual({ status: 'pending', orgCreatedAt: now.toISOString() })
  })

  it('stores the org type and size for the follow-up to save', () => {
    const now = new Date('2026-10-30T10:00:00.000Z')
    markFollowUpPending({
      profileId: 'user-1',
      orgSlug: 'new-org',
      kind: 'COMPANY',
      size: '10',
      now,
    })

    const stored = safeLocalStorage.getItem(getFollowUpStorageKey('user-1', 'new-org'))
    expect(parseFollowUpState(JSON.parse(stored!))).toEqual({
      status: 'pending',
      orgCreatedAt: now.toISOString(),
      kind: 'COMPANY',
      size: '10',
    })
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
