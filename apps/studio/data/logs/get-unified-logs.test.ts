import { HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { retrieveUnifiedLogs } from './get-unified-logs'
import { addAPIMock } from '@/tests/lib/msw'

const OTEL_ENDPOINT = '/platform/projects/:ref/analytics/endpoints/logs.all.otel'

const search = {
  date: [new Date('2026-09-29T11:00:00Z'), new Date('2026-09-29T12:00:00Z')],
} as any

function mockExport(response: Record<string, unknown>) {
  const requests: { sql: string; iso_timestamp_start: string; iso_timestamp_end: string }[] = []
  addAPIMock({
    method: 'post',
    path: OTEL_ENDPOINT,
    response: async ({ request }) => {
      requests.push(await request.clone().json())
      return HttpResponse.json(response)
    },
  })
  return requests
}

describe('retrieveUnifiedLogs', () => {
  it('sends the row-list query with the requested limit over the search range', async () => {
    const requests = mockExport({ result: [] })

    await retrieveUnifiedLogs({ projectRef: 'default', search, limit: 500, useOtel: true })

    expect(requests).toHaveLength(1)
    expect(requests[0].sql).toContain('ORDER BY timestamp DESC, id DESC LIMIT 500')
    expect(requests[0].iso_timestamp_start).toBe('2026-09-29T11:00:00.000Z')
    expect(requests[0].iso_timestamp_end).toBe('2026-09-29T12:00:00.000Z')
  })

  it('maps returned rows', async () => {
    mockExport({
      result: [
        {
          id: 'a',
          timestamp: '2026-09-29T11:59:00.000000',
          log_type: 'edge',
          level: 'success',
          status: '200',
          method: 'GET',
          pathname: '/rest/v1/items',
          event_message: 'GET /rest/v1/items',
          log_count: null,
          logs: null,
        },
      ],
    })

    const rows = await retrieveUnifiedLogs({
      projectRef: 'default',
      search,
      limit: 100,
      useOtel: true,
    })

    expect(rows).toHaveLength(1)
    expect(rows[0].id).toBe('a')
    expect(rows[0].event_message).toBe('GET /rest/v1/items')
  })

  it('throws when the endpoint reports a query error inside a successful response', async () => {
    mockExport({ error: 'Query failed: memory limit exceeded' })

    await expect(
      retrieveUnifiedLogs({ projectRef: 'default', search, limit: 100, useOtel: true })
    ).rejects.toThrow('memory limit exceeded')
  })

  it('rejects a non-finite limit instead of sending it', async () => {
    const requests = mockExport({ result: [] })

    await expect(
      retrieveUnifiedLogs({ projectRef: 'default', search, limit: NaN, useOtel: true })
    ).rejects.toThrow('non-finite')
    expect(requests).toHaveLength(0)
  })
})
