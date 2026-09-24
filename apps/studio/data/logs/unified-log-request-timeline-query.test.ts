import { QueryClient } from '@tanstack/react-query'
import type { platformComponents } from 'api-types'
import { HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { unifiedLogRequestTimelineQueryOptions } from './unified-log-request-timeline-query'
import { addAPIMock, type APIErrorBody } from '@/tests/lib/msw'

type LogsResponse = platformComponents['schemas']['AnalyticsResponse_Output']
const variables = {
  projectRef: 'default',
  logId: 'gateway',
  source: 'edge_logs',
  logTimestampMs: Date.parse('2026-01-01T10:00:00Z'),
}
const fetchTimeline = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false } } }).fetchQuery(
    unifiedLogRequestTimelineQueryOptions(variables)
  )
const step = (id: string, source: string, metadata: Record<string, string>) => ({
  id,
  source,
  metadata,
  timestamp: '2026-01-01T10:00:00.000000',
  log_type: 'edge function',
  status: '200',
  level: 'success',
  pathname: '/functions/v1/test',
  event_message: 'Request',
  method: 'POST',
  auth_user: null,
  log_count: null,
  logs: null,
})

describe('request timeline query', () => {
  it('follows an execution ID from a request and stops after two lookups', async () => {
    const requests: { sql: string; iso_timestamp_start: string; iso_timestamp_end: string }[] = []
    const invocation = step('invocation', 'function_edge_logs', { execution_id: 'exec-1' })
    const consoleLog = step('console', 'function_logs', { execution_id: 'exec-2' })
    addAPIMock({
      method: 'post',
      path: '/platform/projects/:ref/analytics/endpoints/logs.all.otel',
      response: async ({ request }) => {
        const body = (await request.json()) as (typeof requests)[number]
        requests.push(body)
        if (body.sql.includes('log attributes')) {
          return HttpResponse.json<LogsResponse>({
            result: [
              { source: 'edge_logs', log_attributes: { 'request.headers.cf_ray': 'ray-1' } },
            ],
          })
        }
        return HttpResponse.json<LogsResponse>({
          result: requests.length === 2 ? [invocation] : [invocation, consoleLog],
        })
      },
    })
    const result = await fetchTimeline()
    expect(result.logs.map((log) => log.id)).toEqual(['invocation', 'console'])
    expect(requests).toHaveLength(3)
    expect(requests[2].sql).toContain("log_attributes['execution_id'] IN ('exec-1')")
    expect(requests[2]).toMatchObject({
      iso_timestamp_start: '2026-01-01T09:55:00.000Z',
      iso_timestamp_end: '2026-01-01T10:05:00.000Z',
    })
  })

  it.each([
    { result: [] },
    { result: [{ source: 'postgres_logs', log_attributes: { request_id: 'unsupported' } }] },
  ])('returns no related logs without correlation IDs: %j', async ({ result }) => {
    let requests = 0
    addAPIMock({
      method: 'post',
      path: '/platform/projects/:ref/analytics/endpoints/logs.all.otel',
      response: () => {
        requests++
        return HttpResponse.json<LogsResponse>({ result })
      },
    })
    await expect(fetchTimeline()).resolves.toEqual({ requestIds: [], executionIds: [], logs: [] })
    expect(requests).toBe(1)
  })

  it('propagates failed lookups', async () => {
    addAPIMock({
      method: 'post',
      path: '/platform/projects/:ref/analytics/endpoints/logs.all.otel',
      response: () => HttpResponse.json<APIErrorBody>({ message: 'Unavailable' }, { status: 500 }),
    })
    await expect(fetchTimeline()).rejects.toThrow('Unavailable')
  })
})
