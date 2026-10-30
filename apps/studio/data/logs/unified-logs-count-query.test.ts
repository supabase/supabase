import { platformComponents } from 'api-types'
import { HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { getUnifiedLogsCount } from './unified-logs-count-query'
import { createUnifiedLogsSearch } from '@/components/interfaces/UnifiedLogs/UnifiedLogs.utils'
import { addAPIMock } from '@/tests/lib/msw'

type AnalyticsResponse = platformComponents['schemas']['AnalyticsResponse_Output']

const search = createUnifiedLogsSearch({ filter: ['level:eq:error'] })

describe('unified log counts', () => {
  it.each([
    'Count query failed',
    { code: 400, message: 'Count query failed', status: 'INVALID_ARGUMENT', errors: [] },
  ])('rejects an analytics error instead of reporting zero matching logs: %j', async (error) => {
    addAPIMock({
      method: 'post',
      path: '/platform/projects/:ref/analytics/endpoints/logs.all.otel',
      response: () => HttpResponse.json<AnalyticsResponse>({ error }),
    })

    await expect(
      getUnifiedLogsCount({ projectRef: 'default', search, useOtel: true })
    ).rejects.toThrow('Count query failed')
  })
})

it.each([true, false])('reads Pipelines counts from the expected backend %s', async (useOtel) => {
  addAPIMock({
    method: 'post',
    path: useOtel
      ? '/platform/projects/:ref/analytics/endpoints/logs.all.otel'
      : '/platform/projects/:ref/analytics/endpoints/logs.all',
    response: () =>
      HttpResponse.json<AnalyticsResponse>({
        result: [
          { facet: 'total', value: 'all', count: 2 },
          { facet: 'log_type', value: 'pipelines', count: 2 },
          { facet: 'level', value: 'error', count: 1 },
        ],
      }),
  })
  const counts = await getUnifiedLogsCount({
    projectRef: 'default',
    search: createUnifiedLogsSearch({ filter: ['log_type:eq:pipelines'] }),
    useOtel,
  })
  expect(counts.totalRowCount).toBe(2)
  expect(counts.facets.log_type.rows).toEqual([{ value: 'pipelines', total: 2 }])
})
