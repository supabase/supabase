// Fetches user-supplied URLs only when they point at the public internet.
// Every request, including each redirect, is checked: http(s) only, no
// credentials in the URL, and no loopback, private, link-local or other
// reserved addresses (as IP literals or after resolving the hostname).
//
// Limitation: fetch() resolves the hostname again when it connects, and the
// Edge Runtime has no way to pin that connection to the address checked here.
// A host that changes its DNS answer between the two lookups (DNS rebinding)
// could still reach a private address, if the runtime's network allows it.

const MAX_REDIRECTS = 5

function ipv4Octets(address: string) {
  const parts = address.split('.')
  if (parts.length !== 4) return null
  const octets = parts.map((part) => (/^\d{1,3}$/.test(part) ? Number(part) : NaN))
  return octets.every((octet) => octet >= 0 && octet <= 255) ? octets : null
}

function isReservedIpv4(octets: number[]) {
  const [a, b, c] = octets
  return (
    a === 0 || // "this network" 0.0.0.0/8
    a === 10 || // private 10.0.0.0/8
    a === 127 || // loopback 127.0.0.0/8
    (a === 100 && b >= 64 && b <= 127) || // shared address space 100.64.0.0/10
    (a === 169 && b === 254) || // link-local 169.254.0.0/16
    (a === 172 && b >= 16 && b <= 31) || // private 172.16.0.0/12
    (a === 192 && b === 0 && (c === 0 || c === 2)) || // protocol 192.0.0.0/24, docs 192.0.2.0/24
    (a === 192 && b === 168) || // private 192.168.0.0/16
    (a === 198 && (b === 18 || b === 19)) || // benchmarking 198.18.0.0/15
    (a === 198 && b === 51 && c === 100) || // docs 198.51.100.0/24
    (a === 203 && b === 0 && c === 113) || // docs 203.0.113.0/24
    a >= 224 // multicast and reserved 224.0.0.0 and up
  )
}

/** The eight 16-bit groups of an IPv6 address, or null if it isn't one. */
function ipv6Groups(address: string) {
  let value = address.toLowerCase()
  // A trailing dotted IPv4 part (::ffff:1.2.3.4) becomes two hex groups.
  const dotted = value.match(/^(.*:)(\d+\.\d+\.\d+\.\d+)$/)
  if (dotted) {
    const octets = ipv4Octets(dotted[2])
    if (!octets) return null
    value = `${dotted[1]}${((octets[0] << 8) | octets[1]).toString(16)}:${((octets[2] << 8) | octets[3]).toString(16)}`
  }
  const halves = value.split('::')
  if (halves.length > 2) return null
  const head = halves[0] ? halves[0].split(':') : []
  const tail = halves.length === 2 && halves[1] ? halves[1].split(':') : []
  const missing = 8 - head.length - tail.length
  if (halves.length === 1 ? missing !== 0 : missing < 0) return null
  const groups = [...head, ...Array(halves.length === 2 ? missing : 0).fill('0'), ...tail]
  if (!groups.every((group) => /^[0-9a-f]{1,4}$/.test(group))) return null
  return groups.map((group) => parseInt(group, 16))
}

function isReservedIpv6(address: string) {
  const groups = ipv6Groups(address)
  if (!groups) return true // Unparseable: refuse rather than guess.
  const [first] = groups
  const embeddedIpv4 = [groups[6] >> 8, groups[6] & 255, groups[7] >> 8, groups[7] & 255]
  const isZero = (from: number, to: number) => groups.slice(from, to).every((group) => group === 0)

  // IPv4-mapped (::ffff:a.b.c.d), IPv4-compatible (::a.b.c.d) and NAT64
  // (64:ff9b::a.b.c.d) addresses reach the embedded IPv4 address.
  if (isZero(0, 5) && (groups[5] === 0xffff || groups[5] === 0)) {
    return isZero(0, 8) || (groups[5] === 0 && isZero(0, 7)) || isReservedIpv4(embeddedIpv4)
  }
  if (first === 0x64 && groups[1] === 0xff9b && isZero(2, 6)) return isReservedIpv4(embeddedIpv4)

  return (
    (first & 0xfe00) === 0xfc00 || // unique local fc00::/7
    (first & 0xffc0) === 0xfe80 || // link-local fe80::/10
    (first & 0xff00) === 0xff00 || // multicast ff00::/8
    first === 0x2001 && groups[1] === 0x0db8 // documentation 2001:db8::/32
  )
}

/** True for addresses that aren't on the public internet. */
export function isReservedAddress(address: string) {
  const octets = ipv4Octets(address)
  if (octets) return isReservedIpv4(octets)
  return address.includes(':') ? isReservedIpv6(address) : false
}

/**
 * Resolves a hostname's addresses. Fails closed: if the runtime can't resolve
 * names, a lookup fails, or resolution returns nothing, the URL is refused.
 */
async function resolve(hostname: string, signal?: AbortSignal | null) {
  if (typeof Deno.resolveDns !== 'function') {
    throw new Error('Could not verify the address of this URL')
  }
  const options = signal ? { signal } : undefined
  const results = await Promise.allSettled([
    Deno.resolveDns(hostname, 'A', options),
    Deno.resolveDns(hostname, 'AAAA', options),
  ])
  // If the caller's deadline passed, report that (a TimeoutError) instead.
  signal?.throwIfAborted()
  const addresses: string[] = []
  for (const result of results) {
    if (result.status === 'fulfilled') addresses.push(...result.value)
    // NotFound means there are no records of that type (many hosts have no
    // IPv6), which is fine. Any other lookup error could hide an address, so
    // refuse the URL.
    else if (!(result.reason instanceof Deno.errors.NotFound)) {
      throw new Error('Could not verify the address of this URL')
    }
  }
  if (addresses.length === 0) throw new Error('Could not verify the address of this URL')
  return addresses
}

/**
 * Throws if the URL isn't a public http(s) URL. `signal` cancels the DNS
 * lookups, so they count toward the caller's timeout.
 */
export async function assertPublicUrl(url: URL, signal?: AbortSignal | null) {
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new Error('Only http and https URLs are allowed')
  }
  if (url.username || url.password) throw new Error('URLs with credentials are not allowed')

  const hostname = url.hostname.replace(/^\[|\]$/g, '').toLowerCase()
  if (hostname === 'localhost' || /\.(localhost|local|internal)$/.test(hostname)) {
    throw new Error('Private hosts are not allowed')
  }
  const addresses = ipv4Octets(hostname) || hostname.includes(':') ? [hostname] : await resolve(hostname, signal)
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
    await assertPublicUrl(url, init.signal)
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
