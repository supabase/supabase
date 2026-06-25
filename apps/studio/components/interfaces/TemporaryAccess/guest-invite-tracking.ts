import type { PendingInvitationAccessGrant } from './TemporaryAccess.types'

type TrackedGuestInvite = {
  pendingAccessGrant?: PendingInvitationAccessGrant
}

const guestInviteStorageKey = (slug: string) => `supabase-guest-invites:${slug}`

function readGuestInvites(slug: string): Map<string, TrackedGuestInvite> {
  if (typeof window === 'undefined') return new Map()

  try {
    const raw = window.sessionStorage.getItem(guestInviteStorageKey(slug))
    if (!raw) return new Map()

    const parsed = JSON.parse(raw)

    if (Array.isArray(parsed)) {
      return new Map(
        parsed
          .filter((email): email is string => typeof email === 'string')
          .map((email) => [email.trim().toLowerCase(), {}])
      )
    }

    if (typeof parsed !== 'object' || parsed === null) return new Map()

    return new Map(
      Object.entries(parsed).map(([email, value]) => {
        const invite = value as TrackedGuestInvite
        return [email.trim().toLowerCase(), invite ?? {}]
      })
    )
  } catch {
    return new Map()
  }
}

function writeGuestInvites(slug: string, invites: Map<string, TrackedGuestInvite>) {
  if (typeof window === 'undefined') return

  if (invites.size === 0) {
    window.sessionStorage.removeItem(guestInviteStorageKey(slug))
    return
  }

  window.sessionStorage.setItem(
    guestInviteStorageKey(slug),
    JSON.stringify(Object.fromEntries(invites))
  )
}

export function getTrackedGuestInviteEmails(slug: string | undefined) {
  if (!slug) return new Set<string>()
  return new Set(readGuestInvites(slug).keys())
}

export function getTrackedGuestInvite(
  slug: string | undefined,
  email: string | undefined
): TrackedGuestInvite | undefined {
  if (!slug || !email) return undefined
  return readGuestInvites(slug).get(email.trim().toLowerCase())
}

export function trackGuestInviteEmails(
  slug: string,
  emails: string[],
  pendingAccessGrant?: PendingInvitationAccessGrant
) {
  const normalizedEmails = emails.map((email) => email.trim().toLowerCase()).filter(Boolean)
  if (normalizedEmails.length === 0) return

  const tracked = readGuestInvites(slug)
  normalizedEmails.forEach((email) => {
    tracked.set(email, { pendingAccessGrant })
  })
  writeGuestInvites(slug, tracked)
}

export function untrackGuestInviteEmail(slug: string, email: string) {
  const normalizedEmail = email.trim().toLowerCase()
  if (!normalizedEmail) return

  const tracked = readGuestInvites(slug)
  tracked.delete(normalizedEmail)
  writeGuestInvites(slug, tracked)
}
