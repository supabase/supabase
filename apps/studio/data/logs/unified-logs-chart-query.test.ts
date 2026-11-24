import type { platformComponents } from 'api-types'
import { HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { getUnifiedLogsChart } from './unified-logs-chart-query'
import { createUnifiedLogsSearch } from '@/components/interfaces/UnifiedLogs/UnifiedLogs.utils'
import { addAPIMock } from '@/tests/lib/msw'

type AnalyticsResponse = platformComponents['schemas']['AnalyticsResponse_Output']
const timestamp = new Date('2026-05-08T09:00:00Z').getTime()

describe('unified logs without a severity', () => {
  it.each([
    { filter: undefined, expected: 4 },
    { filter: ['level:eq:error'], expected: 0 },
    { filter: ['level:neq:error'], expected: 0 },
  ])('keeps Compute activity visible with filter $filter', async ({ filter, expected }) => {
    addAPIMock({
      method: 'post',
      path: '/platform/projects/:ref/analytics/endpoints/logs.all.otel',
      response: () =>
        HttpResponse.json<AnalyticsResponse>({
          result: [
            {
              time_bucket: '2026-05-08T09:00:00',
              success: 0,
              warning: 0,
              error: 0,
              total_per_bucket: 4,
            },
          ],
        }),
    })
    const data = await getUnifiedLogsChart({
      projectRef: 'default',
      useOtel: true,
      search: {
        ...createUnifiedLogsSearch({
          filter,
          date: [new Date(timestamp), new Date(timestamp + 60000)],
        }),
        availableLogTypes: ['compute'],
      },
    })
    expect(data.find((bucket) => bucket.timestamp === timestamp)).toEqual({
      timestamp,
      success: 0,
      warning: 0,
      error: 0,
      no_level: expected,
    })
    expect(data.find((bucket) => bucket.timestamp === timestamp + 60000)?.no_level).toBe(0)
  })
})
