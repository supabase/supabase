import { platformComponents } from 'api-types'
import { HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { z } from 'zod'

import { getUnifiedLogInspection } from './unified-log-inspection-query'
import { postgresStatementFields } from '@/components/interfaces/UnifiedLogs/ServiceFlow/config/serviceFlowFields'
import { createUnifiedLogsSearch } from '@/components/interfaces/UnifiedLogs/UnifiedLogs.utils'
import { addAPIMock } from '@/tests/lib/msw'

type AnalyticsResponse = platformComponents['schemas']['AnalyticsResponse_Output']
const requestSchema = z.object({ sql: z.string() })
const scope = {
  filters: [
    { column: 'log_type', operator: '=' as const, value: 'edge function' },
    { column: 'log_type', operator: '=' as const, value: 'edge function runtime' },
    { column: 'function_id', operator: '=' as const, value: 'fn-123' },
  ],
}

const mockInspection = () => {
  const queries: string[] = []
  addAPIMock({
    method: 'post',
    path: '/platform/projects/:ref/analytics/endpoints/logs.all',
    response: () => HttpResponse.json<AnalyticsResponse>({ result: [] }),
  })
  addAPIMock({
    method: 'post',
    path: '/platform/projects/:ref/analytics/endpoints/logs.all.otel',
    response: async ({ request }) => {
      queries.push(requestSchema.parse(await request.json()).sql)
      const result =
        queries.length === 1
          ? [
              {
                id: 'aa11',
                timestamp: '2026-05-08T09:30:00.000000',
                source: 'function_edge_logs',
                event_message: 'invocation',
                log_attributes: { execution_id: 'bb22', function_id: 'fn-123' },
              },
            ]
          : []
      return HttpResponse.json<AnalyticsResponse>({ result })
    },
  })
  return queries
}

describe('unified log inspection scope', () => {
  it('restricts both the selected invocation and its console output to the fixed function', async () => {
    const queries = mockInspection()
    await expect(
      getUnifiedLogInspection({
        projectRef: 'default',
        logId: 'aa11',
        type: 'edge-function',
        search: createUnifiedLogsSearch({}, scope),
        useOtel: false,
      })
    ).resolves.toMatchObject({ result: [{ id: 'aa11' }] })
    expect(queries).toHaveLength(2)
    expect(queries[0]).toContain("id = 'aa11' AND source = 'function_edge_logs'")
    expect(queries[1]).toContain(
      "source = 'function_logs' AND log_attributes['execution_id'] = 'bb22'"
    )
    for (const sql of queries) {
      expect(sql).toContain("log_attributes['function_id'] IN ('fn-123')")
      expect(sql).toContain("((source = 'function_edge_logs') OR (source = 'function_logs'))")
    }
  })

  it('keeps ordinary invocation inspection and console output available without a scope', async () => {
    const queries = mockInspection()
    await expect(
      getUnifiedLogInspection({
        projectRef: 'default',
        logId: 'aa11',
        type: 'edge-function',
        search: createUnifiedLogsSearch(),
        useOtel: true,
      })
    ).resolves.toMatchObject({ result: [{ id: 'aa11' }] })
    expect(queries).toHaveLength(2)
    for (const sql of queries) expect(sql).not.toContain("log_attributes['function_id']")
  })
})

describe('Postgres inspection hints', () => {
  it('retrieves the Postgres hint for the statement overview on BigQuery', async () => {
    const queries: string[] = []
    addAPIMock({
      method: 'post',
      path: '/platform/projects/:ref/analytics/endpoints/logs.all',
      response: async ({ request }) => {
        queries.push(requestSchema.parse(await request.json()).sql)
        return HttpResponse.json<AnalyticsResponse>({ result: [{ hint: 'Check the column name' }] })
      },
    })
    const data = await getUnifiedLogInspection({
      projectRef: 'default',
      logId: 'postgres-log',
      type: 'postgres',
      search: createUnifiedLogsSearch(),
      useOtel: false,
    })
    expect(queries[0]).toContain('pgl_parsed.hint as hint')
    const hint = postgresStatementFields.find((field) => field.id === 'hint')
    expect(hint?.getValue({}, data?.result?.[0])).toBe('Check the column name')
  })

  it('shows the hint from OTEL attributes in the statement overview', () => {
    const hint = postgresStatementFields.find((field) => field.id === 'hint')
    expect(hint?.getValue({}, { 'parsed.hint': 'Check the column name' })).toBe(
      'Check the column name'
    )
  })
})
