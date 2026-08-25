import { IS_PLATFORM } from '@/lib/constants'

// Cron jobs and database hooks run inside Postgres, where Kong is available by this network alias.
const SELF_HOSTED_EDGE_FUNCTIONS_URL = 'http://kong:8000/functions/v1'
const PLATFORM_TLDS = ['co', 'red'] as const

export const buildDatabaseEdgeFunctionUrl = (
  slug: string,
  projectRef: string,
  restUrl?: string,
  isPlatform = IS_PLATFORM
) => {
  if (!isPlatform) return `${SELF_HOSTED_EDGE_FUNCTIONS_URL}/${slug}`

  const projectOrigin = restUrl ? new URL(restUrl).origin : `https://${projectRef}.supabase.co`
  return `${projectOrigin}/functions/v1/${slug}`
}

export const isEdgeFunctionUrl = (
  url: string,
  projectRef: string,
  restUrl?: string,
  isPlatform = IS_PLATFORM
) => {
  if (!isPlatform && url.startsWith(`${SELF_HOSTED_EDGE_FUNCTIONS_URL}/`)) return true

  const projectOrigin = restUrl ? new URL(restUrl).origin : undefined
  if (projectOrigin && url.startsWith(`${projectOrigin}/functions/v1/`)) return true

  return PLATFORM_TLDS.some(
    (tld) =>
      url.startsWith(`https://${projectRef}.functions.supabase.${tld}/`) ||
      url.startsWith(`https://${projectRef}.supabase.${tld}/functions/`)
  )
}

/**
 * Normalises `NIMBUS_PROD_PROJECTS_URL` (e.g. `https://*.example.com`) down to its apex domain.
 * Returns null when unset, blank, or whitespace-only so callers fall through to the default hosts.
 * Read at call time rather than module scope so the value is stubbable in tests.
 */
const getAdditionalProjectsApexDomain = () => {
  const configured = process.env.NIMBUS_PROD_PROJECTS_URL?.trim()
  if (!configured) return null

  return (
    configured
      .replace(/^https?:\/\//, '')
      .replace(/^\*\./, '')
      .replace(/\/+$/, '')
      .toLowerCase() || null
  )
}

const isFunctionsPath = (pathname: string) => /^\/functions\/v\d\/.+/.test(pathname)

/**
 * Guards the server-side fetch in `pages/api/edge-functions/test.ts`, so this doubles as an
 * SSRF allowlist: only hosts that match are fetched with the caller's credentials attached.
 */
export const isValidEdgeFunctionURL = (url: string, isPlatform: boolean) => {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return false
  }

  // Parse rather than pattern-match the whole URL, so credentials/query smuggling such as
  // `https://localhost?https://ref.supabase.co/functions/v1/x` can't satisfy the host check.
  if (!isFunctionsPath(parsed.pathname)) return false

  if (!isPlatform) return parsed.protocol === 'http:' || parsed.protocol === 'https:'

  if (parsed.protocol !== 'https:') return false

  const host = parsed.hostname.toLowerCase()

  // Additive: a deployment serving additional project domains must still validate the
  // default ones, so this is checked alongside PLATFORM_TLDS rather than instead of them.
  const additionalApexDomain = getAdditionalProjectsApexDomain()
  if (additionalApexDomain && host.endsWith(`.${additionalApexDomain}`)) return true

  return PLATFORM_TLDS.some((tld) => new RegExp(`^[a-z]{20}\\.supabase\\.${tld}$`).test(host))
}
