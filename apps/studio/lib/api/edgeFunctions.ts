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

const PLATFORM_EDGE_FUNCTION_HOSTNAME = /^[a-z]{20}\.supabase\.(co|red)$/
const PROJECT_SUBDOMAIN = /^[a-z]+$/
// Any WHATWG-serialized http(s) pathname under `/functions/vN/`. The character class is spelled
// out instead of `.*` so static analysis (CodeQL) recognizes the test as a sanitizer.
const EDGE_FUNCTION_PATHNAME = /^\/functions\/v[0-9]+\/[\w\-.~!$&'()*+,;=:@%/[\]^|]*$/

interface EdgeFunctionTestUrlOptions {
  isPlatform: boolean
  /** Wildcard projects URL of a Nimbus deployment, e.g. `https://*.example.com` */
  nimbusProjectsUrl?: string
  /** Self-hosted API gateway URL the server can reach */
  supabaseUrl?: string
  /** Self-hosted API gateway URL as seen by the browser */
  supabasePublicUrl?: string
}

const parseUrl = (value: unknown) => {
  if (typeof value !== 'string') return undefined
  try {
    return new URL(value)
  } catch {
    return undefined
  }
}

const withQuery = (base: string, search: string) => {
  const query = search.slice(1)
  return query.length > 0 ? `${base}?${query}` : base
}

/**
 * Validates a URL submitted to the edge function test proxy and returns the URL the proxy should
 * fetch, rebuilt from the validated parts, or `undefined` if it isn't an edge function URL of a
 * Supabase project the proxy may call.
 */
export const getEdgeFunctionTestUrl = (
  url: unknown,
  { isPlatform, nimbusProjectsUrl, supabaseUrl, supabasePublicUrl }: EdgeFunctionTestUrlOptions
): string | undefined => {
  const parsed = parseUrl(url)
  if (parsed === undefined) return undefined
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return undefined
  if (parsed.username !== '' || parsed.password !== '') return undefined

  const { hostname, pathname, search } = parsed
  if (!EDGE_FUNCTION_PATHNAME.test(pathname)) return undefined

  if (!isPlatform) {
    const internalUrl = parseUrl(supabaseUrl)
    if (internalUrl === undefined) return undefined

    const isInternalHost = parsed.host === internalUrl.host
    const isPublicHost = parsed.host === parseUrl(supabasePublicUrl)?.host
    if (!isInternalHost && !isPublicHost) return undefined

    return withQuery(`${internalUrl.origin}${pathname}`, search)
  }

  if (parsed.protocol !== 'https:' || parsed.port !== '') return undefined

  if (nimbusProjectsUrl) {
    const apexDomain = parseUrl(nimbusProjectsUrl.replace('https://*.', 'https://'))?.hostname
    if (!apexDomain) return undefined

    const suffix = `.${apexDomain}`
    if (!hostname.endsWith(suffix)) return undefined

    const subdomain = hostname.slice(0, -suffix.length)
    if (!PROJECT_SUBDOMAIN.test(subdomain)) return undefined

    return withQuery(`https://${subdomain}.${apexDomain}${pathname}`, search)
  }

  if (!PLATFORM_EDGE_FUNCTION_HOSTNAME.test(hostname)) return undefined

  return withQuery(`https://${hostname}${pathname}`, search)
}
