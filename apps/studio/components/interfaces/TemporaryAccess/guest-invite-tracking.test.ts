import { afterEach, describe, expect, it } from 'vitest'

import {
  getTrackedGuestInviteEmails,
  trackGuestInviteEmails,
  untrackGuestInviteEmail,
} from './guest-invite-tracking'

const slug = 'test-org'

describe('guest-invite-tracking', () => {
  afterEach(() => {
    window.sessionStorage.clear()
  })

  it('tracks and reads guest invite emails for an org', () => {
    trackGuestInviteEmails(slug, ['Guest@Example.com'])

    expect(getTrackedGuestInviteEmails(slug)).toEqual(new Set(['guest@example.com']))
  })

  it('removes tracked guest invite emails', () => {
    trackGuestInviteEmails(slug, ['guest@example.com'])
    untrackGuestInviteEmail(slug, 'guest@example.com')

    expect(getTrackedGuestInviteEmails(slug)).toEqual(new Set())
  })
})
