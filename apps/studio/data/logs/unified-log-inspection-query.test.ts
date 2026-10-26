import { platformComponents } from 'api-types'
import { HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { z } from 'zod'

import { getUnifiedLogInspection } from './unified-log-inspection-query'
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
