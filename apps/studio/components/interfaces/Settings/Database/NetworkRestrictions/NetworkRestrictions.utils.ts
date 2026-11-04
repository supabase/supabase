import { collapseIPv6Number, IPv4CidrRange, IPv6CidrRange, Validator } from 'ip-num'

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

const IPV4_MAPPED_IPV6_PREFIX = /^::ffff:/i

const isValidRange = (entry: string) =>
  Validator.isValidIPv4CidrRange(entry)[0] || Validator.isValidIPv6CidrRange(entry)[0]

// The API compares entries as networks, so one range spelled two ways matches. An entry that isn't a valid range only
// matches itself.
export const getNetworkKey = (entry: string) => (isValidRange(entry) ? normalize(entry) : entry)

export const isIPv4MappedIPv6 = (address: string) => IPV4_MAPPED_IPV6_PREFIX.test(address)

// The IPv4 address embedded in an IPv4-mapped IPv6 address, in dotted (::ffff:1.2.3.4) or hex (::ffff:102:304) form
export const getMappedIPv4 = (address: string) => {
  const embedded = address.replace(IPV4_MAPPED_IPV6_PREFIX, '')
  if (Validator.isValidIPv4String(embedded)[0]) return embedded

  const groups = embedded.split(':')
  if (groups.length !== 2 || !groups.every((group) => /^[0-9a-f]{1,4}$/i.test(group)))
    return undefined
  const bytes =
    groups
      .map((group) => group.padStart(4, '0'))
      .join('')
      .match(/../g) ?? []
  return bytes.map((byte) => parseInt(byte, 16)).join('.')
}

// Why the API refuses to store an entry, with the range it most likely meant. Mirrors the API's validation.
export const getRestrictionIssue = (entry: string): RestrictionIssue | undefined => {
  const [address, prefix] = entry.split('/')
  const hasNumericPrefix = prefix !== undefined && /^\d+$/.test(prefix)
  const prefixLength = Number(prefix)

  if (isIPv4MappedIPv6(address)) {
    const ipv4 = getMappedIPv4(address)
    const ipv4Prefix =
      hasNumericPrefix && prefixLength >= 96 && prefixLength <= 128 ? prefixLength - 96 : 32
    return {
      message: "IPv4-mapped IPv6 addresses aren't supported",
      suggestion: ipv4 === undefined ? undefined : normalize(`${ipv4}/${ipv4Prefix}`),
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
  return { message: "The address isn't the start of its range", suggestion: normalize(entry) }
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

export type ReviewedRestriction = { entry: string; change: RestrictionChange }

// The enforced entries, marking those the pending list drops, followed by the entries the pending list adds
export const getRestrictionsDiff = (enforced: string[], pending: string[]) => {
  const enforcedKeys = new Set(enforced.map(getNetworkKey))
  const pendingKeys = new Set(pending.map(getNetworkKey))
  return [
    ...enforced.map(
      (entry): ReviewedRestriction => ({
        entry,
        change: pendingKeys.has(getNetworkKey(entry)) ? 'unchanged' : 'removing',
      })
    ),
    ...pending
      .filter((entry) => !enforcedKeys.has(getNetworkKey(entry)))
      .map((entry): ReviewedRestriction => ({ entry, change: 'adding' })),
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
