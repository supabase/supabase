import { describe, expect, it } from 'vitest'

import {
  checkIfPrivate,
  getAddressEndRange,
  isValidAddress,
  normalize,
} from '@/components/interfaces/Settings/Database/NetworkRestrictions/NetworkRestrictions.utils'

describe('isValidAddress', () => {
  it('accepts IPv4 and IPv6 addresses', () => {
    expect(isValidAddress('203.0.113.7')).toBe(true)
    expect(isValidAddress('10.0.0.1')).toBe(true)
    expect(isValidAddress('2001:db8::1')).toBe(true)
    expect(isValidAddress('fd00::1')).toBe(true)
  })

  it('rejects CIDR blocks, since only the address is validated', () => {
    expect(isValidAddress('10.0.0.0/8')).toBe(false)
    expect(isValidAddress('fd00::/7')).toBe(false)
  })

  it('rejects values that are not IP addresses', () => {
    expect(isValidAddress('')).toBe(false)
    expect(isValidAddress('example.com')).toBe(false)
    expect(isValidAddress('256.1.1.1')).toBe(false)
  })
})

describe('checkIfPrivate', () => {
  it('returns false when the address type is unknown', () => {
    expect(checkIfPrivate(undefined, '10.1.2.3')).toBe(false)
  })

  it.each(['10.1.2.3', '172.16.0.1', '172.31.255.254', '192.168.1.1'])(
    'treats IPv4 %s as private',
    (address) => {
      expect(checkIfPrivate('IPv4', address)).toBe(true)
    }
  )

  it.each(['8.8.8.8', '172.32.0.1', '192.169.0.1'])('treats IPv4 %s as public', (address) => {
    expect(checkIfPrivate('IPv4', address)).toBe(false)
  })

  it.each(['fd00::1', 'fc00::1'])('treats IPv6 %s as private', (address) => {
    expect(checkIfPrivate('IPv6', address)).toBe(true)
  })

  it('treats a public IPv6 address as public', () => {
    expect(checkIfPrivate('IPv6', '2001:4860:4860::8888')).toBe(false)
  })

  it('returns false for input that cannot be parsed', () => {
    expect(checkIfPrivate('IPv4', 'not-an-ip')).toBe(false)
    expect(checkIfPrivate('IPv6', 'not-an-ip')).toBe(false)
  })
})

describe('getAddressEndRange', () => {
  it('returns the first and last IPv4 addresses in a CIDR block', () => {
    expect(getAddressEndRange('IPv4', '10.0.0.0/30')).toEqual({
      start: '10.0.0.0',
      end: '10.0.0.3',
    })
  })

  it('returns the first and last IPv6 addresses in a CIDR block, fully expanded', () => {
    expect(getAddressEndRange('IPv6', 'fd00::/120')).toEqual({
      start: 'fd00:0000:0000:0000:0000:0000:0000:0000',
      end: 'fd00:0000:0000:0000:0000:0000:0000:00ff',
    })
  })

  it('returns undefined for an invalid CIDR block', () => {
    expect(getAddressEndRange('IPv4', 'not-a-cidr')).toBeUndefined()
    expect(getAddressEndRange('IPv6', 'not-a-cidr')).toBeUndefined()
  })
})

describe('normalize', () => {
  it('replaces host bits with the network address for IPv4', () => {
    expect(normalize('10.0.0.5/8')).toBe('10.0.0.0/8')
  })

  it('keeps a single-host IPv4 CIDR unchanged', () => {
    expect(normalize('203.0.113.7/32')).toBe('203.0.113.7/32')
  })

  it('collapses an IPv6 network address', () => {
    expect(normalize('fd00::1/64')).toBe('fd00::/64')
  })

  it('collapses a fully expanded IPv6 address', () => {
    expect(normalize('2001:0db8:0000:0000:0000:0000:0000:0001/128')).toBe('2001:db8::1/128')
  })
})
