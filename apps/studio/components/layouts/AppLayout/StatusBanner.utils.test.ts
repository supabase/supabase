import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  getBannerCopy,
  getKeysToDismiss,
  isWithinUpcomingWindow,
  pruneDismissedKeys,
  selectBanner,
  type IncidentItem,
  type MaintenanceItem,
  type UpcomingMaintenanceItem,
} from './StatusBanner.utils'
import type {
  RegionScope,
  StatusItem,
  UserRegionContext,
} from '@/lib/status-page/status-page.utils'

const GLOBAL_SCOPE: RegionScope = { type: 'global' }

const DEFAULT_USER: UserRegionContext = {
  hasProjects: true,
  regions: new Set(),
  isComplete: true,
}

function makeIncident(overrides: Partial<IncidentItem> = {}): IncidentItem {
  return {
    id: 'inc-1',
    name: 'Elevated errors',
    url: 'https://status.example.com/incidents/inc-1',
    lastUpdateAt: '2026-01-01T00:00:00Z',
    lastUpdateMessage: null,
    components: [],
    scope: GLOBAL_SCOPE,
    projectCreationScope: null,
    isProjectCreationOnly: false,
    showBanner: true,
    kind: 'incident',
    status: 'investigating',
    impact: 'full_outage',
    ...overrides,
  }
}

function makeMaintenance(overrides: Partial<MaintenanceItem> = {}): MaintenanceItem {
  return {
    id: 'maint-1',
    name: 'Database maintenance',
    url: 'https://status.example.com/incidents/maint-1',
    lastUpdateAt: '2026-01-01T00:00:00Z',
    lastUpdateMessage: null,
    components: [],
    scope: GLOBAL_SCOPE,
    projectCreationScope: null,
    isProjectCreationOnly: false,
    showBanner: true,
    kind: 'maintenance',
    startedAt: '2026-01-01T00:00:00Z',
    scheduledEndAt: null,
    ...overrides,
  }
}

function makeUpcoming(overrides: Partial<UpcomingMaintenanceItem> = {}): UpcomingMaintenanceItem {
  return {
    id: 'upcoming-1',
    name: 'Upcoming maintenance',
    url: 'https://status.example.com/incidents/upcoming-1',
    lastUpdateAt: '2026-01-01T00:00:00Z',
    lastUpdateMessage: null,
    components: [],
    scope: GLOBAL_SCOPE,
    projectCreationScope: null,
    isProjectCreationOnly: false,
    showBanner: true,
    kind: 'upcoming_maintenance',
    startsAt: '2026-02-01T00:00:00Z',
    endsAt: '2026-02-01T02:00:00Z',
    leadDays: 7,
    ...overrides,
  }
}

const NOW_MS = Date.UTC(2026, 0, 25, 0, 0, 0)
const DAY_MS = 24 * 60 * 60 * 1000

describe('isWithinUpcomingWindow', () => {
  it('is true exactly at the default lead time boundary', () => {
    const item = makeUpcoming({
      startsAt: new Date(NOW_MS + 7 * DAY_MS).toISOString(),
      endsAt: new Date(NOW_MS + 8 * DAY_MS).toISOString(),
      leadDays: 7,
    })
    expect(isWithinUpcomingWindow(item, NOW_MS)).toBe(true)
  })

  it('is false just outside the lead time boundary', () => {
    const item = makeUpcoming({
      startsAt: new Date(NOW_MS + 7 * DAY_MS + 1).toISOString(),
      endsAt: new Date(NOW_MS + 8 * DAY_MS).toISOString(),
      leadDays: 7,
    })
    expect(isWithinUpcomingWindow(item, NOW_MS)).toBe(false)
  })

  it('respects a custom leadDays', () => {
    const withinCustomLead = makeUpcoming({
      startsAt: new Date(NOW_MS + 2 * DAY_MS).toISOString(),
      endsAt: new Date(NOW_MS + 3 * DAY_MS).toISOString(),
      leadDays: 2,
    })
    expect(isWithinUpcomingWindow(withinCustomLead, NOW_MS)).toBe(true)

    const outsideCustomLead = makeUpcoming({
      startsAt: new Date(NOW_MS + 3 * DAY_MS).toISOString(),
      endsAt: new Date(NOW_MS + 4 * DAY_MS).toISOString(),
      leadDays: 2,
    })
    expect(isWithinUpcomingWindow(outsideCustomLead, NOW_MS)).toBe(false)
  })

  it('is false once endsAt is already past, even if startsAt is within the lead window', () => {
    const item = makeUpcoming({
      startsAt: new Date(NOW_MS - 2 * DAY_MS).toISOString(),
      endsAt: new Date(NOW_MS - 1 * DAY_MS).toISOString(),
      leadDays: 7,
    })
    expect(isWithinUpcomingWindow(item, NOW_MS)).toBe(false)
  })

  it('is false when startsAt or endsAt is null', () => {
    expect(isWithinUpcomingWindow(makeUpcoming({ startsAt: null }), NOW_MS)).toBe(false)
    expect(isWithinUpcomingWindow(makeUpcoming({ endsAt: null }), NOW_MS)).toBe(false)
  })
})

describe('selectBanner', () => {
  it('prioritizes incidents over maintenance and upcoming maintenance', () => {
    const items: Array<StatusItem> = [
      makeUpcoming({ id: 'upcoming-1' }),
      makeMaintenance({ id: 'maint-1' }),
      makeIncident({ id: 'inc-1' }),
    ]
    const result = selectBanner({
      items,
      user: DEFAULT_USER,
      dismissedKeys: new Set(),
      nowMs: NOW_MS,
    })
    expect(result).toEqual({ kind: 'incident', items: [makeIncident({ id: 'inc-1' })] })
  })

  it('prioritizes in-progress maintenance over upcoming maintenance', () => {
    const items: Array<StatusItem> = [
      makeUpcoming({ id: 'upcoming-1' }),
      makeMaintenance({ id: 'maint-1' }),
    ]
    const result = selectBanner({
      items,
      user: DEFAULT_USER,
      dismissedKeys: new Set(),
      nowMs: NOW_MS,
    })
    expect(result).toEqual({ kind: 'maintenance', item: makeMaintenance({ id: 'maint-1' }) })
  })

  it('falls through to maintenance when the only incident is dismissed', () => {
    const items: Array<StatusItem> = [
      makeIncident({ id: 'inc-1' }),
      makeMaintenance({ id: 'maint-1' }),
    ]
    const result = selectBanner({
      items,
      user: DEFAULT_USER,
      dismissedKeys: new Set(['incident:inc-1']),
      nowMs: NOW_MS,
    })
    expect(result).toEqual({ kind: 'maintenance', item: makeMaintenance({ id: 'maint-1' }) })
  })

  it('excludes items with showBanner: false', () => {
    const items: Array<StatusItem> = [makeIncident({ showBanner: false })]
    expect(
      selectBanner({ items, user: DEFAULT_USER, dismissedKeys: new Set(), nowMs: NOW_MS })
    ).toBeNull()
  })

  it('excludes project-creation-only items', () => {
    const items: Array<StatusItem> = [makeIncident({ isProjectCreationOnly: true })]
    expect(
      selectBanner({ items, user: DEFAULT_USER, dismissedKeys: new Set(), nowMs: NOW_MS })
    ).toBeNull()
  })

  it('excludes items irrelevant to the user (region-scoped, no matching project region)', () => {
    const items: Array<StatusItem> = [
      makeIncident({ scope: { type: 'regions', regions: ['us-east-1'] } }),
    ]
    const user: UserRegionContext = {
      hasProjects: true,
      regions: new Set(['eu-west-1']),
      isComplete: true,
    }
    expect(selectBanner({ items, user, dismissedKeys: new Set(), nowMs: NOW_MS })).toBeNull()
  })

  it('excludes upcoming maintenance outside its window', () => {
    const items: Array<StatusItem> = [
      makeUpcoming({ startsAt: new Date(NOW_MS + 30 * DAY_MS).toISOString(), leadDays: 7 }),
    ]
    expect(
      selectBanner({ items, user: DEFAULT_USER, dismissedKeys: new Set(), nowMs: NOW_MS })
    ).toBeNull()
  })

  it('keeps distinct dismissal keys for the same ID across kinds', () => {
    const items: Array<StatusItem> = [makeMaintenance({ id: 'shared-id' })]
    const result = selectBanner({
      items,
      user: DEFAULT_USER,
      dismissedKeys: new Set(['upcoming_maintenance:shared-id']),
      nowMs: NOW_MS,
    })
    expect(result).toEqual({ kind: 'maintenance', item: makeMaintenance({ id: 'shared-id' }) })
  })

  it('includes all undismissed relevant incidents together', () => {
    const items: Array<StatusItem> = [makeIncident({ id: 'inc-1' }), makeIncident({ id: 'inc-2' })]
    const result = selectBanner({
      items,
      user: DEFAULT_USER,
      dismissedKeys: new Set(),
      nowMs: NOW_MS,
    })
    expect(result).toEqual({
      kind: 'incident',
      items: [makeIncident({ id: 'inc-1' }), makeIncident({ id: 'inc-2' })],
    })
  })

  describe('signed-out user (user: null)', () => {
    const dashboardComponent = {
      id: 'dashboard',
      name: 'Dashboard',
      group_name: 'Dashboard',
      current_status: 'full_outage' as const,
    }

    it('shows an incident that affects the Dashboard component', () => {
      const items: Array<StatusItem> = [makeIncident({ components: [dashboardComponent] })]
      const result = selectBanner({ items, user: null, dismissedKeys: new Set(), nowMs: NOW_MS })
      expect(result).toEqual({
        kind: 'incident',
        items: [makeIncident({ components: [dashboardComponent] })],
      })
    })

    it('hides an incident that does not affect the Dashboard component, even with global scope', () => {
      const items: Array<StatusItem> = [makeIncident({ scope: GLOBAL_SCOPE, components: [] })]
      const result = selectBanner({ items, user: null, dismissedKeys: new Set(), nowMs: NOW_MS })
      expect(result).toBeNull()
    })
  })
})

describe('getKeysToDismiss', () => {
  it('returns one key per incident for an incident selection', () => {
    expect(
      getKeysToDismiss({
        kind: 'incident',
        items: [makeIncident({ id: 'a' }), makeIncident({ id: 'b' })],
      })
    ).toEqual(['incident:a', 'incident:b'])
  })

  it('returns a single key for a maintenance selection', () => {
    expect(getKeysToDismiss({ kind: 'maintenance', item: makeMaintenance({ id: 'm' }) })).toEqual([
      'maintenance:m',
    ])
  })

  it('returns a single key for an upcoming maintenance selection', () => {
    expect(
      getKeysToDismiss({ kind: 'upcoming_maintenance', item: makeUpcoming({ id: 'u' }) })
    ).toEqual(['upcoming_maintenance:u'])
  })
})

describe('pruneDismissedKeys', () => {
  it('keeps keys for items still in the unfiltered item list and adds the new ones', () => {
    const result = pruneDismissedKeys({
      prev: ['incident:still-active', 'incident:finished'],
      allItems: [makeIncident({ id: 'still-active' })],
      add: ['incident:new'],
    })
    expect(result).toEqual(expect.arrayContaining(['incident:still-active', 'incident:new']))
    expect(result).not.toContain('incident:finished')
  })

  it('checks against the unfiltered item list, not a relevance-filtered one', () => {
    const result = pruneDismissedKeys({
      prev: ['incident:hidden-but-active'],
      allItems: [makeIncident({ id: 'hidden-but-active', showBanner: false })],
      add: [],
    })
    expect(result).toEqual(['incident:hidden-but-active'])
  })
})

describe('getBannerCopy', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(NOW_MS)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns singular incident copy for one incident', () => {
    const copy = getBannerCopy({ kind: 'incident', items: [makeIncident()] })
    expect(copy.title).toBe('We are investigating a technical issue')
  })

  it('returns plural incident copy for multiple incidents', () => {
    const copy = getBannerCopy({
      kind: 'incident',
      items: [makeIncident({ id: 'a' }), makeIncident({ id: 'b' })],
    })
    expect(copy.title).toBe('We are investigating multiple technical issues')
  })

  it('mentions an end time when scheduledEndAt is in the future', () => {
    const copy = getBannerCopy({
      kind: 'maintenance',
      item: makeMaintenance({ scheduledEndAt: new Date(NOW_MS + DAY_MS).toISOString() }),
    })
    expect(copy.description).toContain('until maintenance ends')
  })

  it('omits the end-time mention when scheduledEndAt is null', () => {
    const copy = getBannerCopy({
      kind: 'maintenance',
      item: makeMaintenance({ scheduledEndAt: null }),
    })
    expect(copy.description).not.toContain('until maintenance ends')
  })

  it('omits the end-time mention when scheduledEndAt is already past', () => {
    const copy = getBannerCopy({
      kind: 'maintenance',
      item: makeMaintenance({ scheduledEndAt: '2020-01-01T00:00:00Z' }),
    })
    expect(copy.description).not.toContain('until maintenance ends')
  })

  it('returns upcoming maintenance copy', () => {
    const copy = getBannerCopy({ kind: 'upcoming_maintenance', item: makeUpcoming() })
    expect(copy.title).toBe('Upcoming scheduled maintenance')
  })
})
