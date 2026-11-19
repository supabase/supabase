import { describe, expect, test } from 'vitest'

import type { AffectedComponent, StatusPageResponse } from './status-page.schema'
import {
  DEFAULT_UPCOMING_LEAD_DAYS,
  getRegionScope,
  isDashboardComponent,
  isProjectCreationOnly,
  isRegionCode,
  isRelevantToSignedOutUser,
  isRelevantToUser,
  normalizeStatusPage,
  type UserRegionContext,
} from './status-page.utils'

function component(
  name: string,
  groupName?: string | null,
  status: AffectedComponent['current_status'] = 'degraded_performance'
): AffectedComponent {
  return { id: name, name, group_name: groupName ?? undefined, current_status: status }
}

function emptyStatusPage(): StatusPageResponse {
  return {
    page_title: 'Supabase status',
    page_url: 'https://status.supabase.com/',
    ongoing_incidents: [],
    in_progress_maintenances: [],
    scheduled_maintenances: [],
  }
}

describe('isRegionCode', () => {
  test('accepts valid region codes', () => {
    expect(isRegionCode('us-east-1')).toBe(true)
    expect(isRegionCode('ap-southeast-2')).toBe(true)
    expect(isRegionCode('eu-central-1')).toBe(true)
  })

  test('is case-insensitive and trims whitespace', () => {
    expect(isRegionCode('US-EAST-1')).toBe(true)
    expect(isRegionCode('  us-east-1  ')).toBe(true)
  })

  test('rejects non-region names', () => {
    expect(isRegionCode('Dashboard')).toBe(false)
    expect(isRegionCode('All regions')).toBe(false)
    expect(isRegionCode('')).toBe(false)
    expect(isRegionCode('us1')).toBe(false)
  })
})

describe('getRegionScope', () => {
  test('returns regions when every component is a region code', () => {
    expect(getRegionScope([component('us-east-1'), component('ap-southeast-2')])).toEqual({
      type: 'regions',
      regions: ['us-east-1', 'ap-southeast-2'],
    })
  })

  test('returns global for a mixed set of components', () => {
    expect(getRegionScope([component('us-east-1'), component('Dashboard')])).toEqual({
      type: 'global',
    })
  })

  test('returns global for an empty component list', () => {
    expect(getRegionScope([])).toEqual({ type: 'global' })
  })
})

describe('isProjectCreationOnly', () => {
  test('true when every component belongs to Project Creation', () => {
    expect(
      isProjectCreationOnly([
        component('us-east-1', 'Project Creation'),
        component('ap-southeast-2', 'project creation'),
      ])
    ).toBe(true)
  })

  test('false when any component is outside Project Creation', () => {
    expect(
      isProjectCreationOnly([
        component('us-east-1', 'Project Creation'),
        component('us-east-1', 'Database'),
      ])
    ).toBe(false)
  })

  test('false for an empty component list', () => {
    expect(isProjectCreationOnly([])).toBe(false)
  })
})

describe('normalizeStatusPage: split scopes', () => {
  test('Project Creation plus a product component in the same region split into two scopes', () => {
    const page: StatusPageResponse = {
      ...emptyStatusPage(),
      ongoing_incidents: [
        {
          id: 'inc-1',
          name: 'Elevated errors',
          url: 'https://status.supabase.com/incidents/inc-1',
          last_update_at: '2026-01-01T00:00:00Z',
          last_update_message: null,
          affected_components: [
            component('us-east-1', 'Project Creation'),
            component('us-east-1', 'Database'),
          ],
          status: 'investigating',
          current_worst_impact: 'degraded_performance',
          visible: true,
          show_banner: true,
        },
      ],
    }

    const { items } = normalizeStatusPage(page)
    expect(items).toHaveLength(1)
    expect(items[0].scope).toEqual({ type: 'regions', regions: ['us-east-1'] })
    expect(items[0].projectCreationScope).toEqual({ type: 'regions', regions: ['us-east-1'] })
    expect(items[0].isProjectCreationOnly).toBe(false)
  })

  test('Project Creation with a non-region component name gives a global creation scope', () => {
    const page: StatusPageResponse = {
      ...emptyStatusPage(),
      ongoing_incidents: [
        {
          id: 'inc-2',
          name: 'Project creation delayed',
          url: 'https://status.supabase.com/incidents/inc-2',
          last_update_at: '2026-01-01T00:00:00Z',
          last_update_message: null,
          affected_components: [component('All regions', 'Project Creation')],
          status: 'investigating',
          current_worst_impact: 'degraded_performance',
          visible: true,
          show_banner: true,
        },
      ],
    }

    const { items } = normalizeStatusPage(page)
    expect(items[0].isProjectCreationOnly).toBe(true)
    expect(items[0].projectCreationScope).toEqual({ type: 'global' })
    expect(items[0].scope).toEqual({ type: 'global' })
  })
})

describe('normalizeStatusPage', () => {
  test('drops invisible items', () => {
    const page: StatusPageResponse = {
      ...emptyStatusPage(),
      ongoing_incidents: [
        {
          id: 'inc-hidden',
          name: 'Hidden incident',
          url: 'https://status.supabase.com/incidents/inc-hidden',
          last_update_at: '2026-01-01T00:00:00Z',
          last_update_message: null,
          affected_components: [],
          status: 'investigating',
          current_worst_impact: 'full_outage',
          visible: false,
          show_banner: true,
        },
      ],
    }

    expect(normalizeStatusPage(page).items).toHaveLength(0)
  })

  test('carries showBanner through unchanged', () => {
    const page: StatusPageResponse = {
      ...emptyStatusPage(),
      ongoing_incidents: [
        {
          id: 'inc-quiet',
          name: 'Quiet incident',
          url: 'https://status.supabase.com/incidents/inc-quiet',
          last_update_at: '2026-01-01T00:00:00Z',
          last_update_message: null,
          affected_components: [],
          status: 'investigating',
          current_worst_impact: 'full_outage',
          visible: true,
          show_banner: false,
        },
      ],
    }

    expect(normalizeStatusPage(page).items[0].showBanner).toBe(false)
  })

  test('resolves leadDays from banner_lead_days, falling back to the default', () => {
    const page: StatusPageResponse = {
      ...emptyStatusPage(),
      scheduled_maintenances: [
        {
          id: 'maint-1',
          name: 'Custom lead time',
          url: 'https://status.supabase.com/incidents/maint-1',
          last_update_at: '2026-01-01T00:00:00Z',
          last_update_message: null,
          affected_components: [],
          status: 'maintenance_scheduled',
          starts_at: '2026-02-01T00:00:00Z',
          ends_at: '2026-02-01T02:00:00Z',
          visible: true,
          show_banner: true,
          banner_lead_days: 3,
        },
        {
          id: 'maint-2',
          name: 'Default lead time',
          url: 'https://status.supabase.com/incidents/maint-2',
          last_update_at: '2026-01-01T00:00:00Z',
          last_update_message: null,
          affected_components: [],
          status: 'maintenance_scheduled',
          starts_at: '2026-02-01T00:00:00Z',
          ends_at: '2026-02-01T02:00:00Z',
          visible: true,
          show_banner: true,
          banner_lead_days: null,
        },
      ],
    }

    const { items } = normalizeStatusPage(page)
    const customLead = items.find((item) => item.id === 'maint-1')
    const defaultLead = items.find((item) => item.id === 'maint-2')
    expect(customLead?.kind === 'upcoming_maintenance' && customLead.leadDays).toBe(3)
    expect(defaultLead?.kind === 'upcoming_maintenance' && defaultLead.leadDays).toBe(
      DEFAULT_UPCOMING_LEAD_DAYS
    )
  })
})

describe('isRelevantToUser', () => {
  const regionalItem = normalizeStatusPage({
    ...emptyStatusPage(),
    ongoing_incidents: [
      {
        id: 'inc-region',
        name: 'Regional incident',
        url: 'https://status.supabase.com/incidents/inc-region',
        last_update_at: '2026-01-01T00:00:00Z',
        last_update_message: null,
        affected_components: [component('us-east-1', 'Database')],
        status: 'investigating',
        current_worst_impact: 'full_outage',
        visible: true,
        show_banner: true,
      },
    ],
  }).items[0]

  const globalItem = normalizeStatusPage({
    ...emptyStatusPage(),
    ongoing_incidents: [
      {
        id: 'inc-global',
        name: 'Global incident',
        url: 'https://status.supabase.com/incidents/inc-global',
        last_update_at: '2026-01-01T00:00:00Z',
        last_update_message: null,
        affected_components: [component('Dashboard', 'Dashboard')],
        status: 'investigating',
        current_worst_impact: 'full_outage',
        visible: true,
        show_banner: true,
      },
    ],
  }).items[0]

  test('false when the user has no projects', () => {
    const user: UserRegionContext = {
      hasProjects: false,
      regions: new Set(['us-east-1']),
      isComplete: true,
    }
    expect(isRelevantToUser(regionalItem, user)).toBe(false)
    expect(isRelevantToUser(globalItem, user)).toBe(false)
  })

  test('global scope is always relevant when the user has projects', () => {
    const user: UserRegionContext = { hasProjects: true, regions: new Set(), isComplete: true }
    expect(isRelevantToUser(globalItem, user)).toBe(true)
  })

  test('incomplete region data fails open for regional items', () => {
    const user: UserRegionContext = { hasProjects: true, regions: new Set(), isComplete: false }
    expect(isRelevantToUser(regionalItem, user)).toBe(true)
  })

  test('intersecting regions are relevant', () => {
    const user: UserRegionContext = {
      hasProjects: true,
      regions: new Set(['us-east-1']),
      isComplete: true,
    }
    expect(isRelevantToUser(regionalItem, user)).toBe(true)
  })

  test('disjoint regions are not relevant', () => {
    const user: UserRegionContext = {
      hasProjects: true,
      regions: new Set(['ap-southeast-2']),
      isComplete: true,
    }
    expect(isRelevantToUser(regionalItem, user)).toBe(false)
  })

  test('region comparison is case-insensitive', () => {
    const user: UserRegionContext = {
      hasProjects: true,
      regions: new Set(['US-EAST-1']),
      isComplete: true,
    }
    expect(isRelevantToUser(regionalItem, user)).toBe(true)
  })
})

describe('isDashboardComponent', () => {
  test('matches by component name, case-insensitively', () => {
    expect(isDashboardComponent(component('Dashboard'))).toBe(true)
    expect(isDashboardComponent(component('dashboard'))).toBe(true)
  })

  test('matches by group name', () => {
    expect(isDashboardComponent(component('EU dashboard', 'Dashboard'))).toBe(true)
  })

  test('does not match unrelated components', () => {
    expect(isDashboardComponent(component('Database'))).toBe(false)
    expect(isDashboardComponent(component('us-east-1', 'Project Creation'))).toBe(false)
  })
})

describe('isRelevantToSignedOutUser', () => {
  const dashboardItem = normalizeStatusPage({
    ...emptyStatusPage(),
    ongoing_incidents: [
      {
        id: 'inc-dashboard',
        name: 'Dashboard incident',
        url: 'https://status.supabase.com/incidents/inc-dashboard',
        last_update_at: '2026-01-01T00:00:00Z',
        last_update_message: null,
        affected_components: [component('Dashboard', 'Dashboard')],
        status: 'investigating',
        current_worst_impact: 'full_outage',
        visible: true,
        show_banner: true,
      },
    ],
  }).items[0]

  const nonDashboardItem = normalizeStatusPage({
    ...emptyStatusPage(),
    ongoing_incidents: [
      {
        id: 'inc-database',
        name: 'Database incident',
        url: 'https://status.supabase.com/incidents/inc-database',
        last_update_at: '2026-01-01T00:00:00Z',
        last_update_message: null,
        affected_components: [component('us-east-1', 'Database')],
        status: 'investigating',
        current_worst_impact: 'full_outage',
        visible: true,
        show_banner: true,
      },
    ],
  }).items[0]

  test('true when Dashboard is one of the affected components', () => {
    expect(isRelevantToSignedOutUser(dashboardItem)).toBe(true)
  })

  test('false when Dashboard is not affected, regardless of scope', () => {
    expect(isRelevantToSignedOutUser(nonDashboardItem)).toBe(false)
  })
})
