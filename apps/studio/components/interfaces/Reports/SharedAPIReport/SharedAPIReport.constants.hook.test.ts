import { waitFor } from '@testing-library/react'
import { useFeatureFlags, useFlag, useParams } from 'common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useSharedAPIReport } from './SharedAPIReport.constants'
import { executeAnalyticsSql } from '@/data/logs/execute-analytics-sql'
import { customRenderHook } from '@/tests/lib/custom-render'

vi.mock('common', async (importOriginal) => {
  const actual = await importOriginal<typeof import('common')>()
  return {
    ...actual,
    useFlag: vi.fn(),
    useFeatureFlags: vi.fn(),
    useParams: vi.fn(),
  }
})

vi.mock('@/data/logs/execute-analytics-sql', () => ({
  executeAnalyticsSql: vi.fn().mockResolvedValue({ result: [] }),
}))

describe('useSharedAPIReport', () => {
  beforeEach(() => {
    vi.mocked(useParams).mockReturnValue({ ref: 'project-ref' })
    vi.mocked(executeAnalyticsSql).mockClear()
  })

  it('does not fetch until the feature flag store has loaded', async () => {
    vi.mocked(useFlag).mockReturnValue(false)
    vi.mocked(useFeatureFlags).mockReturnValue({ configcat: {}, posthog: {}, hasLoaded: false })

    const { rerender } = customRenderHook(() =>
      useSharedAPIReport({ filterBy: 'auth', start: 'start', end: 'end' })
    )

    await new Promise((resolve) => setTimeout(resolve, 10))
    expect(executeAnalyticsSql).not.toHaveBeenCalled()

    vi.mocked(useFlag).mockReturnValue(true)
    vi.mocked(useFeatureFlags).mockReturnValue({
      configcat: { otelReports: true },
      posthog: {},
      hasLoaded: true,
    })
    rerender()

    await waitFor(() => expect(executeAnalyticsSql).toHaveBeenCalled())
    expect(executeAnalyticsSql).toHaveBeenCalledWith(
      expect.objectContaining({
        endpoint: '/platform/projects/{ref}/analytics/endpoints/logs.all.otel',
      })
    )
  })
})
