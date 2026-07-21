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
 * Logos resolve from redirect_uri host only — never from self-asserted name/website.
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

export function findTrustedPartnerByName(name: string): TrustedOAuthPartner | null {
  const searchable = name.toLowerCase()
  return (
    TRUSTED_OAUTH_PARTNERS.find((partner) =>
      partner.nameMatchers.some((matcher) => searchable.includes(matcher))
    ) ?? null
  )
}

export function getRequesterLogo({
  icon,
  redirectUri,
  useDarkVariant,
}: {
  icon: string | null
  redirectUri: string | null | undefined
  useDarkVariant: boolean
}): { src: string; isKnownClient: boolean } {
  const trusted = findTrustedPartnerByRedirectUri(redirectUri)
  if (trusted) {
    const customLogoUrl = getMcpClientIconSrc({
      icon: trusted.icon,
      useDarkVariant,
      hasDistinctDarkIcon: trusted.hasDistinctDarkIcon,
    })
    if (customLogoUrl) return { src: customLogoUrl, isKnownClient: true }
  }

  return { src: icon || '', isKnownClient: false }
}

export type OAuthImpersonationWarning = {
  brandDisplayName: string
  redirectHost: string
}

/**
 * Warn when the requester name looks like a known partner but redirect_uri is a
 * remote host outside that partner's allowlist. Localhost redirects are skipped
 * (common for local MCP clients).
 */
export function getOAuthImpersonationWarning({
  name,
  redirectUri,
}: {
  name: string
  redirectUri: string | null | undefined
}): OAuthImpersonationWarning | null {
  const namedPartner = findTrustedPartnerByName(name)
  if (!namedPartner) return null

  const hostname = getRedirectHostname(redirectUri)
  if (isLocalRedirectHost(hostname)) return null

  if (hostname && hostMatchesAllowlist(hostname, namedPartner.redirectHosts)) {
    return null
  }

  return {
    brandDisplayName: namedPartner.displayName,
    redirectHost: hostname ?? 'an unexpected address',
  }
}
