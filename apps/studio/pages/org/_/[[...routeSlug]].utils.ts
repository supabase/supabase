/**
 * Builds an org-scoped URL for the wildcard org route.
 *
 * When `slug` is undefined (i.e. the user landed on /org/_), the destination
 * is the org project list at /org/<orgSlug>.
 *
 * When `slug` is an array (e.g. /org/_/settings/billing), the sub-path is
 * preserved so the user lands on the equivalent page for the chosen org.
 */
export function buildOrgUrl(
  slug: string | string[] | undefined,
  orgSlug: string,
  queryString: string
): string {
  const qs = queryString ? `?${queryString}` : ''
  if (!Array.isArray(slug)) {
    return `/org/${orgSlug}${qs}`
  }
  const slugPath = slug.reduce((a: string, b: string) => `${a}/${b}`, '').slice(1)
  return `/org/${orgSlug}/${slugPath}${qs}`
}
