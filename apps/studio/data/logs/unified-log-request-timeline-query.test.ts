import { QueryClient } from '@tanstack/react-query'
import type { platformComponents } from 'api-types'
import { HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { z } from 'zod'

import { unifiedLogAttributesQueryOptions } from './unified-log-attributes-query'
import { unifiedLogRequestTimelineQueryOptions } from './unified-log-request-timeline-query'
import { addAPIMock, type APIErrorBody } from '@/tests/lib/msw'

type LogsResponse = platformComponents['schemas']['AnalyticsResponse_Output']
const requestSchema = z.object({
  sql: z.string(),
  iso_timestamp_start: z.string(),
  iso_timestamp_end: z.string(),
})
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
  timestamp: '2026-01-01T10:00:00.000000Z',
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

const matchesCorrelationSql = (row: ReturnType<typeof step>, sql: string) =>
  [...sql.matchAll(/\(source = '([^']+)' AND \((.*?)\)\)/g)].some(([, source, conditions]) => {
    if (source !== row.source) return false
    return [...conditions.matchAll(/log_attributes\['([^']+)'\] IN \(([^)]*)/g)].some(
      ([, key, values]) =>
        [...values.matchAll(/'([^']+)'/g)].some(([, value]) => row.metadata[key] === value)
    )
  })

describe('request timeline query', () => {
  it.each(['attributes first', 'timeline first', 'concurrently'])(
    'shares the attribute lookup with the overview: %s',
    async (order) => {
      const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
      const root = { source: 'edge_logs', log_attributes: { 'request.headers.cf_ray': 'ray-1' } }
      const related = step('invocation', 'function_edge_logs', {})
      const requests: string[] = []
      addAPIMock({
        method: 'post',
        path: '/platform/projects/:ref/analytics/endpoints/logs.all.otel',
        response: async ({ request }) => {
          const { sql } = requestSchema.parse(await request.json())
          requests.push(sql)
          return HttpResponse.json<LogsResponse>({
            result: sql.includes('SELECT source, log_attributes') ? [root] : [related],
          })
        },
      })
      const attributes = () => client.fetchQuery(unifiedLogAttributesQueryOptions(variables))
      const timeline = () => client.fetchQuery(unifiedLogRequestTimelineQueryOptions(variables))

      if (order === 'attributes first') {
        await attributes()
        await timeline()
      } else if (order === 'timeline first') {
        await timeline()
        await attributes()
      } else {
        await Promise.all([attributes(), timeline()])
      }

      expect(client.getQueryData(unifiedLogAttributesQueryOptions(variables).queryKey)).toEqual(
        root
      )
      expect(
        client
          .getQueryData(unifiedLogRequestTimelineQueryOptions(variables).queryKey)
          ?.logs.map((log) => log.id)
      ).toEqual(['invocation'])

      expect(requests.filter((sql) => sql.includes('SELECT source, log_attributes'))).toHaveLength(
        1
      )
      expect(requests).toHaveLength(2)
    }
  )

  it('cancels a timeline without cancelling the shared overview lookup', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    let releaseResponse = () => {}
    const responseReady = new Promise<void>((resolve) => {
      releaseResponse = resolve
    })
    let markStarted = () => {}
    const started = new Promise<void>((resolve) => {
      markStarted = resolve
    })
    const root = { source: 'edge_logs', log_attributes: { 'request.headers.cf_ray': 'ray-1' } }
    const requests: string[] = []
    addAPIMock({
      method: 'post',
      path: '/platform/projects/:ref/analytics/endpoints/logs.all.otel',
      response: async ({ request }) => {
        const { sql } = requestSchema.parse(await request.json())
        requests.push(sql)
        markStarted()
        await responseReady
        return HttpResponse.json<LogsResponse>({ result: [root] })
      },
    })
    const timelineOptions = unifiedLogRequestTimelineQueryOptions(variables)
    const cancelled = expect(client.fetchQuery(timelineOptions)).rejects.toThrow()
    const attributes = client.fetchQuery(unifiedLogAttributesQueryOptions(variables))
    await started
    await client.cancelQueries({ queryKey: timelineOptions.queryKey, exact: true })
    releaseResponse()

    await cancelled
    await expect(attributes).resolves.toEqual(root)
    expect(requests).toHaveLength(1)
  })

  it('includes function output at the 400-second execution limit', async () => {
    const requests: z.infer<typeof requestSchema>[] = []
    const gateway = {
      ...step('gateway', 'edge_logs', { 'request.headers.cf_ray': 'ray-1' }),
      log_type: 'edge',
    }
    const invocation = {
      ...step('invocation', 'function_edge_logs', {
        'request.headers.cf_ray': 'ray-1',
        execution_id: 'exec-1',
      }),
      timestamp: new Date(variables.logTimestampMs + 400 * 1000).toISOString(),
    }
    const consoleLog = {
      ...step('console', 'function_logs', { execution_id: 'exec-1' }),
      timestamp: invocation.timestamp,
      log_type: 'edge function runtime',
    }
    addAPIMock({
      method: 'post',
      path: '/platform/projects/:ref/analytics/endpoints/logs.all.otel',
      response: async ({ request }) => {
        const body = requestSchema.parse(await request.json())
        requests.push(body)
        if (body.sql.includes('SELECT source, log_attributes')) {
          return HttpResponse.json<LogsResponse>({
            result: [{ source: 'edge_logs', log_attributes: gateway.metadata }],
          })
        }
        const candidates = body.sql.includes("log_attributes['execution_id'] IN ('exec-1')")
          ? [gateway, invocation, consoleLog]
          : [gateway, invocation]
        const start = Date.parse(body.iso_timestamp_start)
        const end = Date.parse(body.iso_timestamp_end)
        return HttpResponse.json<LogsResponse>({
          result: candidates.filter(({ timestamp }) => {
            const time = Date.parse(timestamp)
            return time >= start && time <= end
          }),
        })
      },
    })
    const result = await fetchTimeline()
    expect(result.logs.map((log) => log.id)).toEqual(['gateway', 'invocation', 'console'])
    expect(result.executionIds).toEqual(['exec-1'])
    expect(requests).toHaveLength(3)
    expect(requests[2].sql).toContain("log_attributes['execution_id'] IN ('exec-1')")
  })

  it.each(['edge_logs', 'auth_logs', 'storage_logs', 'function_logs'])(
    'finds the same request from %s without matching another ID namespace',
    async (source) => {
      const requestId = '01a1880e-a158-7005-9fdf-e9ee66e4b6ad'
      const related = [
        step('gateway', 'edge_logs', { request_id: requestId }),
        step('auth', 'auth_logs', { request_id: requestId }),
        step('storage', 'storage_logs', { request_id: requestId }),
        step('runtime', 'function_logs', { request_id: requestId }),
      ]
      const unrelated = [
        step('different-request', 'auth_logs', {
          request_id: '01a1880e-9c51-7997-af59-c80f5e04628f',
        }),
        step('execution-collision', 'function_logs', { execution_id: requestId }),
        step('ray-collision', 'edge_logs', { 'request.headers.cf_ray': requestId }),
        step('unknown-source', 'unknown_logs', { request_id: requestId }),
      ]
      const requests: string[] = []
      addAPIMock({
        method: 'post',
        path: '/platform/projects/:ref/analytics/endpoints/logs.all.otel',
        response: async ({ request, params }) => {
          expect(params.ref).toBe('default')
          const body = requestSchema.parse(await request.json())
          requests.push(body.sql)
          if (body.sql.includes('SELECT source, log_attributes')) {
            return HttpResponse.json<LogsResponse>({
              result: [{ source, log_attributes: { request_id: requestId } }],
            })
          }
          expect(body.iso_timestamp_start).toBe('2026-01-01T09:53:00.000Z')
          expect(body.iso_timestamp_end).toBe('2026-01-01T10:07:00.000Z')
          return HttpResponse.json<LogsResponse>({
            result: [...related, ...unrelated].filter((row) =>
              matchesCorrelationSql(row, body.sql)
            ),
          })
        },
      })
      const result = await new QueryClient({
        defaultOptions: { queries: { retry: false } },
      }).fetchQuery(unifiedLogRequestTimelineQueryOptions({ ...variables, source }))
      expect(result.logs.map((log) => log.id)).toEqual(['gateway', 'auth', 'storage', 'runtime'])
      expect(requests).toHaveLength(2)
    }
  )

  it('discovers a trace through a request and includes its child spans across services', async () => {
    const requestId = '01a1880e-a158-7005-9fdf-e9ee66e4b6ad'
    const traceId = '69110a42ebc24cb5a63d00fc2e8017a4'
    const spanId = '467867d205824e7d'
    const candidates = [
      step('auth', 'auth_logs', { request_id: requestId }),
      step('gateway', 'edge_logs', { request_id: requestId, trace_id: traceId, span_id: spanId }),
      step('storage-child', 'storage_logs', {
        trace_id: traceId,
        span_id: '32c5a2f5c8cff132',
        parent_span_id: spanId,
      }),
      step('different-trace', 'storage_logs', { trace_id: 'a'.repeat(32), span_id: spanId }),
      step('standalone-span', 'function_logs', { span_id: spanId, parent_span_id: spanId }),
      step('trace-request-collision', 'auth_logs', { request_id: traceId }),
    ]
    const requests: string[] = []
    addAPIMock({
      method: 'post',
      path: '/platform/projects/:ref/analytics/endpoints/logs.all.otel',
      response: async ({ request }) => {
        const { sql } = requestSchema.parse(await request.json())
        requests.push(sql)
        if (sql.includes('SELECT source, log_attributes')) {
          return HttpResponse.json<LogsResponse>({
            result: [{ source: 'auth_logs', log_attributes: { request_id: requestId } }],
          })
        }
        return HttpResponse.json<LogsResponse>({
          result: candidates.filter((row) => matchesCorrelationSql(row, sql)),
        })
      },
    })
    const result = await fetchTimeline()
    expect(result.logs.map((log) => log.id)).toEqual(['auth', 'gateway', 'storage-child'])
    expect(requests).toHaveLength(3)
    expect(requests[2]).not.toContain("log_attributes['span_id'] IN")
    expect(requests[2]).not.toContain("log_attributes['parent_span_id'] IN")
  })

  it.each([{ result: [] }, { result: [{ source: 'edge_logs', log_attributes: {} }] }])(
    'returns no related logs without correlation IDs: %j',
    async ({ result }) => {
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
    }
  )

  it('propagates failed lookups', async () => {
    addAPIMock({
      method: 'post',
      path: '/platform/projects/:ref/analytics/endpoints/logs.all.otel',
      response: () => HttpResponse.json<APIErrorBody>({ message: 'Unavailable' }, { status: 500 }),
    })
    await expect(fetchTimeline()).rejects.toThrow('Unavailable')
  })
})
