import { describe, expect, expectTypeOf, test, vi } from 'vitest'
import { z } from 'zod'

import {
  WidgetIncidentSchema,
  WidgetInProgressMaintenanceSchema,
  WidgetResponseSchema,
  WidgetScheduledMaintenanceSchema,
} from './status-page.schema'

describe('WidgetResponseSchema: tolerant arrays (fail-open)', () => {
  test('drops a malformed item from one array without failing the whole parse, leaving the valid item in that array and the other arrays intact', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const payload = {
      page_title: 'Supabase',
      page_url: 'https://statuspage.incident.io/supabase',
      ongoing_incidents: [
        {
          id: 'incident-valid',
          name: 'Valid incident',
          url: 'https://status.example.com/incidents/incident-valid',
          last_update_at: '2026-01-01T00:00:00Z',
          status: 'identified',
          current_worst_impact: 'partial_outage',
        },
        // Malformed: missing required `id`/`name`/`url`/`last_update_at`.
        { status: 'identified' },
      ],
      in_progress_maintenances: [
        {
          id: 'maintenance-valid',
          name: 'Valid maintenance',
          url: 'https://status.example.com/maintenances/maintenance-valid',
          last_update_at: '2026-01-01T00:00:00Z',
          status: 'maintenance_in_progress',
          started_at: '2026-01-01T00:00:00Z',
        },
      ],
      scheduled_maintenances: [],
    }

    const result = WidgetResponseSchema.safeParse(payload)

    expect(result.success).toBe(true)
    if (!result.success) return

    // The other valid item in the same array survives...
    expect(result.data.ongoing_incidents).toHaveLength(1)
    expect(result.data.ongoing_incidents[0].id).toBe('incident-valid')
    // ...and the other arrays are unaffected by the malformed item elsewhere.
    expect(result.data.in_progress_maintenances).toHaveLength(1)
    expect(result.data.in_progress_maintenances[0].id).toBe('maintenance-valid')

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('ongoing_incidents'),
      expect.any(Object)
    )

    warnSpy.mockRestore()
  })

  test('defaults a missing array key to an empty array', () => {
    const result = WidgetResponseSchema.safeParse({
      page_title: 'Supabase',
      page_url: 'https://statuspage.incident.io/supabase',
    })

    expect(result.success).toBe(true)
    if (!result.success) return

    expect(result.data.ongoing_incidents).toEqual([])
    expect(result.data.in_progress_maintenances).toEqual([])
    expect(result.data.scheduled_maintenances).toEqual([])
  })

  test('tolerantArray keeps parsed item types concrete, not any', () => {
    const result = WidgetResponseSchema.parse({
      page_title: 'Supabase',
      page_url: 'https://statuspage.incident.io/supabase',
    })

    expectTypeOf(result.ongoing_incidents).toEqualTypeOf<
      Array<z.infer<typeof WidgetIncidentSchema>>
    >()
    expectTypeOf(result.in_progress_maintenances).toEqualTypeOf<
      Array<z.infer<typeof WidgetInProgressMaintenanceSchema>>
    >()
    expectTypeOf(result.scheduled_maintenances).toEqualTypeOf<
      Array<z.infer<typeof WidgetScheduledMaintenanceSchema>>
    >()
  })
})
