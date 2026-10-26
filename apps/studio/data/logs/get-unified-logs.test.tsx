import { act } from '@testing-library/react'
import { platformComponents } from 'api-types'
import { HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { z } from 'zod'

import { retrieveUnifiedLogs, useGetUnifiedLogsMutation } from './get-unified-logs'
import { createUnifiedLogsSearch } from '@/components/interfaces/UnifiedLogs/UnifiedLogs.utils'
import { customRenderHook } from '@/tests/lib/custom-render'
import { addAPIMock, type APIErrorBody } from '@/tests/lib/msw'

type AnalyticsResponse = platformComponents['schemas']['AnalyticsResponse_Output']
const requestSchema = z.object({ sql: z.string() })
const scopedSearch = createUnifiedLogsSearch(
  {},
  {
    filters: [{ column: 'function_id', operator: '=', value: 'fn-123' }],
  }
)

const mockExport = (useOtel: boolean) => {
  const queries: string[] = []
  addAPIMock({
    method: 'post',
    path: useOtel
      ? '/platform/projects/:ref/analytics/endpoints/logs.all.otel'
      : '/platform/projects/:ref/analytics/endpoints/logs.all',
    response: async ({ request }) => {
      queries.push(requestSchema.parse(await request.json()).sql)
      return HttpResponse.json<AnalyticsResponse>({ result: [] })
    },
  })
  return queries
}

describe('unified log exports', () => {
  it('keeps direct scoped exports on ClickHouse even when the caller requests BigQuery', async () => {
    const queries = mockExport(true)
    await expect(
      retrieveUnifiedLogs({
        projectRef: 'default',
        search: scopedSearch,
        limit: 10,
        useOtel: false,
      })
    ).resolves.toEqual([])
    expect(queries).toHaveLength(1)
    expect(queries[0]).toContain("log_attributes['function_id'] IN ('fn-123')")
  })

  it('keeps scoped mutation exports on ClickHouse despite an explicit legacy override', async () => {
    const queries = mockExport(true)
    const { result } = customRenderHook(() => useGetUnifiedLogsMutation())
    await act(async () => {
      await expect(
        result.current.mutateAsync({
          projectRef: 'default',
          search: scopedSearch,
          limit: 10,
          useOtel: false,
        })
      ).resolves.toEqual([])
    })
    expect(queries).toHaveLength(1)
    expect(queries[0]).toContain("log_attributes['function_id'] IN ('fn-123')")
  })

  it('reports a failed scoped export without falling back to an unscoped backend', async () => {
    const queries: string[] = []
    addAPIMock({
      method: 'post',
      path: '/platform/projects/:ref/analytics/endpoints/logs.all.otel',
      response: async ({ request }) => {
        queries.push(requestSchema.parse(await request.json()).sql)
        return HttpResponse.json<APIErrorBody>(
          { message: 'Analytics unavailable' },
          { status: 503 }
        )
      },
    })
    await expect(
      retrieveUnifiedLogs({
        projectRef: 'default',
        search: scopedSearch,
        limit: 10,
        useOtel: false,
      })
    ).rejects.toMatchObject({ message: 'Analytics unavailable' })
    expect(queries).toHaveLength(1)
    expect(queries[0]).toContain("log_attributes['function_id'] IN ('fn-123')")
  })

  it.each([false, true])('preserves unscoped exports choosing otel=%s', async (useOtel) => {
    const queries = mockExport(useOtel)
    await expect(
      retrieveUnifiedLogs({
        projectRef: 'default',
        search: createUnifiedLogsSearch(),
        limit: 10,
        useOtel,
      })
    ).resolves.toEqual([])
    expect(queries).toHaveLength(1)
    expect(queries[0]).not.toContain("log_attributes['function_id']")
  })
})
