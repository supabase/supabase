import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getIncidentTools } from './incident-tools'

// Mock IS_PLATFORM
vi.mock('common', () => ({
  IS_PLATFORM: true,
}))

const executeOptions = { toolCallId: 'test', messages: [], context: {} }

describe('ai/tools/incident-tools', () => {
  let mockFetch: ReturnType<typeof vi.fn>
  let mockAbortSignal: AbortSignal

  beforeEach(() => {
    mockFetch = vi.fn()
    global.fetch = mockFetch as typeof fetch

    // Mock AbortSignal.timeout
    mockAbortSignal = new AbortController().signal
    if (!AbortSignal.timeout) {
      AbortSignal.timeout = vi.fn(() => mockAbortSignal) as any
    }
  })

  describe('getIncidentTools', () => {
    it('should return an object with get_active_incidents tool', () => {
      const tools = getIncidentTools({ baseUrl: 'https://supabase.com/dashboard' })

      expect(tools).toBeDefined()
      expect(tools.get_active_incidents).toBeDefined()
    })

    it('should have correct description for get_active_incidents', () => {
      const tools = getIncidentTools({ baseUrl: 'https://supabase.com/dashboard' })

      expect(tools.get_active_incidents.description).toContain('Check for active incidents')
      expect(tools.get_active_incidents.description).toContain('Supabase service')
    })

    it('should have empty input schema', () => {
      const tools = getIncidentTools({ baseUrl: 'https://supabase.com/dashboard' })
      const schema = tools.get_active_incidents.inputSchema

      // The schema is a Zod object that accepts empty object
      expect(schema).toBeDefined()
      expect((schema as any)._def.typeName).toBe('ZodObject')
    })

    describe('execute function', () => {
      it('should return empty incidents when not on platform', async () => {
        const common = await import('common')
        vi.spyOn(common, 'IS_PLATFORM', 'get').mockReturnValue(false)

        const tools = getIncidentTools({ baseUrl: 'https://supabase.com/dashboard' })
        const result = await (tools.get_active_incidents.execute as any)({}, executeOptions)

        expect(result).toEqual({
          incidents: [],
          message: 'Incident checking is only available on Supabase platform.',
        })
        expect(mockFetch).not.toHaveBeenCalled()
      })

      it('should fetch incidents from correct URL', async () => {
        const common = await import('common')
        vi.spyOn(common, 'IS_PLATFORM', 'get').mockReturnValue(true)

        mockFetch.mockResolvedValue({
          ok: true,
          json: async () => [],
        })

        const tools = getIncidentTools({ baseUrl: 'https://example.com/dashboard' })
        if (!tools.get_active_incidents.execute) throw new Error('execute is undefined')
        await tools.get_active_incidents.execute(
          {},
          { toolCallId: 'test', messages: [], context: {} }
        )

        expect(mockFetch).toHaveBeenCalledWith(
          'https://example.com/dashboard/api/incident-status',
          {
            signal: expect.any(AbortSignal),
          }
        )
      })

      it('should return message when no incidents', async () => {
        const common = await import('common')
        vi.spyOn(common, 'IS_PLATFORM', 'get').mockReturnValue(true)

        mockFetch.mockResolvedValue({
          ok: true,
          json: async () => [],
        })

        const tools = getIncidentTools({ baseUrl: 'https://supabase.com/dashboard' })
        const result = await (tools.get_active_incidents.execute as any)({}, executeOptions)

        expect(result).toEqual({
          incidents: [],
          message: expect.stringContaining('No active incidents'),
        })
      })

      it('should return incident summaries when incidents exist', async () => {
        const common = await import('common')
        vi.spyOn(common, 'IS_PLATFORM', 'get').mockReturnValue(true)

        const mockIncidents = [
          {
            name: 'Database slowness',
            status: 'investigating',
            impact: 'minor',
            active_since: '2024-01-01T10:00:00Z',
            extra_field: 'should be filtered',
          },
        ]

        mockFetch.mockResolvedValue({
          ok: true,
          json: async () => mockIncidents,
        })

        const tools = getIncidentTools({ baseUrl: 'https://supabase.com/dashboard' })
        const result = await (tools.get_active_incidents.execute as any)({}, executeOptions)

        expect((result as any).incidents).toEqual([
          {
            name: 'Database slowness',
            status: 'investigating',
            impact: 'minor',
            active_since: '2024-01-01T10:00:00Z',
          },
        ])
        expect((result as any).message).toContain('1 active incident')
        expect((result as any).message).toContain('status.supabase.com')
      })

      it('should handle multiple incidents', async () => {
        const common = await import('common')
        vi.spyOn(common, 'IS_PLATFORM', 'get').mockReturnValue(true)

        const mockIncidents = [
          {
            name: 'Database issue',
            status: 'investigating',
            impact: 'major',
            active_since: '2024-01-01T10:00:00Z',
          },
          {
            name: 'Storage issue',
            status: 'identified',
            impact: 'minor',
            active_since: '2024-01-01T11:00:00Z',
          },
        ]

        mockFetch.mockResolvedValue({
          ok: true,
          json: async () => mockIncidents,
        })

        const tools = getIncidentTools({ baseUrl: 'https://supabase.com/dashboard' })
        const result = await (tools.get_active_incidents.execute as any)({}, executeOptions)

        expect((result as any).incidents).toHaveLength(2)
        expect((result as any).message).toContain('2 active incidents')
      })

      it('should handle fetch errors', async () => {
        const common = await import('common')
        vi.spyOn(common, 'IS_PLATFORM', 'get').mockReturnValue(true)

        mockFetch.mockRejectedValue(new Error('Network error'))

        const tools = getIncidentTools({ baseUrl: 'https://supabase.com/dashboard' })
        const result = await (tools.get_active_incidents.execute as any)({}, executeOptions)

        expect(result).toEqual({
          incidents: [],
          error: 'Unable to check incident status at this time.',
        })
      })

      it('should handle non-ok responses', async () => {
        const common = await import('common')
        vi.spyOn(common, 'IS_PLATFORM', 'get').mockReturnValue(true)

        mockFetch.mockResolvedValue({
          ok: false,
          status: 500,
        })

        const tools = getIncidentTools({ baseUrl: 'https://supabase.com/dashboard' })
        const result = await (tools.get_active_incidents.execute as any)({}, executeOptions)

        expect(result).toEqual({
          incidents: [],
          error: 'Unable to check incident status at this time.',
        })
      })

      it('should use timeout signal', async () => {
        const common = await import('common')
        vi.spyOn(common, 'IS_PLATFORM', 'get').mockReturnValue(true)

        mockFetch.mockResolvedValue({
          ok: true,
          json: async () => [],
        })

        const tools = getIncidentTools({ baseUrl: 'https://supabase.com/dashboard' })
        if (!tools.get_active_incidents.execute) throw new Error('execute is undefined')
        await tools.get_active_incidents.execute(
          {},
          { toolCallId: 'test', messages: [], context: {} }
        )

        const callArgs = mockFetch.mock.calls[0]
        expect(callArgs[1].signal).toBeInstanceOf(AbortSignal)
      })

      it('cancels the request when the Assistant request is aborted', async () => {
        mockFetch.mockResolvedValue({
          ok: true,
          json: async () => [],
        })
        const abortController = new AbortController()

        const tools = getIncidentTools({ baseUrl: 'https://supabase.com/dashboard' })
        if (!tools.get_active_incidents.execute) throw new Error('execute is undefined')
        await tools.get_active_incidents.execute(
          {},
          { ...executeOptions, abortSignal: abortController.signal }
        )

        const { signal } = mockFetch.mock.calls[0][1]
        expect(signal.aborted).toBe(false)
        abortController.abort()
        expect(signal.aborted).toBe(true)
      })
    })
  })

  describe('with useStatusPageWidget enabled', () => {
    beforeEach(async () => {
      const common = await import('common')
      vi.spyOn(common, 'IS_PLATFORM', 'get').mockReturnValue(true)
    })

    const baseIncident = {
      id: 'incident-1',
      name: 'Elevated error rates',
      url: 'https://status.supabase.com/incidents/incident-1',
      last_update_at: '2026-01-01T00:00:00Z',
      last_update_message: 'We are investigating.',
      affected_components: [],
      status: 'investigating',
      current_worst_impact: 'partial_outage',
    }

    const baseMaintenance = {
      id: 'maintenance-1',
      name: 'Scheduled database maintenance',
      url: 'https://status.supabase.com/maintenances/maintenance-1',
      last_update_at: '2026-01-01T00:00:00Z',
      last_update_message: null,
      affected_components: [],
      status: 'maintenance_in_progress',
      started_at: '2026-01-01T00:00:00Z',
    }

    function statusPagePayload(overrides: Record<string, unknown> = {}) {
      return {
        page_title: 'Supabase',
        page_url: 'https://status.supabase.com',
        ongoing_incidents: [],
        in_progress_maintenances: [],
        scheduled_maintenances: [],
        ...overrides,
      }
    }

    it('fetches from the status page endpoint', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => statusPagePayload(),
      })

      const tools = getIncidentTools({
        baseUrl: 'https://example.com/dashboard',
        useStatusPageWidget: true,
      })
      if (!tools.get_active_incidents.execute) throw new Error('execute is undefined')
      await tools.get_active_incidents.execute({}, executeOptions)

      expect(mockFetch).toHaveBeenCalledWith('https://example.com/dashboard/api/status-page', {
        signal: expect.any(AbortSignal),
      })
    })

    it('drops incidents and maintenances where visible is false', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () =>
          statusPagePayload({
            ongoing_incidents: [
              { ...baseIncident, visible: false, show_banner: false },
              { ...baseIncident, id: 'incident-2', visible: true, show_banner: true },
            ],
            in_progress_maintenances: [{ ...baseMaintenance, visible: false, show_banner: false }],
          }),
      })

      const tools = getIncidentTools({
        baseUrl: 'https://supabase.com/dashboard',
        useStatusPageWidget: true,
      })
      const result = await (tools.get_active_incidents.execute as any)({}, executeOptions)

      expect((result as any).incidents).toHaveLength(1)
      expect((result as any).incidents[0]).toMatchObject({
        kind: 'incident',
        name: 'Elevated error rates',
      })
    })

    it('includes items with show_banner set to false', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () =>
          statusPagePayload({
            ongoing_incidents: [{ ...baseIncident, visible: true, show_banner: false }],
          }),
      })

      const tools = getIncidentTools({
        baseUrl: 'https://supabase.com/dashboard',
        useStatusPageWidget: true,
      })
      const result = await (tools.get_active_incidents.execute as any)({}, executeOptions)

      expect((result as any).incidents).toHaveLength(1)
    })

    it('combines ongoing incidents and in-progress maintenances, excluding scheduled maintenances', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () =>
          statusPagePayload({
            ongoing_incidents: [{ ...baseIncident, visible: true, show_banner: true }],
            in_progress_maintenances: [{ ...baseMaintenance, visible: true, show_banner: true }],
            scheduled_maintenances: [
              {
                id: 'scheduled-1',
                name: 'Upcoming maintenance',
                url: 'https://status.supabase.com/maintenances/scheduled-1',
                last_update_at: '2026-01-01T00:00:00Z',
                last_update_message: null,
                affected_components: [],
                status: 'maintenance_scheduled',
                starts_at: '2026-02-01T00:00:00Z',
                ends_at: '2026-02-01T01:00:00Z',
                visible: true,
                show_banner: true,
                banner_lead_days: 1,
              },
            ],
          }),
      })

      const tools = getIncidentTools({
        baseUrl: 'https://supabase.com/dashboard',
        useStatusPageWidget: true,
      })
      const result = await (tools.get_active_incidents.execute as any)({}, executeOptions)

      expect((result as any).incidents).toHaveLength(2)
      expect((result as any).incidents.map((incident: any) => incident.kind).sort()).toEqual([
        'incident',
        'maintenance',
      ])
      expect((result as any).message).toContain('status.supabase.com')
    })

    it('returns the no-active-incidents message when nothing is visible', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => statusPagePayload(),
      })

      const tools = getIncidentTools({
        baseUrl: 'https://supabase.com/dashboard',
        useStatusPageWidget: true,
      })
      const result = await (tools.get_active_incidents.execute as any)({}, executeOptions)

      expect(result).toEqual({
        incidents: [],
        message: expect.stringContaining('No active incidents'),
      })
    })

    it('returns an error when the response fails to parse', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ this_is: 'not a valid status page response' }),
      })

      const tools = getIncidentTools({
        baseUrl: 'https://supabase.com/dashboard',
        useStatusPageWidget: true,
      })
      const result = await (tools.get_active_incidents.execute as any)({}, executeOptions)

      expect(result).toEqual({
        incidents: [],
        error: 'Unable to check incident status at this time.',
      })
    })

    it('returns an error on a non-ok response', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
      })

      const tools = getIncidentTools({
        baseUrl: 'https://supabase.com/dashboard',
        useStatusPageWidget: true,
      })
      const result = await (tools.get_active_incidents.execute as any)({}, executeOptions)

      expect(result).toEqual({
        incidents: [],
        error: 'Unable to check incident status at this time.',
      })
    })
  })
})
