import { HttpResponse } from 'msw'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'

import { getEdgeFunctionsLastHourStats } from './edge-functions-last-hour-stats-query'
import { addAPIMock } from '@/tests/lib/msw'

const requestBodySchema = z.object({
  sql: z.string(),
  iso_timestamp_start: z.string(),
  iso_timestamp_end: z.string(),
})

type CapturedRequest = {
  endpoint?: string
  key?: string | null
  body?: z.infer<typeof requestBodySchema>
}

function mockLogsEndpoint(result: unknown[] = []) {
  const captured: CapturedRequest = {}
  for (const endpoint of ['logs.all', 'logs.all.otel'] as const) {
    addAPIMock({
      method: 'post',
      path: `/platform/projects/:ref/analytics/endpoints/${endpoint}`,
      response: async ({ request, params }) => {
        expect(params.ref).toBe('project-ref')
        captured.endpoint = endpoint
        captured.key = new URL(request.url).searchParams.get('key')
        captured.body = requestBodySchema.parse(await request.json())
        return HttpResponse.json({ result })
      },
    })
  }
  return captured
}

describe('getEdgeFunctionsLastHourStats', () => {
  beforeEach(() => {
    // Only fake Date so MSW's own timers keep running.
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2024-01-15T12:00:00.000Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('requests last-hour function stats from logs.all by default', async () => {
    const captured = mockLogsEndpoint()

    await getEdgeFunctionsLastHourStats({
      projectRef: 'project-ref',
      functionIds: ['fn_1', 'fn_2'],
    })

    expect(captured.endpoint).toBe('logs.all')
    expect(captured.key).toBe('last-hour-stats')
    expect(captured.body).toMatchObject({
      iso_timestamp_start: '2024-01-15T11:00:00.000Z',
      iso_timestamp_end: '2024-01-15T12:00:00.000Z',
    })
    expect(captured.body?.sql).toContain(`and function_id in ('fn_1', 'fn_2')`)
    expect(captured.body?.sql).toContain('from\n  function_edge_logs')
  })

  it('requests last-hour function stats from logs.all.otel when useOtel is set', async () => {
    const captured = mockLogsEndpoint()

    await getEdgeFunctionsLastHourStats({
      projectRef: 'project-ref',
      functionIds: ['fn_1', 'fn_2'],
      useOtel: true,
    })

    expect(captured.endpoint).toBe('logs.all.otel')
    expect(captured.key).toBe('last-hour-stats')
    expect(captured.body).toMatchObject({
      iso_timestamp_start: '2024-01-15T11:00:00.000Z',
      iso_timestamp_end: '2024-01-15T12:00:00.000Z',
    })
    const sql = captured.body?.sql ?? ''
    expect(sql).toContain(`and log_attributes['function_id'] in ('fn_1', 'fn_2')`)
    expect(sql).toContain('from logs')
    expect(sql).toContain("source = 'function_edge_logs'")
    expect(sql).toContain("case when toInt32OrZero(log_attributes['response.status_code']) >= 500")
    expect(sql).not.toContain('cross join unnest')
  })

  it('coerces counts to numbers and computes error rates per function', async () => {
    mockLogsEndpoint([
      { function_id: 'fn_1', requests_count: '100', server_err_count: '5' },
      { function_id: 'fn_2', requests_count: 8, server_err_count: 0 },
    ])

    const result = await getEdgeFunctionsLastHourStats({
      projectRef: 'project-ref',
      functionIds: ['fn_1', 'fn_2'],
    })

    expect(result).toEqual({
      fn_1: { functionId: 'fn_1', requestsCount: 100, serverErrorCount: 5, errorRate: 5 },
      fn_2: { functionId: 'fn_2', requestsCount: 8, serverErrorCount: 0, errorRate: 0 },
    })
  })

  it('skips the logs query when there are no function ids', async () => {
    // No handler registered: an outgoing request would fail the test.
    const result = await getEdgeFunctionsLastHourStats({
      projectRef: 'project-ref',
      functionIds: [],
    })

    expect(result).toEqual({})
  })
})
