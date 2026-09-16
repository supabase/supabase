import { describe, expect, it, vi } from 'vitest'

import {
  getRegionRestrictionCopy,
  getRegionRestrictionMessage,
  parseRestrictedRegions,
  REGION_RESTRICTION_COPY,
  resolveRegionRestriction,
  SELECT_DIFFERENT_REGION,
} from './RegionSelector.utils'

vi.mock('@/lib/error-reporting', () => ({ captureCriticalError: vi.fn() }))

describe('parseRestrictedRegions', () => {
  it.each([
    ['the false that useFlag returns when unresolved or errored', false],
    ['undefined', undefined],
    ['an empty string', ''],
    ['an empty object', '{}'],
    ['invalid JSON', 'not json'],
    ['an unknown status value', '{"sa-east-1":"bogus"}'],
    ['a status value the flag no longer supports', '{"sa-east-1":"paid_only"}'],
    ['an array instead of a record', '["sa-east-1"]'],
    ['a non-string value', 42],
  ])('fails open to no restrictions for %s', (_label, flagValue) => {
    expect(parseRestrictedRegions(flagValue)).toEqual({})
  })

  it('returns the restrictions keyed by region code for a valid payload', () => {
    expect(
      parseRestrictedRegions('{"sa-east-1":"unavailable","eu-central-1":"unavailable"}')
    ).toEqual({ 'sa-east-1': 'unavailable', 'eu-central-1': 'unavailable' })
  })

  it('drops every restriction when any entry is invalid', () => {
    expect(parseRestrictedRegions('{"sa-east-1":"unavailable","eu-central-1":"bogus"}')).toEqual({})
  })

  it('reports a present-but-invalid payload without reporting the unresolved flag value', async () => {
    const { captureCriticalError } = await import('@/lib/error-reporting')
    vi.mocked(captureCriticalError).mockClear()

    parseRestrictedRegions(false)
    parseRestrictedRegions('')
    expect(captureCriticalError).not.toHaveBeenCalled()

    parseRestrictedRegions('not json')
    parseRestrictedRegions('{"sa-east-1":"bogus"}')
    expect(captureCriticalError).toHaveBeenCalledTimes(2)
  })
})

describe('resolveRegionRestriction', () => {
  it('lets the platform status win over the flag', () => {
    expect(
      resolveRegionRestriction({ platformStatus: 'capacity', flagRestriction: 'unavailable' })
    ).toBe('capacity')
    expect(
      resolveRegionRestriction({ platformStatus: 'other', flagRestriction: 'unavailable' })
    ).toBe('other')
  })

  it('applies the flag only where the platform reports no status', () => {
    expect(
      resolveRegionRestriction({ platformStatus: undefined, flagRestriction: 'unavailable' })
    ).toBe('unavailable')
  })

  it('passes a platform status it does not recognise through unchanged', () => {
    expect(
      resolveRegionRestriction({ platformStatus: 'brand_new', flagRestriction: undefined })
    ).toBe('brand_new')
  })

  it('returns no restriction when neither source restricts the region', () => {
    expect(
      resolveRegionRestriction({ platformStatus: undefined, flagRestriction: undefined })
    ).toBeUndefined()
  })
})

describe('getRegionRestrictionCopy', () => {
  it('uses the capacity copy for a capacity status', () => {
    expect(getRegionRestrictionCopy('capacity')).toBe(REGION_RESTRICTION_COPY.capacity)
    expect(getRegionRestrictionCopy('capacity').tooltip).toBe(
      'Temporarily unavailable due to this region being at capacity.'
    )
  })

  it.each(['other', 'unavailable', 'brand_new', 'toString'])(
    'falls back to the generic copy for %s',
    (restriction) => {
      expect(getRegionRestrictionCopy(restriction)).toBe(REGION_RESTRICTION_COPY.other)
    }
  )

  it('builds the submit message from the title and the shared call to action', () => {
    expect(getRegionRestrictionMessage('capacity')).toBe(
      `Selected region is at capacity. ${SELECT_DIFFERENT_REGION}`
    )
    expect(getRegionRestrictionMessage('brand_new')).toBe(
      `Selected region is unavailable. ${SELECT_DIFFERENT_REGION}`
    )
  })
})
