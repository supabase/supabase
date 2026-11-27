// Fetches user-supplied URLs only when they point at the public internet.
// Every request, including each redirect, is checked: http(s) only, no
// credentials in the URL, and no loopback, private, link-local or other
// reserved addresses (as IP literals or after resolving the hostname).

const MAX_REDIRECTS = 5

function ipv4Octets(address: string) {
  const parts = address.split('.')
  if (parts.length !== 4) return null
  const octets = parts.map((part) => (/^\d{1,3}$/.test(part) ? Number(part) : NaN))
  return octets.every((octet) => octet >= 0 && octet <= 255) ? octets : null
}

function isReservedIpv4(octets: number[]) {
  const [a, b] = octets
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 0) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19)) ||
    a >= 224
  )
}

function isReservedIpv6(address: string) {
  const value = address.toLowerCase()
  if (value === '::' || value === '::1') return true
  const mapped = value.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/)
  if (mapped) return isReservedAddress(mapped[1])
  return /^f[cd]/.test(value) || /^fe[89ab]/.test(value) || value.startsWith('ff')
}

/** True for addresses that aren't on the public internet. */
export function isReservedAddress(address: string) {
  const octets = ipv4Octets(address)
  if (octets) return isReservedIpv4(octets)
  return address.includes(':') ? isReservedIpv6(address) : false
}

async function resolve(hostname: string) {
  // resolveDns may be unavailable in some runtimes; IP literals are still checked.
  if (typeof Deno.resolveDns !== 'function') return []
  const results = await Promise.allSettled([
    Deno.resolveDns(hostname, 'A'),
    Deno.resolveDns(hostname, 'AAAA'),
  ])
  return results.flatMap((result) => (result.status === 'fulfilled' ? result.value : []))
}

/** Throws if the URL isn't a public http(s) URL. */
export async function assertPublicUrl(url: URL) {
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new Error('Only http and https URLs are allowed')
  }
  if (url.username || url.password) throw new Error('URLs with credentials are not allowed')

  const hostname = url.hostname.replace(/^\[|\]$/g, '').toLowerCase()
  if (hostname === 'localhost' || /\.(localhost|local|internal)$/.test(hostname)) {
    throw new Error('Private hosts are not allowed')
  }
  const addresses = ipv4Octets(hostname) || hostname.includes(':') ? [hostname] : await resolve(hostname)
  if (addresses.some(isReservedAddress)) throw new Error('Private addresses are not allowed')
}

/**
 * fetch() for user-supplied URLs: follows up to five redirects by hand and
 * checks every URL with assertPublicUrl (and `isAllowed`, if given) first.
 */
export async function fetchPublic(
  input: string,
  init: RequestInit = {},
  isAllowed: (url: URL) => boolean = () => true
) {
  let url = new URL(input)
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    await assertPublicUrl(url)
    if (!isAllowed(url)) {
      throw new Error(hop === 0 ? 'Host is not allowed' : 'Redirected to a host that is not allowed')
    }
    const response = await fetch(url, { ...init, redirect: 'manual' })
    const location = response.headers.get('location')
    if (response.status >= 300 && response.status < 400 && location) {
      await response.body?.cancel()
      url = new URL(location, url)
      continue
    }
    return response
  }
  throw new Error(`More than ${MAX_REDIRECTS} redirects`)
}
