/**
 * Builds an org-scoped URL for the wildcard org route (/org/_).
 *
 * When `slug` is undefined the destination is the org project list at
 * /org/<orgSlug>. When `slug` is an array the sub-path is preserved so the
 * user lands on the equivalent page for the chosen org.
 */
export function buildOrgUrl({
  slug,
  orgSlug,
  queryString,
}: {
  slug: string | string[] | undefined
  orgSlug: string
  queryString: string
}): string {
  const qs = queryString ? `?${queryString}` : ''
  if (!Array.isArray(slug)) {
    return `/org/${orgSlug}${qs}`
  }
  const slugPath = slug.reduce((a: string, b: string) => `${a}/${b}`, '').slice(1)
  return `/org/${orgSlug}/${slugPath}${qs}`
}

// Invite is expired if older than 24hrs
export function isInviteExpired(timestamp: string) {
  const inviteDate = new Date(timestamp)
  const now = new Date()
  const timeBetween = now.valueOf() - inviteDate.valueOf()
  if (timeBetween / 1000 / 60 / 60 < 24) {
    return false
  }
  return true
}
