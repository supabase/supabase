import { getMcpClientIconSrc } from 'ui-patterns/McpUrlBuilder'

export type TrustedOAuthPartner = {
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
    displayName: 'Claude',
    icon: 'claude',
    hasDistinctDarkIcon: false,
    redirectHosts: ['claude.ai', 'anthropic.com'],
  },
  {
    displayName: 'Cursor',
    icon: 'cursor',
    hasDistinctDarkIcon: true,
    redirectHosts: ['cursor.com', 'cursor.sh'],
  },
  {
    displayName: 'ChatGPT',
    icon: 'openai',
    hasDistinctDarkIcon: true,
    redirectHosts: ['chatgpt.com', 'openai.com'],
  },
  {
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
