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
          const { sql } = (await request.json()) as { sql: string }
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
      // Request count is the contract here: consumers share both cached and in-flight data.
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
        const { sql } = (await request.json()) as { sql: string }
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

  it.each([350, 400])(
    'includes function output %s seconds after the gateway request',
    async (durationSeconds) => {
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
        timestamp: new Date(variables.logTimestampMs + durationSeconds * 1000).toISOString(),
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
    }
  )

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
