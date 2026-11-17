// @vitest-environment jsdom
import { clearLocalStorage, LOCAL_STORAGE_KEYS } from 'common'
import { describe, expect, it } from 'vitest'

describe('clearLocalStorage', () => {
  it('preserves queue operations preferences while removing non-allowlisted keys', () => {
    localStorage.clear()

    localStorage.setItem(LOCAL_STORAGE_KEYS.UI_PREVIEW_QUEUE_OPERATIONS, 'true')
    localStorage.setItem('not-allowlisted', 'remove-me')
    localStorage.setItem('account-recovery-reminder:user-a', 'snooze-a')
    localStorage.setItem('account-recovery-reminder:user-b', 'snooze-b')
    const followUpKey = LOCAL_STORAGE_KEYS.ONBOARDING_SURVEY_FOLLOW_UP('user-a', 'new-org')
    localStorage.setItem(followUpKey, 'pending')

    clearLocalStorage()

    expect(localStorage.getItem(LOCAL_STORAGE_KEYS.UI_PREVIEW_QUEUE_OPERATIONS)).toBe('true')
    expect(localStorage.getItem('not-allowlisted')).toBeNull()
    expect(localStorage.getItem('account-recovery-reminder:user-a')).toBe('snooze-a')
    expect(localStorage.getItem('account-recovery-reminder:user-b')).toBe('snooze-b')
    expect(localStorage.getItem(followUpKey)).toBe('pending')
  })
})
