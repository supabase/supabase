import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getIncidentTools } from './incident-tools'

// Mock IS_PLATFORM
vi.mock('common', () => ({
  IS_PLATFORM: true,
}))

describe('ai/tools/incident-tools', () => {
  let mockFetch: ReturnType<typeof vi.fn>
  let mockAbortSignal: AbortSignal

  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch = vi.fn()
    global.fetch = mockFetch

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

      const result = schema.safeParse({})
      expect(result.success).toBe(true)
    })

    describe('execute function', () => {
      it('should return empty incidents when not on platform', async () => {
        const common = await import('common')
        vi.spyOn(common, 'IS_PLATFORM', 'get').mockReturnValue(false)

        const tools = getIncidentTools({ baseUrl: 'https://supabase.com/dashboard' })
        const result = await tools.get_active_incidents.execute({})

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
        await tools.get_active_incidents.execute({})

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
        const result = await tools.get_active_incidents.execute({})

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
        const result = await tools.get_active_incidents.execute({})

        expect(result.incidents).toEqual([
          {
            name: 'Database slowness',
            status: 'investigating',
            impact: 'minor',
            active_since: '2024-01-01T10:00:00Z',
          },
        ])
        expect(result.message).toContain('1 active incident')
        expect(result.message).toContain('status.supabase.com')
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
        const result = await tools.get_active_incidents.execute({})

        expect(result.incidents).toHaveLength(2)
        expect(result.message).toContain('2 active incidents')
      })

      it('should handle fetch errors', async () => {
        const common = await import('common')
        vi.spyOn(common, 'IS_PLATFORM', 'get').mockReturnValue(true)

        mockFetch.mockRejectedValue(new Error('Network error'))

        const tools = getIncidentTools({ baseUrl: 'https://supabase.com/dashboard' })
        const result = await tools.get_active_incidents.execute({})

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
        const result = await tools.get_active_incidents.execute({})

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
        await tools.get_active_incidents.execute({})

        const callArgs = mockFetch.mock.calls[0]
        expect(callArgs[1].signal).toBeInstanceOf(AbortSignal)
      })
    })
  })
})
