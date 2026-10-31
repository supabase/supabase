import { QueryClient } from '@tanstack/react-query'
import type { platformComponents } from 'api-types'
import { HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { unifiedLogAttributesQueryOptions } from './unified-log-attributes-query'
import { getLogAttributesQuery } from '@/components/interfaces/UnifiedLogs/UnifiedLogs.queries'
import { addAPIMock, type APIErrorBody } from '@/tests/lib/msw'

type LogsResponse = platformComponents['schemas']['AnalyticsResponse_Output']
const variables = {
  projectRef: 'default',
  logId: 'log-1',
  source: 'edge_logs',
  logTimestampMs: Date.parse('2026-01-01T10:00:00Z'),
}
const fetchAttributes = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false } } }).fetchQuery(
    unifiedLogAttributesQueryOptions(variables)
  )

describe('log attributes', () => {
  it('escapes IDs and sources and limits the lookup to one row', () => {
    const sql = getLogAttributesQuery({ logId: "log'1", source: "source'1" })
    expect(sql).toContain("id = 'log''1' AND source = 'source''1'")
    expect(sql).toContain('LIMIT 1')
  })

  it('fetches attributes within one minute of the log timestamp', async () => {
    let body: unknown
    addAPIMock({
      method: 'post',
      path: '/platform/projects/:ref/analytics/endpoints/logs.all.otel',
      response: async ({ request }) => {
        body = await request.json()
        return HttpResponse.json<LogsResponse>({
          result: [{ source: 'edge_logs', log_attributes: { 'request.method': 'GET' } }],
        })
      },
    })
    await expect(fetchAttributes()).resolves.toEqual({
      source: 'edge_logs',
      log_attributes: { 'request.method': 'GET' },
    })
    expect(body).toMatchObject({
      iso_timestamp_start: '2026-01-01T09:59:00.000Z',
      iso_timestamp_end: '2026-01-01T10:01:00.000Z',
    })
  })

  it.each([{ result: [] }, { result: [{ source: 'edge_logs', log_attributes: null }] }])(
    'preserves the source when attributes are absent: %j',
    async ({ result }) => {
      addAPIMock({
        method: 'post',
        path: '/platform/projects/:ref/analytics/endpoints/logs.all.otel',
        response: () => HttpResponse.json<LogsResponse>({ result }),
      })
      await expect(fetchAttributes()).resolves.toEqual(result[0] ?? null)
    }
  )

  it('rejects malformed rows', async () => {
    addAPIMock({
      method: 'post',
      path: '/platform/projects/:ref/analytics/endpoints/logs.all.otel',
      response: () => HttpResponse.json<LogsResponse>({ result: [{ source: 42 }] }),
    })
    await expect(fetchAttributes()).rejects.toThrow()
  })

  it('propagates failed requests', async () => {
    addAPIMock({
      method: 'post',
      path: '/platform/projects/:ref/analytics/endpoints/logs.all.otel',
      response: () => HttpResponse.json<APIErrorBody>({ message: 'Unavailable' }, { status: 500 }),
    })
    await expect(fetchAttributes()).rejects.toThrow('Unavailable')
  })
})
