import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getReportTools } from './report-tools'
import { getContentById, type ContentIdData } from '@/data/content/content-id-query'
import { getContent, type Content } from '@/data/content/content-query'

vi.mock('@/data/content/content-query', () => ({
  getContent: vi.fn(),
}))
vi.mock('@/data/content/content-id-query', () => ({
  getContentById: vi.fn(),
}))

describe('ai/tools/report-tools', () => {
  beforeEach(() => {
    vi.mocked(getContent).mockReset()
    vi.mocked(getContentById).mockReset()
  })

  describe('getReportTools', () => {
    it('should return list_reports and get_report tools', () => {
      const tools = getReportTools()

      expect(Object.keys(tools)).toEqual(['list_reports', 'get_report'])
    })

    it('should not require approval to read reports', () => {
      const tools = getReportTools()

      expect(tools.list_reports.needsApproval).toBeUndefined()
      expect(tools.get_report.needsApproval).toBeUndefined()
    })
  })

  describe('list_reports', () => {
    it('should list reports with summary fields, forwarding the authorization header', async () => {
      vi.mocked(getContent).mockResolvedValue({
        cursor: undefined,
        content: [
          {
            id: 'report-1',
            name: 'Home',
            description: undefined,
            visibility: 'project',
            updated_at: '2026-01-01T00:00:00.000Z',
            type: 'report',
            content: {
              schema_version: 1,
              period_start: { time_period: '7d' },
              period_end: { time_period: 'today' },
              interval: '1d',
              layout: [{ id: 'a' }, { id: 'b' }],
            },
          } as unknown as Content,
        ],
      })

      const tools = getReportTools({ projectRef: 'test-project', authorization: 'Bearer token' })
      if (!tools.list_reports.execute) throw new Error('execute is undefined')

      const result = await tools.list_reports.execute(
        { limit: 20 },
        { toolCallId: 'test', messages: [] }
      )

      expect(getContent).toHaveBeenCalledWith(
        { projectRef: 'test-project', type: 'report', limit: 20 },
        undefined,
        { Authorization: 'Bearer token' }
      )
      expect(result).toEqual([
        {
          id: 'report-1',
          name: 'Home',
          description: undefined,
          visibility: 'project',
          updated_at: '2026-01-01T00:00:00.000Z',
          chart_count: 2,
        },
      ])
    })
  })

  describe('get_report', () => {
    it('should resolve snippet_ chart blocks to their SQL', async () => {
      vi.mocked(getContentById).mockImplementation(async ({ id }) => {
        if (id === 'report-1') {
          return {
            id: 'report-1',
            name: 'My report',
            description: undefined,
            visibility: 'project',
            type: 'report',
            content: {
              schema_version: 1,
              period_start: { time_period: '7d' },
              period_end: { time_period: 'today' },
              interval: '1d',
              layout: [
                {
                  id: 'snippet-1',
                  attribute: 'snippet_snippet-1',
                  x: 0,
                  y: 0,
                  w: 1,
                  h: 1,
                  label: 'My query',
                  provider: 'daily-stats',
                  chart_type: 'bar',
                },
                {
                  id: 'total_egress',
                  attribute: 'total_egress',
                  x: 1,
                  y: 0,
                  w: 1,
                  h: 1,
                  label: 'Egress',
                  provider: 'daily-stats',
                  chart_type: 'bar',
                },
              ],
            },
          } as unknown as ContentIdData
        }

        if (id === 'snippet-1') {
          return {
            id: 'snippet-1',
            name: 'My query',
            type: 'sql',
            content: { content_id: 'snippet-1', unchecked_sql: 'select 1', schema_version: '1' },
          } as unknown as ContentIdData
        }

        throw new Error(`Unexpected id: ${id}`)
      })

      const tools = getReportTools({ projectRef: 'test-project' })
      if (!tools.get_report.execute) throw new Error('execute is undefined')

      const result = (await tools.get_report.execute(
        { id: 'report-1' },
        { toolCallId: 'test', messages: [] }
      )) as { layout: Array<{ id: string; attribute: string; sql?: string }> }

      expect(result.layout).toEqual([
        expect.objectContaining({
          id: 'snippet-1',
          attribute: 'snippet_snippet-1',
          sql: 'select 1',
        }),
        expect.objectContaining({ id: 'total_egress', attribute: 'total_egress' }),
      ])
      expect(result.layout[1].sql).toBeUndefined()
    })

    it('should throw when the content id is not a report', async () => {
      vi.mocked(getContentById).mockResolvedValue({
        id: 'snippet-1',
        type: 'sql',
        content: { content_id: 'snippet-1', unchecked_sql: 'select 1', schema_version: '1' },
      } as unknown as ContentIdData)

      const tools = getReportTools({ projectRef: 'test-project' })
      if (!tools.get_report.execute) throw new Error('execute is undefined')

      await expect(
        tools.get_report.execute({ id: 'snippet-1' }, { toolCallId: 'test', messages: [] })
      ).rejects.toThrow('is not a report')
    })
  })
})
