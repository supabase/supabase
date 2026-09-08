import { IS_PLATFORM } from '@/lib/constants'

const NIMBUS_PROD_PROJECTS_URL = process.env.NIMBUS_PROD_PROJECTS_URL
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

const FUNCTIONS_PATH_PREFIX = /^\/functions\/v[0-9]{1}\//

export const isValidEdgeFunctionURL = (url: string, isPlatform: boolean) => {
  // Validate the parsed URL, not the raw string. A raw-string regex can be
  // passed by '/functions/v1/../../<path>' while fetch normalizes the dots
  // away before sending, so the request escapes the functions prefix to any
  // path on any host (SSRF; e.g. cloud metadata endpoints on self-hosted).
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return false
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return false
  if (!FUNCTIONS_PATH_PREFIX.test(parsed.pathname)) return false

  if (NIMBUS_PROD_PROJECTS_URL !== undefined) {
    const apexDomain = NIMBUS_PROD_PROJECTS_URL.replace('https://*.', '').replace(/\./g, '\\.')
    const nimbusHostRegex = new RegExp('^[a-z]*\\.' + apexDomain + '$')
    return parsed.protocol === 'https:' && nimbusHostRegex.test(parsed.host)
  }

  if (!isPlatform) {
    // Self-hosted may serve edge functions on a custom domain, so any host is
    // allowed; the normalized path prefix above is the security invariant.
    return true
  }

  return parsed.protocol === 'https:' && /^[a-z]{20}\.supabase\.(red|co)$/.test(parsed.host)
}
