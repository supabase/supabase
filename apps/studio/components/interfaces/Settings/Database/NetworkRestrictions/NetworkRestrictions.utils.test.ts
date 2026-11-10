import { describe, expect, test } from 'vitest'

import {
  getCorrectedRestrictions,
  getMappedIPv4,
  getNetworkKey,
  getRestrictionIssue,
  getRestrictionIssues,
  getRestrictionsDiff,
  isApplyingRestrictions,
} from './NetworkRestrictions.utils'

describe('isApplyingRestrictions', () => {
  const now = Date.parse('2026-01-01T12:00:00Z')

  test('treats a list stored in the last few minutes as applying', () => {
    expect(
      isApplyingRestrictions({ status: 'stored', updated_at: '2026-01-01T11:58:00Z' }, now)
    ).toBe(true)
  })

  test('treats a list stored long ago, or without updated_at, as not applied', () => {
    expect(
      isApplyingRestrictions({ status: 'stored', updated_at: '2026-01-01T11:00:00Z' }, now)
    ).toBe(false)
    expect(isApplyingRestrictions({ status: 'stored' }, now)).toBe(false)
  })

  test('treats an applied list as applied', () => {
    expect(
      isApplyingRestrictions({ status: 'applied', updated_at: '2026-01-01T11:59:00Z' }, now)
    ).toBe(false)
  })
})

describe('getRestrictionIssue', () => {
  test('accepts valid IPv4 and IPv6 ranges', () => {
    expect(getRestrictionIssue('203.0.113.0/24')).toBeUndefined()
    expect(getRestrictionIssue('2001:db8::/32')).toBeUndefined()
    expect(getRestrictionIssue('2001:DB8::/32')).toBeUndefined()
  })

  test('suggests the start of the range for an address with host bits set', () => {
    expect(getRestrictionIssue('1.209.170.63/25')).toEqual({
      message: "The address isn't the start of its range",
      suggestion: '1.209.170.0/25',
    })
  })

  test('suggests a single address for a missing or invalid prefix length', () => {
    expect(getRestrictionIssue('127.0.0.1/undefined')).toEqual({
      message: 'Prefix length must be between 0 and 32',
      suggestion: '127.0.0.1/32',
    })
    expect(getRestrictionIssue('127.0.0.1')?.suggestion).toBe('127.0.0.1/32')
    expect(getRestrictionIssue('2001:db8::1/129')?.suggestion).toBe('2001:db8::1/128')
  })

  test('suggests the IPv4 range for an IPv4-mapped IPv6 range', () => {
    expect(getRestrictionIssue('::ffff:102:304/128')).toEqual({
      message: "IPv4-mapped IPv6 addresses aren't supported",
      suggestion: '1.2.3.4/32',
    })
    expect(getRestrictionIssue('::ffff:72.62.177.61/128')?.suggestion).toBe('72.62.177.61/32')
    expect(getRestrictionIssue('::ffff:1.2.3.4/120')?.suggestion).toBe('1.2.3.0/24')
    expect(getRestrictionIssue('0:0:0:0:0:ffff:c000:0201/128')?.suggestion).toBe('192.0.2.1/32')
  })

  test('has no suggestion for an IPv4-mapped prefix shorter than /96', () => {
    expect(getRestrictionIssue('::ffff:102:304/80')).toEqual({
      message: "IPv4-mapped IPv6 addresses aren't supported",
    })
  })

  test('handles malformed prefixes without throwing', () => {
    expect(getRestrictionIssue('1.2.3.4/24/5')).toEqual({
      message: 'Prefix length must be between 0 and 32',
      suggestion: '1.2.3.4/32',
    })
    expect(getRestrictionIssue('2001:db8::1/064')).toEqual({
      message: "The address isn't the start of its range",
      suggestion: '2001:db8::/64',
    })
  })

  test('has no suggestion for something that is not an IP address', () => {
    expect(getRestrictionIssue('not-an-address/32')).toEqual({ message: 'Not a valid IP address' })
  })
})

describe('getMappedIPv4', () => {
  test('reads the embedded IPv4 address however the address is spelled', () => {
    expect(getMappedIPv4('::ffff:1.2.3.4')).toBe('1.2.3.4')
    expect(getMappedIPv4('::ffff:102:304')).toBe('1.2.3.4')
    expect(getMappedIPv4('::FFFF:102:304')).toBe('1.2.3.4')
    expect(getMappedIPv4('0:0:0:0:0:ffff:c000:0201')).toBe('192.0.2.1')
    expect(getMappedIPv4('0:0:0:0:0:ffff:192.0.2.1')).toBe('192.0.2.1')
  })

  test('ignores addresses that are not IPv4-mapped', () => {
    expect(getMappedIPv4('::ffff:zz')).toBeUndefined()
    expect(getMappedIPv4('2001:db8::1')).toBeUndefined()
    expect(getMappedIPv4('::1.2.3.4')).toBeUndefined()
    expect(getMappedIPv4('::ffff:1.2.3.999')).toBeUndefined()
  })
})

describe('getNetworkKey', () => {
  test('matches one range spelled two ways', () => {
    expect(getNetworkKey('2001:DB8:0:0::/32')).toBe(getNetworkKey('2001:db8::/32'))
  })

  test('keeps an entry that is not a valid range as it is', () => {
    expect(getNetworkKey('1.209.170.63/25')).toBe('1.209.170.63/25')
  })
})

describe('getRestrictionIssues', () => {
  test('flags an entry that repeats an earlier network', () => {
    expect(getRestrictionIssues(['203.0.113.0/24', '2001:db8::/32', '2001:DB8:0::/32'])).toEqual([
      undefined,
      undefined,
      { message: 'Duplicates 2001:db8::/32' },
    ])
  })
})

describe('getRestrictionsDiff', () => {
  test('marks the entries the pending list removes and adds', () => {
    expect(getRestrictionsDiff(['1.1.1.1/32', '2.2.2.2/32'], ['2.2.2.2/32', '3.3.3.3/32'])).toEqual(
      [
        { entry: '1.1.1.1/32', change: 'removing' },
        { entry: '2.2.2.2/32', change: 'unchanged' },
        { entry: '3.3.3.3/32', change: 'adding' },
      ]
    )
  })

  test('treats one network spelled two ways as unchanged', () => {
    expect(getRestrictionsDiff(['2001:db8::/32'], ['2001:DB8::/32'])).toEqual([
      { entry: '2001:db8::/32', change: 'unchanged' },
    ])
  })

  test('marks only the second of two identical entries as a duplicate', () => {
    expect(getRestrictionsDiff([], ['192.0.2.0/24', '192.0.2.0/24'])).toEqual([
      { entry: '192.0.2.0/24', change: 'adding' },
      {
        entry: '192.0.2.0/24',
        change: 'adding',
        issue: { message: 'Duplicates 192.0.2.0/24' },
      },
    ])
  })
})

describe('getCorrectedRestrictions', () => {
  test('applies suggestions, drops what cannot be corrected and keeps valid entries first', () => {
    expect(
      getCorrectedRestrictions({
        ipv4: ['1.209.170.63/25', '203.0.113.0/24', 'not-an-address/32', '203.0.113.7/24'],
        ipv6: ['::ffff:102:304/128', '2001:db8::/32'],
      })
    ).toEqual({
      dbAllowedCidrs: ['203.0.113.0/24', '1.209.170.0/25', '1.2.3.4/32'],
      dbAllowedCidrsV6: ['2001:db8::/32'],
      corrections: [
        { entry: '1.209.170.63/25', replacement: '1.209.170.0/25' },
        { entry: 'not-an-address/32' },
        { entry: '203.0.113.7/24' },
        { entry: '::ffff:102:304/128', replacement: '1.2.3.4/32' },
      ],
    })
  })
})
