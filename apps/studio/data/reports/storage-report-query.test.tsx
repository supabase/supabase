import { QueryClient } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { platformComponents } from 'api-types'
import { FeatureFlagContext, type FeatureFlagContextType } from 'common'
import { HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'

import { useStorageReport } from './storage-report-query'
import { CustomWrapper } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'

vi.mock('common', async (importOriginal) => {
  const actual = await importOriginal<typeof import('common')>()
  return {
    ...actual,
    IS_PLATFORM: true,
    useParams: () => ({ ref: 'default' }),
  }
})

vi.mock('@/lib/constants', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/constants')>()
  return { ...actual, IS_PLATFORM: true }
})

type AnalyticsResponse = platformComponents['schemas']['AnalyticsResponse_Output']

describe('useStorageReport', () => {
  it('waits for flags before sending matching ClickHouse SQL to the OTEL endpoint', async () => {
    const legacySql: string[] = []
    const otelSql: string[] = []

    addAPIMock({
      method: 'get',
      path: '/platform/projects/:ref/analytics/endpoints/logs.all',
      response: ({ request }) => {
        legacySql.push(new URL(request.url).searchParams.get('sql') ?? '')
        return HttpResponse.json<AnalyticsResponse>({ result: [] })
      },
    })
    addAPIMock({
      method: 'get',
      path: '/platform/projects/:ref/analytics/endpoints/logs.all.otel',
      response: ({ request }) => {
        otelSql.push(new URL(request.url).searchParams.get('sql') ?? '')
        return HttpResponse.json<AnalyticsResponse>({ result: [] })
      },
    })

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })
    let flags: FeatureFlagContextType = { configcat: {}, posthog: {}, hasLoaded: false }
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <FeatureFlagContext.Provider value={flags}>
        <CustomWrapper queryClient={queryClient}>{children}</CustomWrapper>
      </FeatureFlagContext.Provider>
    )

    const { result, rerender } = renderHook(() => useStorageReport(), { wrapper })

    await act(async () => {
      await Promise.resolve()
      await result.current.refresh()
    })

    expect(result.current.isLoading).toBe(true)
    expect(legacySql).toHaveLength(0)
    expect(otelSql).toHaveLength(0)

    flags = { configcat: { otelReports: true }, posthog: {}, hasLoaded: true }
    rerender()

    await waitFor(() => expect(otelSql.length).toBeGreaterThan(0))
    await waitFor(() => expect(queryClient.isFetching()).toBe(0))

    expect(legacySql).toHaveLength(0)
    for (const sql of otelSql) {
      expect(sql).toContain('from logs')
      expect(sql).toContain("source = 'edge_logs'")
      expect(sql).not.toContain('from edge_logs')
      expect(sql).not.toContain('cross join unnest')
    }
  })
})
