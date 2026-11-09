import { platformComponents } from 'api-types'
import { HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { z } from 'zod'

import { getUnifiedLogInspection } from './unified-log-inspection-query'
import { getUnifiedLogsCount } from './unified-logs-count-query'
import { getUnifiedLogs } from './unified-logs-infinite-query'
import { getEdgeFunctionLogsScope } from '@/components/interfaces/Functions/EdgeFunctionOverview/EdgeFunctionOverview.utils'
import { createUnifiedLogsSearch } from '@/components/interfaces/UnifiedLogs/UnifiedLogs.utils'
import { addAPIMock } from '@/tests/lib/msw'

type AnalyticsResponse = platformComponents['schemas']['AnalyticsResponse_Output']
const search = createUnifiedLogsSearch(
  { date: [new Date('2026-11-09T13:00:00Z'), new Date('2026-11-09T14:00:00Z')] },
  getEdgeFunctionLogsScope('hello')
)
const row = (id: string, isRuntime: boolean) => ({
  id,
  timestamp: 1794231480000000,
  log_type: isRuntime ? 'edge function runtime' : 'edge function',
  status: isRuntime ? null : '500',
  level: 'error',
  pathname: isRuntime ? null : '/hello',
  method: isRuntime ? null : 'GET',
  event_message: id,
  log_count: null,
  logs: null,
  metadata: [{ function_id: 'hello', execution_id: 'worker-1' }],
})
const sqlSchema = z.object({ sql: z.string() })

describe('self-hosted function logs', () => {
  it('merges both sources in stable order and paginates tied timestamps', async () => {
    const queries: string[] = []
    addAPIMock({
      method: 'post',
      path: '/platform/projects/:ref/analytics/endpoints/logs.all',
      response: async ({ request }) => {
        const { sql } = sqlSchema.parse(await request.json())
        queries.push(sql)
        expect(sql).toMatch(/(?:request|runtime)_metadata.function_id = 'hello'/)
        const runtime = sql.includes('FROM function_logs')
        let result = runtime ? [row('d', true), row('b', true)] : [row('c', false), row('a', false)]
        if (sql.includes("JSON_VALUE(id, '$') < 'c'")) result = result.filter(({ id }) => id < 'c')
        return HttpResponse.json<AnalyticsResponse>({ result })
      },
    })
    const first = await getUnifiedLogs({
      projectRef: 'default',
      search,
      pageParam: null,
      pageSize: 2,
    })
    expect(first.data.map(({ id }) => id)).toEqual(['d', 'c'])
    expect(first.data[0]).toMatchObject({
      metadata: { function_id: 'hello', execution_id: 'worker-1' },
    })
    const second = await getUnifiedLogs({
      projectRef: 'default',
      search,
      pageParam: { direction: 'next', cursor: first.nextCursor!, row: first.nextRow! },
      pageSize: 2,
    })
    expect(second.data.map(({ id }) => id)).toEqual(['b', 'a'])
    expect(queries.slice(2).every((sql) => sql.includes("JSON_VALUE(id, '$') < 'c'"))).toBe(true)
  })

  it('adds counts across sources without treating error rows as unique invocations', async () => {
    addAPIMock({
      method: 'post',
      path: '/platform/projects/:ref/analytics/endpoints/logs.all',
      response: async ({ request }) => {
        const { sql } = sqlSchema.parse(await request.json())
        const facet = sql.includes("'total' AS facet")
          ? 'total'
          : sql.includes("'level' AS facet")
            ? 'level'
            : 'log_type'
        const value =
          facet === 'total'
            ? 'all'
            : facet === 'level'
              ? 'error'
              : sql.includes('FROM function_logs')
                ? 'edge function runtime'
                : 'edge function'
        return HttpResponse.json<AnalyticsResponse>({ result: [{ facet, value, count: 1 }] })
      },
    })
    const counts = await getUnifiedLogsCount({ projectRef: 'default', search })
    expect(counts.totalRowCount).toBe(2)
    expect(counts.facets.level.rows).toEqual([{ value: 'error', total: 2 }])
    expect(counts.facets.log_type.rows).toEqual(
      expect.arrayContaining([
        { value: 'edge function', total: 1 },
        { value: 'edge function runtime', total: 1 },
      ])
    )
  })

  it('keeps related worker logs within the function and time range', async () => {
    const queries: string[] = []
    addAPIMock({
      method: 'post',
      path: '/platform/projects/:ref/analytics/endpoints/logs.all',
      response: async ({ request }) => {
        const body = z
          .object({
            sql: z.string(),
            iso_timestamp_start: z.string(),
            iso_timestamp_end: z.string(),
          })
          .parse(await request.json())
        queries.push(body.sql)
        expect(body.iso_timestamp_start).toBe('2026-11-09T13:00:00.000Z')
        const related = body.sql.includes("runtime_metadata.execution_id = 'worker-1'")
        return HttpResponse.json<AnalyticsResponse>({
          result: related
            ? [row('runtime', true)]
            : body.sql.includes('FROM function_edge_logs')
              ? [row('request', false)]
              : [],
        })
      },
    })
    const data = await getUnifiedLogInspection({
      projectRef: 'default',
      logId: 'request',
      type: 'edge-function',
      search,
    })
    expect(data.result[0]).toMatchObject({
      function_id: 'hello',
      execution_id: 'worker-1',
      function_log_count: 1,
    })
    expect(queries[2]).toContain("runtime_metadata.function_id = 'hello'")
  })

  it('rejects partial results when one source fails', async () => {
    addAPIMock({
      method: 'post',
      path: '/platform/projects/:ref/analytics/endpoints/logs.all',
      response: async ({ request }) => {
        const { sql } = sqlSchema.parse(await request.json())
        return HttpResponse.json<AnalyticsResponse>(
          sql.includes('FROM function_logs')
            ? { error: 'Logflare unavailable' }
            : { result: [row('a', false)] }
        )
      },
    })
    await expect(
      getUnifiedLogs({ projectRef: 'default', search, pageParam: null })
    ).rejects.toMatchObject({ message: 'Logflare unavailable' })
  })
})
