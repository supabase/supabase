import { afterEach, describe, expect, it } from 'vitest'

import {
  getTrackedGuestInvite,
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

  it('tracks guest invite emails with pending access grant metadata', () => {
    trackGuestInviteEmails(slug, ['Guest@Example.com'], {
      project_ref: 'proj-a',
      roles: [{ role: 'supabase_read_only_user', expires_after_seconds: 3600 }],
    })

    expect(getTrackedGuestInvite(slug, 'guest@example.com')?.pendingAccessGrant).toEqual({
      project_ref: 'proj-a',
      roles: [{ role: 'supabase_read_only_user', expires_after_seconds: 3600 }],
    })
  })

  it('removes tracked guest invite emails', () => {
    trackGuestInviteEmails(slug, ['guest@example.com'])
    untrackGuestInviteEmail(slug, 'guest@example.com')

    expect(getTrackedGuestInviteEmails(slug)).toEqual(new Set())
  })
})
