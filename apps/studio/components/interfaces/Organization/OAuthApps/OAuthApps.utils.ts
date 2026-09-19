import { getMcpClientIconSrc } from 'ui-patterns/McpUrlBuilder'

export type TrustedOAuthPartner = {
  /** Substrings matched against the requester name (case-insensitive). */
  nameMatchers: readonly string[]
  displayName: string
  icon: string
  hasDistinctDarkIcon: boolean
  /** Exact host or parent host for redirect_uri (subdomains allowed). */
  redirectHosts: readonly string[]
}

/**
 * High-traffic MCP / OAuth partners with curated Connect logos.
 * Logos resolve from allowlisted redirect_uri hosts, or from a trusted name when
 * redirect_uri is localhost / loopback (common for local MCP clients).
 * Never from self-asserted name alone on a remote host.
 */
export const TRUSTED_OAUTH_PARTNERS: readonly TrustedOAuthPartner[] = [
  {
    nameMatchers: ['claude'],
    displayName: 'Claude',
    icon: 'claude',
    hasDistinctDarkIcon: false,
    redirectHosts: ['claude.ai', 'anthropic.com'],
  },
  {
    nameMatchers: ['cursor'],
    displayName: 'Cursor',
    icon: 'cursor',
    hasDistinctDarkIcon: true,
    redirectHosts: ['cursor.com', 'cursor.sh'],
  },
  {
    nameMatchers: ['chatgpt', 'openai'],
    displayName: 'ChatGPT',
    icon: 'openai',
    hasDistinctDarkIcon: true,
    redirectHosts: ['chatgpt.com', 'openai.com'],
  },
  {
    nameMatchers: ['perplexity'],
    displayName: 'Perplexity',
    icon: 'perplexity',
    hasDistinctDarkIcon: true,
    redirectHosts: ['perplexity.ai'],
  },
]

const LOCAL_REDIRECT_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]', '::1'])

export function getRedirectHostname(redirectUri: string | null | undefined): string | null {
  if (!redirectUri) return null
  try {
    const { hostname } = new URL(redirectUri)
    return hostname.toLowerCase() || null
  } catch {
    return null
  }
}

export function isLocalRedirectHost(hostname: string | null | undefined): boolean {
  if (!hostname) return false
  const host = hostname.toLowerCase()
  return LOCAL_REDIRECT_HOSTS.has(host) || host.endsWith('.localhost')
}

export function hostMatchesAllowlist(hostname: string, allowedHosts: readonly string[]): boolean {
  const host = hostname.toLowerCase()
  return allowedHosts.some((allowed) => {
    const entry = allowed.toLowerCase()
    return host === entry || host.endsWith(`.${entry}`)
  })
}

export function findTrustedPartnerByRedirectUri(
  redirectUri: string | null | undefined
): TrustedOAuthPartner | null {
  const hostname = getRedirectHostname(redirectUri)
  if (!hostname || isLocalRedirectHost(hostname)) return null

  return (
    TRUSTED_OAUTH_PARTNERS.find((partner) =>
      hostMatchesAllowlist(hostname, partner.redirectHosts)
    ) ?? null
  )
}

export function findTrustedPartnerByName(
  name: string | null | undefined
): TrustedOAuthPartner | null {
  if (!name) return null

  const searchable = name.toLowerCase()
  return (
    TRUSTED_OAUTH_PARTNERS.find((partner) =>
      partner.nameMatchers.some((matcher) => searchable.includes(matcher))
    ) ?? null
  )
}

function curatedLogoForPartner(
  partner: TrustedOAuthPartner,
  useDarkVariant: boolean
): { src: string; isKnownClient: boolean } | null {
  const customLogoUrl = getMcpClientIconSrc({
    icon: partner.icon,
    useDarkVariant,
    hasDistinctDarkIcon: partner.hasDistinctDarkIcon,
  })
  if (!customLogoUrl) return null
  return { src: customLogoUrl, isKnownClient: true }
}

export function getRequesterLogo({
  icon,
  name,
  redirectUri,
  useDarkVariant,
}: {
  icon: string | null
  name?: string | null
  redirectUri: string | null | undefined
  useDarkVariant: boolean
}): { src: string; isKnownClient: boolean } {
  const byRedirect = findTrustedPartnerByRedirectUri(redirectUri)
  if (byRedirect) {
    const curated = curatedLogoForPartner(byRedirect, useDarkVariant)
    if (curated) return curated
  }

  // Local MCP clients (Claude Desktop, Cursor, etc.) use loopback redirects.
  // Name match is enough there — remote hosts still require the allowlist.
  const hostname = getRedirectHostname(redirectUri)
  if (hostname && isLocalRedirectHost(hostname) && name) {
    const byName = findTrustedPartnerByName(name)
    if (byName) {
      const curated = curatedLogoForPartner(byName, useDarkVariant)
      if (curated) return curated
    }
  }

  return { src: icon || '', isKnownClient: false }
}

export type OAuthImpersonationWarning = {
  /** Trusted partner label used in the caution copy. */
  brandDisplayName: string
  redirectHost: string
}

/**
 * Warn when the requester name looks like a known partner but redirect_uri is a
 * remote host outside that partner's allowlist. Localhost redirects are skipped
 * (common for local MCP clients). Missing or malformed redirect URIs are skipped.
 */
export function getOAuthImpersonationWarning({
  name,
  redirectUri,
}: {
  name: string | null | undefined
  redirectUri: string | null | undefined
}): OAuthImpersonationWarning | null {
  const namedPartner = findTrustedPartnerByName(name)
  if (!namedPartner) return null

  const hostname = getRedirectHostname(redirectUri)
  if (!hostname || isLocalRedirectHost(hostname)) return null

  if (hostMatchesAllowlist(hostname, namedPartner.redirectHosts)) {
    return null
  }

  return {
    brandDisplayName: namedPartner.displayName,
    redirectHost: hostname,
  }
}

type SortOrder = 'asc' | 'desc'

export const parseSort = <C extends string>(sort: string): [C, SortOrder] => {
  return sort.split(':') as [C, SortOrder]
}

export const toggleSort = <S extends string>(
  currentSort: S,
  column: string,
  setSort: (sort: S) => void
) => {
  const [currentColumn, currentOrder] = parseSort(currentSort)
  if (currentColumn === column) {
    setSort(`${column}:${currentOrder === 'asc' ? 'desc' : 'asc'}` as S)
  } else {
    setSort(`${column}:asc` as S)
  }
}
