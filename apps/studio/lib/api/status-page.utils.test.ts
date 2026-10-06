import { describe, expect, test } from 'vitest'

import {
  annotateWidget,
  computeAnnotations,
  mergeLinkedFlags,
  readCustomFieldFlag,
  readCustomFieldNumber,
  type CustomFieldEntry,
  type ResponseIncident,
  type ResponseIncidentFlags,
} from './status-page.utils'
import type { WidgetResponse } from '@/lib/status-page/status-page.schema'

const FIELD_ID = 'field-1'
const OTHER_FIELD_ID = 'field-2'

function entriesWith(fieldId: string, values: CustomFieldEntry['values']): Array<CustomFieldEntry> {
  return [{ custom_field: { id: fieldId }, values }]
}

describe('readCustomFieldFlag', () => {
  test('matches via value_option', () => {
    const entries = entriesWith(FIELD_ID, [{ value_option: { value: 'true' } }])
    expect(readCustomFieldFlag(entries, FIELD_ID)).toBe(true)
  })

  test('matches via value_text', () => {
    const entries = entriesWith(FIELD_ID, [{ value_text: 'true' }])
    expect(readCustomFieldFlag(entries, FIELD_ID)).toBe(true)
  })

  test('matches via value_numeric (non-zero → true)', () => {
    const entries = entriesWith(FIELD_ID, [{ value_numeric: '5' }])
    expect(readCustomFieldFlag(entries, FIELD_ID)).toBe(true)
  })

  test('value_numeric of 0 → false', () => {
    const entries = entriesWith(FIELD_ID, [{ value_numeric: '0' }])
    expect(readCustomFieldFlag(entries, FIELD_ID)).toBe(false)
  })

  test('value_numeric negative → false', () => {
    const entries = entriesWith(FIELD_ID, [{ value_numeric: '-5' }])
    expect(readCustomFieldFlag(entries, FIELD_ID)).toBe(false)
  })

  test('missing entry → false', () => {
    const entries = entriesWith(OTHER_FIELD_ID, [{ value_text: 'true' }])
    expect(readCustomFieldFlag(entries, FIELD_ID)).toBe(false)
  })

  test('empty fieldId → false (no-op)', () => {
    const entries = entriesWith(FIELD_ID, [{ value_text: 'true' }])
    expect(readCustomFieldFlag(entries, '')).toBe(false)
  })

  test('is case-insensitive', () => {
    const entries = entriesWith(FIELD_ID, [{ value_option: { value: 'TRUE' } }])
    expect(readCustomFieldFlag(entries, FIELD_ID)).toBe(true)

    const entries2 = entriesWith(FIELD_ID, [{ value_text: 'Yes' }])
    expect(readCustomFieldFlag(entries2, FIELD_ID)).toBe(true)
  })

  test('trims whitespace', () => {
    const entries = entriesWith(FIELD_ID, [{ value_text: ' true ' }])
    expect(readCustomFieldFlag(entries, FIELD_ID)).toBe(true)
  })
})

describe('readCustomFieldNumber', () => {
  test('reads a valid positive value via value_numeric', () => {
    const entries = entriesWith(FIELD_ID, [{ value_numeric: '7' }])
    expect(readCustomFieldNumber(entries, FIELD_ID)).toBe(7)
  })

  test('reads a valid positive value via value_option', () => {
    const entries = entriesWith(FIELD_ID, [{ value_option: { value: '3' } }])
    expect(readCustomFieldNumber(entries, FIELD_ID)).toBe(3)
  })

  test('reads a valid positive value via value_text', () => {
    const entries = entriesWith(FIELD_ID, [{ value_text: '10' }])
    expect(readCustomFieldNumber(entries, FIELD_ID)).toBe(10)
  })

  test('0 → null', () => {
    const entries = entriesWith(FIELD_ID, [{ value_numeric: '0' }])
    expect(readCustomFieldNumber(entries, FIELD_ID)).toBe(null)
  })

  test('negative number → null', () => {
    const entries = entriesWith(FIELD_ID, [{ value_numeric: '-5' }])
    expect(readCustomFieldNumber(entries, FIELD_ID)).toBe(null)
  })

  test('non-numeric string (NaN) → null', () => {
    const entries = entriesWith(FIELD_ID, [{ value_text: 'not-a-number' }])
    expect(readCustomFieldNumber(entries, FIELD_ID)).toBe(null)
  })

  test('empty fieldId → null', () => {
    const entries = entriesWith(FIELD_ID, [{ value_numeric: '7' }])
    expect(readCustomFieldNumber(entries, '')).toBe(null)
  })

  test('missing entry → null', () => {
    const entries = entriesWith(OTHER_FIELD_ID, [{ value_numeric: '7' }])
    expect(readCustomFieldNumber(entries, FIELD_ID)).toBe(null)
  })
})

describe('mergeLinkedFlags', () => {
  const fieldIds = { hideBannerFieldId: 'hide-banner', leadDaysFieldId: 'lead-days' }

  test('OR-merges modeFlags across multiple linked incidents', () => {
    const incidentA: ResponseIncident = {
      id: 'a',
      custom_field_entries: entriesWith('mode-1', [{ value_text: 'true' }]),
    }
    const incidentB: ResponseIncident = {
      id: 'b',
      custom_field_entries: entriesWith('mode-1', [{ value_text: 'false' }]),
    }

    const result = mergeLinkedFlags([incidentA, incidentB], ['mode-1'], fieldIds)
    expect(result.modeFlags['mode-1']).toBe(true)
  })

  test('AND-merges hideBanner: all must have it set for it to end up true', () => {
    const incidentA: ResponseIncident = {
      id: 'a',
      custom_field_entries: entriesWith('hide-banner', [{ value_text: 'true' }]),
    }
    const incidentB: ResponseIncident = {
      id: 'b',
      custom_field_entries: entriesWith('hide-banner', [{ value_text: 'true' }]),
    }

    const result = mergeLinkedFlags([incidentA, incidentB], [], fieldIds)
    expect(result.hideBanner).toBe(true)
  })

  test('one incident missing hideBanner brings the merge to false', () => {
    const incidentA: ResponseIncident = {
      id: 'a',
      custom_field_entries: entriesWith('hide-banner', [{ value_text: 'true' }]),
    }
    const incidentB: ResponseIncident = {
      id: 'b',
      custom_field_entries: entriesWith('hide-banner', [{ value_text: 'false' }]),
    }

    const result = mergeLinkedFlags([incidentA, incidentB], [], fieldIds)
    expect(result.hideBanner).toBe(false)
  })

  test('leadDays picks the max of the non-null values across incidents', () => {
    const incidentA: ResponseIncident = {
      id: 'a',
      custom_field_entries: entriesWith('lead-days', [{ value_numeric: '3' }]),
    }
    const incidentB: ResponseIncident = {
      id: 'b',
      custom_field_entries: entriesWith('lead-days', [{ value_numeric: '10' }]),
    }

    const result = mergeLinkedFlags([incidentA, incidentB], [], fieldIds)
    expect(result.leadDays).toBe(10)
  })

  test('leadDays is null when none set it', () => {
    const incidentA: ResponseIncident = { id: 'a', custom_field_entries: [] }

    const result = mergeLinkedFlags([incidentA], [], fieldIds)
    expect(result.leadDays).toBe(null)
  })
})

describe('computeAnnotations', () => {
  test('flags undefined → all-permissive defaults', () => {
    expect(computeAnnotations(undefined, [''])).toEqual({
      visible: true,
      show_banner: true,
      banner_lead_days: null,
    })
  })

  test('hideBanner true → show_banner false', () => {
    const flags: ResponseIncidentFlags = { hideBanner: true, modeFlags: {}, leadDays: null }
    expect(computeAnnotations(flags, ['']).show_banner).toBe(false)
  })

  test('hideBanner false → show_banner true', () => {
    const flags: ResponseIncidentFlags = { hideBanner: false, modeFlags: {}, leadDays: null }
    expect(computeAnnotations(flags, ['']).show_banner).toBe(true)
  })

  test('own mode ID empty + another mode flag set → hidden', () => {
    const flags: ResponseIncidentFlags = {
      hideBanner: false,
      modeFlags: { 'other-mode': true },
      leadDays: null,
    }
    expect(computeAnnotations(flags, ['', 'other-mode']).visible).toBe(false)
  })

  test('own mode ID set + own flag true, even if another is also true → visible', () => {
    const flags: ResponseIncidentFlags = {
      hideBanner: false,
      modeFlags: { 'own-mode': true, 'other-mode': true },
      leadDays: null,
    }
    expect(computeAnnotations(flags, ['own-mode', 'other-mode']).visible).toBe(true)
  })

  test('own mode ID set + own flag false + another flag true → hidden', () => {
    const flags: ResponseIncidentFlags = {
      hideBanner: false,
      modeFlags: { 'own-mode': false, 'other-mode': true },
      leadDays: null,
    }
    expect(computeAnnotations(flags, ['own-mode', 'other-mode']).visible).toBe(false)
  })

  test('nothing set anywhere → visible', () => {
    const flags: ResponseIncidentFlags = {
      hideBanner: false,
      modeFlags: { 'own-mode': false, 'other-mode': false },
      leadDays: null,
    }
    expect(computeAnnotations(flags, ['own-mode', 'other-mode']).visible).toBe(true)
  })
})

describe('annotateWidget', () => {
  const baseIncident = {
    id: 'incident-1',
    name: 'Incident 1',
    url: 'https://status.example.com/incidents/incident-1',
    last_update_at: '2026-01-01T00:00:00Z',
    last_update_message: 'Investigating',
    affected_components: [],
    status: 'investigating' as const,
    current_worst_impact: 'partial_outage' as const,
  }

  const baseInProgressMaintenance = {
    id: 'maintenance-1',
    name: 'Maintenance 1',
    url: 'https://status.example.com/maintenances/maintenance-1',
    last_update_at: '2026-01-01T00:00:00Z',
    last_update_message: null,
    affected_components: [],
    status: 'maintenance_in_progress' as const,
    started_at: '2026-01-01T00:00:00Z',
    scheduled_end_at: null,
  }

  const baseScheduledMaintenance = {
    id: 'scheduled-1',
    name: 'Scheduled 1',
    url: 'https://status.example.com/maintenances/scheduled-1',
    last_update_at: '2026-01-01T00:00:00Z',
    last_update_message: null,
    affected_components: [],
    status: 'maintenance_scheduled' as const,
    starts_at: '2026-02-01T00:00:00Z',
    ends_at: '2026-02-02T00:00:00Z',
  }

  const widget: WidgetResponse = {
    page_title: 'Supabase Status',
    page_url: 'https://status.example.com',
    ongoing_incidents: [baseIncident],
    in_progress_maintenances: [baseInProgressMaintenance],
    scheduled_maintenances: [baseScheduledMaintenance],
  }

  test('preserves non-annotation fields, and gates visibility/annotations per item', () => {
    const flagsById = new Map<string, ResponseIncidentFlags>([
      ['incident-1', { hideBanner: true, modeFlags: {}, leadDays: 5 }],
    ])

    const result = annotateWidget(widget, flagsById, [''])

    expect(result.page_title).toBe('Supabase Status')
    expect(result.page_url).toBe('https://status.example.com')

    expect(result.ongoing_incidents[0]).toMatchObject({
      ...baseIncident,
      visible: true,
      show_banner: false,
    })

    expect(result.ongoing_incidents[0]).not.toHaveProperty('banner_lead_days')
    expect(result.in_progress_maintenances[0]).not.toHaveProperty('banner_lead_days')
    expect(result.scheduled_maintenances[0]).toHaveProperty('banner_lead_days')
  })

  test('an item absent from flagsById gets the full default annotations', () => {
    const result = annotateWidget(widget, new Map(), [''])

    expect(result.ongoing_incidents[0]).toMatchObject({
      visible: true,
      show_banner: true,
    })
    expect(result.in_progress_maintenances[0]).toMatchObject({
      visible: true,
      show_banner: true,
    })
    expect(result.scheduled_maintenances[0]).toMatchObject({
      visible: true,
      show_banner: true,
      banner_lead_days: null,
    })
  })
})
