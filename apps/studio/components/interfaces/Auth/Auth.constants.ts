// Regex from: https://stackoverflow.com/a/68002755/4807782
// modified to accept numbers in the body of domain though
// examples of matches:
//  "vercel.com"
//  "www.vercel.com"
//  "uptime-monitor-fe.vercel.app"
//  "https://uptime-monitor-fe.vercel.app/"

// Supports wildcards, port numbers at the end, paths at the end and query params
const baseUrlRegex =
  /^((ftp|http|https):\/\/)?(www.)?(?!.*(ftp|http|https|www.))[a-zA-Z0-9_*-]+(\.[a-zA-Z0-9_*-]+)+((\/)[\w#]+)*(\/\w+\?[a-zA-Z0-9_]+=\w+(&[a-zA-Z0-9_]+=\w+)*)+(?:\.[a-z]+)*(?::\d+)?(?![^<]*(?:<\/\w+>|\/?>))(.*)?\/?(.)*?$/gm

// iOS deep linking scheme https://benoitpasquier.com/deep-linking-url-scheme-ios/
const appRegex =
  /^[a-z0-9-]+([.][a-z0-9]+)*:\/(\/[-a-z0-9._~!$&'()*+,;=:@%]+)+(?:\.[a-z]+)*(?::\d+)?(?![^<]*(?:<\/\w+>|\/?>))(.*)?\/?(.)*?$/i

// Regex from https://stackoverflow.com/a/18696953/4807782
const localhostRegex =
  /^(?:^|\s)((https?:\/\/)?(?:localhost|[\w-]+(?:\.[\w-]+)+)(:\d+)?([/?#]\S*)?)/i

// "chrome-extension://<extension-id>"
const chromeExtensionRegex = /chrome-extension:\/\/([a-zA-Z]*)/gm

// New regex for custom scheme URLs
const customSchemeRegex = /^([a-zA-Z][a-zA-Z0-9+.-]*):(?:\/{1,3})?([a-zA-Z0-9_.-]*)$/

// Exclude simple domain names without protocol
const excludeSimpleDomainRegex = /^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}$/

const invalidUrlCharacterRegex = /[\s\\]/

// combine the above regexes, with optional exclusion of options
// usage: urlRegex() or urlRegex({ excludeSimpleDomains: false })
export function urlRegex(
  options: { excludeSimpleDomains?: boolean } = { excludeSimpleDomains: true }
): RegExp {
  const { excludeSimpleDomains } = options
  const excludeSimpleDomainPart = excludeSimpleDomains
    ? `(?!${excludeSimpleDomainRegex.source})`
    : ''

  // anchored so a valid prefix can't carry trailing input, e.g. `http://localhost:3000\`
  return new RegExp(
    `^(?!.*${invalidUrlCharacterRegex.source})${excludeSimpleDomainPart}((${baseUrlRegex.source})|(${localhostRegex.source})|(${appRegex.source})|(${chromeExtensionRegex.source})|(${customSchemeRegex.source}))$`,
    'i'
  )
}

export function getUrlCharacterError(url: string, label = 'URL'): string | undefined {
  const hasWhitespace = /\s/.test(url)
  if (hasWhitespace) {
    return `${label} can't contain spaces`
  }

  const hasBackslash = url.includes('\\')
  if (hasBackslash) {
    return `${label} can't contain backslashes`
  }

  return undefined
}

const INVALID_SITE_URL_MESSAGE = 'Please provide a valid URL, such as https://example.com'

const UNSAFE_SITE_URL_PROTOCOLS = ['javascript:', 'data:', 'file:', 'vbscript:']

export function getSiteUrlError(url: string): string | undefined {
  const characterError = getUrlCharacterError(url, 'Site URL')
  if (characterError) {
    return characterError
  }

  const hasWildcard = url.includes('*')
  if (hasWildcard) {
    return "Site URL can't contain wildcards"
  }

  const isParsable = URL.canParse(url)
  if (!isParsable) {
    return INVALID_SITE_URL_MESSAGE
  }

  const { protocol, hostname } = new URL(url)
  const isUnsafeProtocol = UNSAFE_SITE_URL_PROTOCOLS.includes(protocol)
  if (isUnsafeProtocol) {
    return `Site URL can't use the ${protocol} protocol`
  }

  // `localhost:3000` parses with `localhost:` as its scheme, so require `scheme://`
  const hasAuthority = url.slice(protocol.length).startsWith('//')
  const isWebUrl = protocol === 'http:' || protocol === 'https:'
  const isMissingHost = !hasAuthority || (isWebUrl && hostname.length === 0)
  if (isMissingHost) {
    return INVALID_SITE_URL_MESSAGE
  }

  return undefined
}

export function normalizeRedirectUrl(url: string): string {
  return url.trim().replace(/\s*,\s*$/, '')
}

export function parseRedirectUrls(allowList?: string | null): string[] {
  if (!allowList) return []

  return Array.from(
    new Set(
      allowList
        .split(',')
        .map(normalizeRedirectUrl)
        .filter((url) => url.length > 0)
    )
  )
}

// Use a const string to represent no chars option. Represented as empty string on the backend side.
export const NO_REQUIRED_CHARACTERS = 'NO_REQUIRED_CHARS'
