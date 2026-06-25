const guestInviteStorageKey = (slug: string) => `supabase-guest-invites:${slug}`

function readGuestInviteEmails(slug: string): Set<string> {
  if (typeof window === 'undefined') return new Set()

  try {
    const raw = window.sessionStorage.getItem(guestInviteStorageKey(slug))
    if (!raw) return new Set()

    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return new Set()

    return new Set(parsed.filter((email): email is string => typeof email === 'string'))
  } catch {
    return new Set()
  }
}

function writeGuestInviteEmails(slug: string, emails: Set<string>) {
  if (typeof window === 'undefined') return

  if (emails.size === 0) {
    window.sessionStorage.removeItem(guestInviteStorageKey(slug))
    return
  }

  window.sessionStorage.setItem(guestInviteStorageKey(slug), JSON.stringify([...emails]))
}

export function getTrackedGuestInviteEmails(slug: string | undefined) {
  if (!slug) return new Set<string>()
  return readGuestInviteEmails(slug)
}

export function trackGuestInviteEmails(slug: string, emails: string[]) {
  const normalizedEmails = emails.map((email) => email.trim().toLowerCase()).filter(Boolean)
  if (normalizedEmails.length === 0) return

  const tracked = readGuestInviteEmails(slug)
  normalizedEmails.forEach((email) => tracked.add(email))
  writeGuestInviteEmails(slug, tracked)
}

export function untrackGuestInviteEmail(slug: string, email: string) {
  const normalizedEmail = email.trim().toLowerCase()
  if (!normalizedEmail) return

  const tracked = readGuestInviteEmails(slug)
  tracked.delete(normalizedEmail)
  writeGuestInviteEmails(slug, tracked)
}
