import { describe, expect, test } from 'vitest'

import {
  getStatusPillLabel,
  getSupportAdmonitionCopy,
  getSupportStatusLabel,
  prioritizeActiveItems,
  type SupportStatus,
} from './SupportStatus.utils'
import type { StatusItem } from '@/lib/status-page/status-page.utils'

function incident(overrides: Partial<Extract<StatusItem, { kind: 'incident' }>> = {}): StatusItem {
  return {
    kind: 'incident',
    id: 'inc-1',
    name: 'Elevated errors',
    url: 'https://status.supabase.com/incidents/inc-1',
    lastUpdateAt: '2026-01-01T00:00:00Z',
    lastUpdateMessage: null,
    components: [],
    scope: { type: 'global' },
    projectCreationScope: null,
    isProjectCreationOnly: false,
    showBanner: true,
    status: 'investigating',
    impact: 'full_outage',
    ...overrides,
  }
}

function maintenance(
  overrides: Partial<Extract<StatusItem, { kind: 'maintenance' }>> = {}
): StatusItem {
  return {
    kind: 'maintenance',
    id: 'maint-1',
    name: 'Database maintenance',
    url: 'https://status.supabase.com/incidents/maint-1',
    lastUpdateAt: '2026-01-01T00:00:00Z',
    lastUpdateMessage: null,
    components: [],
    scope: { type: 'global' },
    projectCreationScope: null,
    isProjectCreationOnly: false,
    showBanner: true,
    startedAt: '2026-01-01T00:00:00Z',
    scheduledEndAt: null,
    ...overrides,
  }
}

function upcomingMaintenance(
  overrides: Partial<Extract<StatusItem, { kind: 'upcoming_maintenance' }>> = {}
): StatusItem {
  return {
    kind: 'upcoming_maintenance',
    id: 'upcoming-1',
    name: 'Upcoming maintenance',
    url: 'https://status.supabase.com/incidents/upcoming-1',
    lastUpdateAt: '2026-01-01T00:00:00Z',
    lastUpdateMessage: null,
    components: [],
    scope: { type: 'global' },
    projectCreationScope: null,
    isProjectCreationOnly: false,
    showBanner: true,
    startsAt: '2026-02-01T00:00:00Z',
    endsAt: '2026-02-01T02:00:00Z',
    leadDays: 7,
    ...overrides,
  }
}

describe('prioritizeActiveItems', () => {
  test('ranks incidents above maintenance by impact', () => {
    const items = [
      maintenance({ id: 'm', lastUpdateAt: '2026-01-01T00:00:00Z' }),
      incident({
        id: 'degraded',
        impact: 'degraded_performance',
        lastUpdateAt: '2026-01-01T00:00:00Z',
      }),
      incident({ id: 'full', impact: 'full_outage', lastUpdateAt: '2026-01-01T00:00:00Z' }),
    ]

    expect(prioritizeActiveItems(items).map((item) => item.id)).toEqual(['full', 'degraded', 'm'])
  })

  test('breaks ties by lastUpdateAt descending', () => {
    const items = [
      incident({ id: 'older', impact: 'full_outage', lastUpdateAt: '2026-01-01T00:00:00Z' }),
      incident({ id: 'newer', impact: 'full_outage', lastUpdateAt: '2026-01-02T00:00:00Z' }),
    ]

    expect(prioritizeActiveItems(items).map((item) => item.id)).toEqual(['newer', 'older'])
  })

  test('ignores upcoming maintenance entirely', () => {
    const items = [upcomingMaintenance(), incident()]
    expect(prioritizeActiveItems(items).map((item) => item.id)).toEqual(['inc-1'])
  })

  test('includes items regardless of showBanner', () => {
    const items = [incident({ showBanner: false })]
    expect(prioritizeActiveItems(items)).toHaveLength(1)
  })
})

describe('getSupportAdmonitionCopy', () => {
  test('returns null when there is nothing active', () => {
    expect(getSupportAdmonitionCopy([upcomingMaintenance()])).toBeNull()
  })

  test('singular title for one active item', () => {
    const copy = getSupportAdmonitionCopy([incident({ name: 'Elevated errors' })])
    expect(copy?.title).toBe('Elevated errors')
  })

  test('plural title for two active items', () => {
    const copy = getSupportAdmonitionCopy([
      incident({ id: 'a', name: 'Elevated errors', impact: 'full_outage' }),
      incident({ id: 'b', name: 'Slow queries', impact: 'degraded_performance' }),
    ])
    expect(copy?.title).toBe('Elevated errors and 1 other issue')
  })

  test('plural title uses plural "issues" for three or more', () => {
    const copy = getSupportAdmonitionCopy([
      incident({ id: 'a', impact: 'full_outage' }),
      incident({ id: 'b', impact: 'degraded_performance' }),
      incident({ id: 'c', impact: 'degraded_performance' }),
    ])
    expect(copy?.title).toBe('Elevated errors and 2 other issues')
  })

  test('describes an in-progress maintenance', () => {
    const copy = getSupportAdmonitionCopy([maintenance()])
    expect(copy?.description).toContain('Scheduled maintenance is in progress')
  })
})

describe('getStatusPillLabel', () => {
  test('all systems operational when nothing is active', () => {
    expect(getStatusPillLabel([upcomingMaintenance()])).toBe('All systems operational')
  })

  test('active incident ongoing when any incident is active', () => {
    expect(getStatusPillLabel([incident(), maintenance()])).toBe('Active incident ongoing')
  })

  test('scheduled maintenance when only maintenance is active', () => {
    expect(getStatusPillLabel([maintenance()])).toBe('Scheduled maintenance')
  })
})

describe('getSupportStatusLabel', () => {
  test('pending', () => {
    expect(getSupportStatusLabel({ status: 'pending' })).toBe('Checking status')
  })

  test('error', () => {
    expect(getSupportStatusLabel({ status: 'error' })).toBe('Failed to check status')
  })

  test('success uses the computed pill label', () => {
    const status: SupportStatus = {
      status: 'success',
      hasActiveIncidents: true,
      pillLabel: 'Active incident ongoing',
      admonition: null,
      pageUrl: 'https://status.supabase.com/',
    }
    expect(getSupportStatusLabel(status)).toBe('Active incident ongoing')
  })
})
