import { IPv4CidrRange, IPv6CidrRange, Validator, collapseIPv6Number } from 'ip-num'

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

export const checkIfPrivate = (type: 'IPv4' | 'IPv6', cidr: string) => {
  try {
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
// https://github.com/supabase/infrastructure/blob/840c9596e8bf9e9090ec94de1756bd511e67393a/worker/src/tasks/db/add_as_pooler_tenant.ts#L176C15-L176C15
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
