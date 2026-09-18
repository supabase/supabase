import { QueryClient } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { platformComponents } from 'api-types'
import { FeatureFlagContext, type FeatureFlagContextType } from 'common'
import { HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'

import { useStorageReport } from './storage-report-query'
import { CustomWrapper } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'

const route = vi.hoisted(() => ({ ref: undefined as string | undefined }))

vi.mock('common', async (importOriginal) => {
  const actual = await importOriginal<typeof import('common')>()
  return {
    ...actual,
    IS_PLATFORM: true,
    useParams: () => ({ ref: route.ref }),
  }
})

vi.mock('@/lib/constants', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/constants')>()
  return { ...actual, IS_PLATFORM: true }
})

type AnalyticsResponse = platformComponents['schemas']['AnalyticsResponse_Output']

describe('useStorageReport', () => {
  it('waits for a project ref before sending matching ClickHouse SQL to the OTEL endpoint', async () => {
    const legacyRequests: Array<{ projectRef: string; sql: string }> = []
    const otelRequests: Array<{ projectRef: string; sql: string }> = []

    addAPIMock({
      method: 'get',
      path: '/platform/projects/:ref/analytics/endpoints/logs.all',
      response: ({ request, params }) => {
        legacyRequests.push({
          projectRef: String(params.ref),
          sql: new URL(request.url).searchParams.get('sql') ?? '',
        })
        return HttpResponse.json<AnalyticsResponse>({ result: [] })
      },
    })
    addAPIMock({
      method: 'get',
      path: '/platform/projects/:ref/analytics/endpoints/logs.all.otel',
      response: ({ request, params }) => {
        otelRequests.push({
          projectRef: String(params.ref),
          sql: new URL(request.url).searchParams.get('sql') ?? '',
        })
        return HttpResponse.json<AnalyticsResponse>({ result: [] })
      },
    })

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })
    const flags: FeatureFlagContextType = {
      configcat: { otelReports: true },
      posthog: {},
      hasLoaded: true,
    }
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <FeatureFlagContext.Provider value={flags}>
        <CustomWrapper queryClient={queryClient}>{children}</CustomWrapper>
      </FeatureFlagContext.Provider>
    )

    route.ref = undefined
    const { rerender } = renderHook(() => useStorageReport(), { wrapper })

    await act(async () => {
      await Promise.resolve()
    })

    expect(legacyRequests).toHaveLength(0)
    expect(otelRequests).toHaveLength(0)

    route.ref = 'real-project-ref'
    rerender()

    await waitFor(() => expect(otelRequests).toHaveLength(9))

    expect(legacyRequests).toHaveLength(0)
    for (const { projectRef, sql } of otelRequests) {
      expect(projectRef).toBe('real-project-ref')
      expect(sql).toContain('from logs')
    }
  })
})
