import { QueryClient } from '@tanstack/react-query'
import { act, waitFor } from '@testing-library/react'
import { FeatureFlagContext } from 'common'
import dayjs from 'dayjs'
import { HttpResponse } from 'msw'
import { describe, expect, test } from 'vitest'

import { useStorageReport } from './storage-report-query'
import type { components } from '@/data/api'
import { organizationKeys } from '@/data/organizations/keys'
import { projectKeys } from '@/data/projects/keys'
import { useReportDateRange } from '@/hooks/misc/useReportDateRange'
import { customRenderHook, CustomWrapper } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'

type LogsResponse = components['schemas']['AnalyticsResponse_Output']

describe('storage report date range', () => {
  test.each([false, true])('loads and refreshes the URL range with otel=%s', async (useOtel) => {
    const start = dayjs().subtract(3, 'hour').toISOString()
    const end = dayjs().subtract(2, 'hour').toISOString()
    const requests: { start: string | null; end: string | null }[] = []
    let requestCount = 0
    addAPIMock({
      method: 'get',
      path: useOtel
        ? '/platform/projects/:ref/analytics/endpoints/logs.all.otel'
        : '/platform/projects/:ref/analytics/endpoints/logs.all',
      response: ({ request }) => {
        const params = new URL(request.url).searchParams
        requests.push({
          start: params.get('iso_timestamp_start'),
          end: params.get('iso_timestamp_end'),
        })
        requestCount += 1
        return HttpResponse.json<LogsResponse>({ result: [{ count: requestCount }] })
      },
    })
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, staleTime: Infinity } },
    })
    queryClient.setQueryData(projectKeys.detail('default'), { organization_id: 1 })
    queryClient.setQueryData(organizationKeys.list(), [
      { id: 1, slug: 'test-org', plan: { id: 'free' } },
    ])
    queryClient.setQueryData(organizationKeys.entitlements('test-org'), {
      entitlements: [],
    })

    const { result } = customRenderHook(
      () => {
        const { selectedDateRange, handleDatePickerChange } = useReportDateRange()
        const report = useStorageReport(selectedDateRange)
        return { report, handleDatePickerChange }
      },
      {
        wrapper: ({ children }) => (
          <FeatureFlagContext.Provider
            value={{ configcat: { otelReports: useOtel }, posthog: {}, hasLoaded: true }}
          >
            <CustomWrapper
              queryClient={queryClient}
              nuqs={{ hasMemory: true, searchParams: { its: start, ite: end } }}
            >
              {children}
            </CustomWrapper>
          </FeatureFlagContext.Provider>
        ),
      }
    )

    await waitFor(() => expect(result.current.report.isLoading).toBe(false))
    expect(requests).toHaveLength(9)
    expect(requests).toEqual(Array.from({ length: 9 }, () => ({ start, end })))
    const initialTotalRequests = result.current.report.data.totalRequests

    act(() => {
      void result.current.report.refresh()
    })

    await waitFor(() => expect(requests).toHaveLength(18))
    await waitFor(() => expect(result.current.report.isLoading).toBe(false))
    expect(result.current.report.data.totalRequests).not.toEqual(initialTotalRequests)
    expect(requests.slice(9)).toEqual(Array.from({ length: 9 }, () => ({ start, end })))

    const nextStart = dayjs().subtract(6, 'hour').toISOString()
    const nextEnd = dayjs().subtract(5, 'hour').toISOString()
    act(() => {
      result.current.handleDatePickerChange({ from: nextStart, to: nextEnd, isHelper: false })
    })
    await waitFor(() => expect(requests).toHaveLength(27))
    expect(requests.slice(18)).toEqual(
      Array.from({ length: 9 }, () => ({ start: nextStart, end: nextEnd }))
    )
  })
})
