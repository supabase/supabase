/**
 * Builds the URL used to invoke a Supabase Edge Function.
 *
 * For Supabase Cloud (hostname matches *.supabase.<tld>) the `<ref>.supabase.<tld>`
 * subdomain pattern is kept. For anything else — including self-hosted setups
 * where the project's URL is `http://localhost:8000`, `http://kong:8000`, or a
 * custom domain — the origin from `restUrl` is used directly so the generated
 * URL resolves in the context it is being invoked from (browser, pg_cron in
 * the Postgres container, etc.).
 */
export const buildEdgeFunctionUrl = (
  slug: string,
  projectRef: string | undefined,
  restUrl?: string
): string => {
  const fallback = `https://${projectRef}.supabase.co/functions/v1/${slug}`
  if (!restUrl) return fallback

  let parsed: URL
  try {
    parsed = new URL(restUrl)
  } catch {
    return fallback
  }

  const { hostname, origin } = parsed
  const tld = hostname.split('.').pop()
  // Only treat the host as Supabase Cloud when it matches <projectRef>.supabase.<tld>
  // exactly. This keeps generated URLs correct for self-hosted setups that run
  // on localhost, Docker service names, or custom domains.
  if (projectRef && hostname === `${projectRef}.supabase.${tld}`) {
    return `https://${projectRef}.supabase.${tld}/functions/v1/${slug}`
  }
  return `${origin}/functions/v1/${slug}`
}

/**
 * Checks whether a persisted webhook URL points at a Supabase Edge Function.
 *
 * Matches both the old `.functions.supabase.<tld>` and the current
 * `.supabase.<tld>/functions/` cloud patterns, and for self-hosted setups
 * treats any URL rooted at the project's restUrl origin with `/functions/v1/`
 * as an edge function.
 */
export const isEdgeFunctionUrl = (
  url: string,
  projectRef: string | undefined,
  restUrl?: string
): boolean => {
  if (!url || !projectRef) return false

  if (
    url.startsWith(`https://${projectRef}.functions.supabase.`) ||
    (url.startsWith(`https://${projectRef}.supabase.`) && url.includes('/functions/'))
  ) {
    return true
  }

  if (!restUrl) return false
  try {
    const origin = new URL(restUrl).origin
    return url.startsWith(`${origin}/functions/v1/`)
  } catch {
    return false
  }
}
