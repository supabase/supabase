import { components } from 'api-types'
import { HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { getReportTools } from './report-tools'
import { addAPIMock, type APIErrorBody } from '@/tests/lib/msw'

type GetUserContentByIdResponse = components['schemas']['GetUserContentByIdResponse']

describe('ai/tools/report-tools', () => {
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
      let capturedRequest: Request | undefined

      addAPIMock({
        method: 'get',
        path: '/platform/projects/:ref/content',
        response: ({ request }) => {
          capturedRequest = request
          return HttpResponse.json({
            data: [
              {
                id: 'report-1',
                name: 'Home',
                description: undefined,
                visibility: 'project',
                favorite: false,
                folder_id: null,
                inserted_at: '2026-01-01T00:00:00.000Z',
                updated_at: '2026-01-01T00:00:00.000Z',
                owner_id: 1,
                owner: { id: 1, username: 'test' },
                updated_by: { id: 1, username: 'test' },
                project_id: 1,
                type: 'report',
                content: {
                  schema_version: 1,
                  period_start: { time_period: '7d' },
                  period_end: { time_period: 'today' },
                  interval: '1d',
                  layout: [{ id: 'a' }, { id: 'b' }],
                },
              },
            ],
          })
        },
      })

      const tools = getReportTools({ projectRef: 'test-project', authorization: 'Bearer token' })
      if (!tools.list_reports.execute) throw new Error('execute is undefined')

      const result = await tools.list_reports.execute(
        { limit: 20 },
        { toolCallId: 'test', messages: [] }
      )

      expect(capturedRequest?.headers.get('authorization')).toBe('Bearer token')
      const url = new URL(capturedRequest!.url)
      expect(url.pathname).toContain('/projects/test-project/content')
      expect(url.searchParams.get('type')).toBe('report')
      expect(url.searchParams.get('limit')).toBe('20')

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
      addAPIMock({
        method: 'get',
        path: '/platform/projects/:ref/content/item/:id',
        response: ({ params }) => {
          if (params.id === 'report-1') {
            return HttpResponse.json<GetUserContentByIdResponse>({
              id: 'report-1',
              name: 'My report',
              description: undefined,
              visibility: 'project',
              favorite: false,
              folder_id: null,
              inserted_at: '2026-01-01T00:00:00.000Z',
              updated_at: '2026-01-01T00:00:00.000Z',
              owner_id: 1,
              project_id: 1,
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
            })
          }

          if (params.id === 'snippet-1') {
            return HttpResponse.json<GetUserContentByIdResponse>({
              id: 'snippet-1',
              name: 'My query',
              description: undefined,
              visibility: 'user',
              favorite: false,
              folder_id: null,
              inserted_at: '2026-01-01T00:00:00.000Z',
              updated_at: '2026-01-01T00:00:00.000Z',
              owner_id: 1,
              project_id: 1,
              type: 'sql',
              content: { content_id: 'snippet-1', sql: 'select 1', schema_version: '1' },
            })
          }

          return HttpResponse.json<APIErrorBody>(
            { message: `Unexpected id: ${params.id}` },
            { status: 404 }
          )
        },
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
      addAPIMock({
        method: 'get',
        path: '/platform/projects/:ref/content/item/:id',
        response: () =>
          HttpResponse.json<GetUserContentByIdResponse>({
            id: 'snippet-1',
            name: 'My query',
            description: undefined,
            visibility: 'user',
            favorite: false,
            folder_id: null,
            inserted_at: '2026-01-01T00:00:00.000Z',
            updated_at: '2026-01-01T00:00:00.000Z',
            owner_id: 1,
            project_id: 1,
            type: 'sql',
            content: { content_id: 'snippet-1', sql: 'select 1', schema_version: '1' },
          }),
      })

      const tools = getReportTools({ projectRef: 'test-project' })
      if (!tools.get_report.execute) throw new Error('execute is undefined')

      await expect(
        tools.get_report.execute({ id: 'snippet-1' }, { toolCallId: 'test', messages: [] })
      ).rejects.toThrow('is not a report')
    })
  })
})
