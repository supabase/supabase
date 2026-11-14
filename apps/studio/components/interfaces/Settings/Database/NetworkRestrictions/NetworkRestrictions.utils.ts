import { collapseIPv6Number, IPv4CidrRange, IPv6, IPv6CidrRange, Validator } from 'ip-num'

const privateIPv4Ranges = [
  IPv4CidrRange.fromCidr('10.0.0.0/8'),
  IPv4CidrRange.fromCidr('172.16.0.0/12'),
  IPv4CidrRange.fromCidr('192.168.0.0/16'),
]

const privateIPv6Ranges = [IPv6CidrRange.fromCidr('fc00::/7')]

export const isValidAddress = (address: string) => {
  // Only validating address, should not include cidr block size
  if (address.includes('/')) return false
  const [isIpv4] = Validator.isValidIPv4String(address)
  const [isIpv6] = Validator.isValidIPv6String(address)
  return isIpv4 || isIpv6
}

export const checkIfPrivate = (type: 'IPv4' | 'IPv6' | undefined, cidr: string) => {
  try {
    if (type === undefined) return false
    if (type === 'IPv4') {
      const address = IPv4CidrRange.fromCidr(`${cidr}/32`)
      const res = privateIPv4Ranges.map((range) => address.inside(range))
      return res.includes(true)
    } else {
      const address = IPv6CidrRange.fromCidr(`${cidr}/128`)
      const res = privateIPv6Ranges.map((range) => address.inside(range))
      return res.includes(true)
    }
  } catch (error) {
    return false
  }
}

const padHexadecimal = (str: string) => `${'0'.repeat(4 - str.length)}${str}`

export const getAddressEndRange = (type: 'IPv4' | 'IPv6', address: string) => {
  if (type === 'IPv4') {
    try {
      const cidr = IPv4CidrRange.fromCidr(address)
      const start = cidr.getFirst().octets.join('.')
      const end = cidr.getLast().octets.join('.')
      return { start, end }
    } catch (error: any) {
      return undefined
    }
  } else {
    try {
      const cidr = IPv6CidrRange.fromCidr(address)
      const start = cidr.getFirst().hexadecatet.toString().split(',').map(padHexadecimal).join(':')
      const end = cidr.getLast().hexadecatet.toString().split(',').map(padHexadecimal).join(':')
      return { start, end }
    } catch (error: any) {
      return undefined
    }
  }
}

// [Joshen] Using same logic as worker
// https://github.com/supabase/platform/blob/840c9596e8bf9e9090ec94de1756bd511e67393a/worker/src/tasks/db/add_as_pooler_tenant.ts#L176C15-L176C15
export const normalize = (address: string) => {
  const [isIpV4] = Validator.isValidIPv4String(address.split('/')[0])
  if (isIpV4) {
    const cidr = IPv4CidrRange.fromCidr(address)
    const base = cidr.getFirst().toString()
    const mask = cidr.getPrefix().toString()
    return `${base}/${mask}`
  } else {
    const cidr = IPv6CidrRange.fromCidr(address)
    const base = collapseIPv6Number(cidr.getFirst().toString())
    const mask = cidr.getPrefix().toString()
    return `${base}/${mask}`
  }
}

const APPLY_TIMEOUT_MS = 10 * 60 * 1000

// A list written by the review endpoint or PATCH stays stored until a worker job applies it, which normally takes
// seconds. One still stored after the timeout, or written without an updated_at, as POST did, didn't apply.
export const isApplyingRestrictions = (
  { status, updated_at }: { status?: string; updated_at?: string },
  now = Date.now()
) =>
  status === 'stored' && updated_at !== undefined && now - Date.parse(updated_at) < APPLY_TIMEOUT_MS

export type RestrictionIssue = { message: string; suggestion?: string }

const DOTTED_IPV4_TAIL = /^(.*:)(\d{1,3}(?:\.\d{1,3}){3})$/

const isValidRange = (entry: string) =>
  Validator.isValidIPv4CidrRange(entry)[0] || Validator.isValidIPv6CidrRange(entry)[0]

// The API compares entries as networks, so one range spelled two ways matches. An entry that isn't a valid range only
// matches itself.
export const getNetworkKey = (entry: string) => (isValidRange(entry) ? normalize(entry) : entry)

// The address's eight 16-bit groups, reading a dotted IPv4 tail (::ffff:1.2.3.4) as the last two
const getIPv6Groups = (address: string) => {
  const dotted = DOTTED_IPV4_TAIL.exec(address)
  let hexAddress = address
  if (dotted !== null) {
    const [, head, ipv4] = dotted
    if (!Validator.isValidIPv4String(ipv4)[0]) return undefined
    const [a, b, c, d] = ipv4.split('.').map(Number)
    hexAddress = `${head}${((a << 8) | b).toString(16)}:${((c << 8) | d).toString(16)}`
  }
  if (!Validator.isValidIPv6String(hexAddress)[0]) return undefined
  return IPv6.fromString(hexAddress)
    .getHexadecatet()
    .map((group) => group.getValue())
}

// The IPv4 address embedded in an IPv4-mapped IPv6 address (::ffff:0:0/96), however the address is spelled
export const getMappedIPv4 = (address: string) => {
  const groups = getIPv6Groups(address)
  if (groups === undefined) return undefined
  const isMapped = groups.slice(0, 5).every((group) => group === 0) && groups[5] === 0xffff
  if (!isMapped) return undefined
  const [high, low] = groups.slice(6)
  return [high >> 8, high & 0xff, low >> 8, low & 0xff].join('.')
}

export const isIPv4MappedIPv6 = (address: string) => getMappedIPv4(address) !== undefined

// Why the API refuses to store an entry, with the range it most likely meant. Mirrors the API's validation.
export const getRestrictionIssue = (entry: string): RestrictionIssue | undefined => {
  // Everything after the first slash is the prefix, so an extra slash (1.2.3.4/24/5) makes it invalid
  const [address, ...prefixParts] = entry.split('/')
  const prefix = prefixParts.length > 0 ? prefixParts.join('/') : undefined
  const hasNumericPrefix = prefix !== undefined && /^\d+$/.test(prefix)
  const prefixLength = Number(prefix)

  const ipv4 = getMappedIPv4(address)
  if (ipv4 !== undefined) {
    // A prefix below /96 also covers addresses that aren't mapped, so no IPv4 range matches it
    const ipv4Prefix = hasNumericPrefix && prefixLength <= 128 ? prefixLength - 96 : 32
    return {
      message: "IPv4-mapped IPv6 addresses aren't supported",
      suggestion: ipv4Prefix < 0 ? undefined : normalize(`${ipv4}/${ipv4Prefix}`),
    }
  }
  if (isValidRange(entry)) return undefined

  const isIPv4 = Validator.isValidIPv4String(address)[0]
  const isIPv6 = Validator.isValidIPv6String(address)[0]
  if (!isIPv4 && !isIPv6) return { message: 'Not a valid IP address' }

  const maxPrefixLength = isIPv4 ? 32 : 128
  if (!hasNumericPrefix || prefixLength > maxPrefixLength) {
    return {
      message: `Prefix length must be between 0 and ${maxPrefixLength}`,
      suggestion: `${address}/${maxPrefixLength}`,
    }
  }
  // Rebuilt from the parsed length, as ip-num refuses a zero-padded IPv6 prefix such as /064
  return {
    message: "The address isn't the start of its range",
    suggestion: normalize(`${address}/${prefixLength}`),
  }
}

// The issue with each entry of a list, aligned with it. An entry that repeats an earlier one's network is an issue too:
// the API can't store both.
export const getRestrictionIssues = (entries: string[]) => {
  const firstEntryByNetwork = new Map<string, string>()
  return entries.map((entry): RestrictionIssue | undefined => {
    const issue = getRestrictionIssue(entry)
    if (issue !== undefined) return issue

    const key = getNetworkKey(entry)
    const firstEntry = firstEntryByNetwork.get(key)
    if (firstEntry !== undefined) return { message: `Duplicates ${firstEntry}` }
    firstEntryByNetwork.set(key, entry)
    return undefined
  })
}

export type RestrictionChange = 'adding' | 'removing' | 'unchanged'

export type ReviewedRestriction = {
  entry: string
  change: RestrictionChange
  issue?: RestrictionIssue
}

// The enforced entries, marking those the pending list drops, followed by the entries the pending list adds. Each
// entry's issue comes from its position in its own list, so only the second of two identical entries is a duplicate.
export const getRestrictionsDiff = (enforced: string[], pending: string[]) => {
  const enforcedKeys = new Set(enforced.map(getNetworkKey))
  const pendingKeys = new Set(pending.map(getNetworkKey))
  const enforcedIssues = getRestrictionIssues(enforced)
  const pendingIssues = getRestrictionIssues(pending)
  return [
    ...enforced.map(
      (entry, index): ReviewedRestriction => ({
        entry,
        change: pendingKeys.has(getNetworkKey(entry)) ? 'unchanged' : 'removing',
        issue: enforcedIssues[index],
      })
    ),
    ...pending.flatMap((entry, index): ReviewedRestriction[] =>
      enforcedKeys.has(getNetworkKey(entry))
        ? []
        : [{ entry, change: 'adding', issue: pendingIssues[index] }]
    ),
  ]
}

export type RestrictionCorrection = { entry: string; replacement?: string }

// Replaces each entry that has an issue with its suggestion, and drops the entries that have none or repeat a network.
// Valid entries are kept first, so a correction never displaces one. An IPv4-mapped entry moves to the IPv4 list.
export const getCorrectedRestrictions = ({ ipv4, ipv6 }: { ipv4: string[]; ipv6: string[] }) => {
  const dbAllowedCidrs: string[] = []
  const dbAllowedCidrsV6: string[] = []
  const corrections: RestrictionCorrection[] = []
  const keys = new Set<string>()

  const keep = (entry: string) => {
    const key = getNetworkKey(entry)
    if (keys.has(key)) return false
    keys.add(key)
    if (entry.includes(':')) dbAllowedCidrsV6.push(entry)
    else dbAllowedCidrs.push(entry)
    return true
  }

  const entries = [...ipv4, ...ipv6].map((entry) => ({ entry, issue: getRestrictionIssue(entry) }))
  for (const { entry, issue } of entries) {
    if (issue === undefined && !keep(entry)) corrections.push({ entry })
  }
  for (const { entry, issue } of entries) {
    if (issue === undefined) continue
    if (issue.suggestion !== undefined && keep(issue.suggestion)) {
      corrections.push({ entry, replacement: issue.suggestion })
    } else {
      corrections.push({ entry })
    }
  }

  return { dbAllowedCidrs, dbAllowedCidrsV6, corrections }
}
