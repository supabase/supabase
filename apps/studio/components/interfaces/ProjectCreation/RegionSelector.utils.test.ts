import { describe, expect, it, vi } from 'vitest'

import {
  getItemsAffectingProjectCreation,
  getRegionRestrictionCopy,
  getRegionRestrictionMessage,
  parseRestrictedRegions,
  REGION_RESTRICTION_COPY,
  regionMatches,
  resolveRegionRestriction,
  SELECT_DIFFERENT_REGION,
} from './RegionSelector.utils'
import type { StatusItem } from '@/lib/status-page/status-page.utils'

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

describe('regionMatches', () => {
  it('matches an exact region code', () => {
    expect(regionMatches('us-east-1', 'us-east-1')).toBe(true)
  })

  it('matches a smart group against a specific region it contains', () => {
    expect(regionMatches('americas', 'us-east-1')).toBe(true)
  })

  it('does not match a smart group against a region from a different group', () => {
    expect(regionMatches('apac', 'us-east-1')).toBe(false)
  })

  it.each([
    ['US-EAST-1', 'us-east-1'],
    ['us-east-1', 'US-EAST-1'],
    ['AMERICAS', 'us-east-1'],
  ])('matches case-insensitively (%s vs %s)', (selectedCode, affectedRegion) => {
    expect(regionMatches(selectedCode, affectedRegion)).toBe(true)
  })

  it('does not match unrelated specific regions', () => {
    expect(regionMatches('us-east-1', 'eu-central-1')).toBe(false)
  })
})

describe('getItemsAffectingProjectCreation', () => {
  type IncidentItem = Extract<StatusItem, { kind: 'incident' }>
  type UpcomingMaintenanceItem = Extract<StatusItem, { kind: 'upcoming_maintenance' }>

  function buildItem(overrides: Partial<IncidentItem> = {}): IncidentItem {
    return {
      id: 'incident-1',
      name: 'Project creation degraded',
      url: 'https://status.supabase.com/incidents/1',
      lastUpdateAt: '2026-01-01T00:00:00Z',
      lastUpdateMessage: null,
      components: [],
      scope: { type: 'global' },
      projectCreationScope: null,
      isProjectCreationOnly: true,
      showBanner: true,
      kind: 'incident',
      status: 'investigating',
      impact: 'partial_outage',
      ...overrides,
    }
  }

  function buildUpcomingMaintenanceItem(
    overrides: Partial<UpcomingMaintenanceItem> = {}
  ): UpcomingMaintenanceItem {
    return {
      id: 'maintenance-1',
      name: 'Upcoming project creation maintenance',
      url: 'https://status.supabase.com/incidents/2',
      lastUpdateAt: '2026-01-01T00:00:00Z',
      lastUpdateMessage: null,
      components: [],
      scope: { type: 'global' },
      projectCreationScope: null,
      isProjectCreationOnly: true,
      showBanner: true,
      kind: 'upcoming_maintenance',
      startsAt: '2026-02-01T00:00:00Z',
      endsAt: '2026-02-02T00:00:00Z',
      leadDays: 7,
      ...overrides,
    }
  }

  it('includes a global project creation item regardless of the selected region', () => {
    const item = buildItem({ projectCreationScope: { type: 'global' } })
    expect(getItemsAffectingProjectCreation([item], undefined)).toEqual([item])
    expect(getItemsAffectingProjectCreation([item], 'us-east-1')).toEqual([item])
  })

  it('excludes a region-scoped item when no region is selected', () => {
    const item = buildItem({ projectCreationScope: { type: 'regions', regions: ['us-east-1'] } })
    expect(getItemsAffectingProjectCreation([item], undefined)).toEqual([])
  })

  it('excludes an item that does not affect project creation', () => {
    const item = buildItem({ projectCreationScope: null })
    expect(getItemsAffectingProjectCreation([item], 'us-east-1')).toEqual([])
  })

  it('excludes upcoming maintenance even with a matching project creation scope', () => {
    const item = buildUpcomingMaintenanceItem({ projectCreationScope: { type: 'global' } })
    expect(getItemsAffectingProjectCreation([item], undefined)).toEqual([])
  })

  it('still includes an item with showBanner false', () => {
    const item = buildItem({ projectCreationScope: { type: 'global' }, showBanner: false })
    expect(getItemsAffectingProjectCreation([item], undefined)).toEqual([item])
  })

  it('includes a region-scoped item matching the selected region via a smart group', () => {
    const item = buildItem({ projectCreationScope: { type: 'regions', regions: ['us-east-1'] } })
    expect(getItemsAffectingProjectCreation([item], 'americas')).toEqual([item])
  })
})
