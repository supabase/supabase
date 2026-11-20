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

  it('keeps the visitor consent records so an opt-out survives sign-out', () => {
    localStorage.clear()
    const consentKeys = [
      'uc_settings',
      'uc_user_interaction',
      'ucData',
      'ucString',
      '__ph_opt_in_out_phc_test',
    ]
    consentKeys.forEach((key) => localStorage.setItem(key, 'x'))

    clearLocalStorage()

    consentKeys.forEach((key) => expect(localStorage.getItem(key)).toBe('x'))
  })
})
