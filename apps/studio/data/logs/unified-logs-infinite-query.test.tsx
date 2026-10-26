import { waitFor } from '@testing-library/react'
import { platformComponents } from 'api-types'
import { FeatureFlagContext } from 'common'
import { HttpResponse } from 'msw'
import { expect, it } from 'vitest'
import { z } from 'zod'

import { useUnifiedLogsInfiniteQuery } from './unified-logs-infinite-query'
import { createUnifiedLogsSearch } from '@/components/interfaces/UnifiedLogs/UnifiedLogs.utils'
import { customRenderHook, CustomWrapper } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'

type AnalyticsResponse = platformComponents['schemas']['AnalyticsResponse_Output']
const requestSchema = z.object({ sql: z.string() })

it.each([false, true])(
  'uses the legacy flag only for unscoped log queries: scoped=%s',
  async (isScoped) => {
    const queries: string[] = []
    addAPIMock({
      method: 'post',
      path: isScoped
        ? '/platform/projects/:ref/analytics/endpoints/logs.all.otel'
        : '/platform/projects/:ref/analytics/endpoints/logs.all',
      response: async ({ request }) => {
        queries.push(requestSchema.parse(await request.json()).sql)
        return HttpResponse.json<AnalyticsResponse>({ result: [] })
      },
    })
    const scope = isScoped
      ? {
          filters: [{ column: 'function_id', operator: '=' as const, value: 'fn-123' }],
        }
      : undefined
    const { result } = customRenderHook(
      () =>
        useUnifiedLogsInfiniteQuery({
          projectRef: 'default',
          search: createUnifiedLogsSearch({}, scope),
        }),
      {
        wrapper: ({ children }) => (
          <CustomWrapper>
            <FeatureFlagContext.Provider
              value={{ configcat: { otelUnifiedLogs: false }, posthog: {}, hasLoaded: true }}
            >
              {children}
            </FeatureFlagContext.Provider>
          </CustomWrapper>
        ),
      }
    )
    await waitFor(() => expect(result.current.isFetching).toBe(false))
    expect(result.current.isSuccess).toBe(true)
    expect(queries).toHaveLength(1)
    if (isScoped) expect(queries[0]).toContain("log_attributes['function_id'] IN ('fn-123')")
  }
)
