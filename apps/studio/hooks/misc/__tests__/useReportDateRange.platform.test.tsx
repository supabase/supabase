import { QueryClient } from '@tanstack/react-query'
import { act } from '@testing-library/react'
import dayjs from 'dayjs'
import { describe, expect, test } from 'vitest'

import { REPORT_DATERANGE_HELPER_LABELS } from '@/components/interfaces/Reports/Reports.constants'
import { organizationKeys } from '@/data/organizations/keys'
import { projectKeys } from '@/data/projects/keys'
import { useReportDateRange } from '@/hooks/misc/useReportDateRange'
import { customRenderHook } from '@/tests/lib/custom-render'

const freePlanQueryClient = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity } } })
  queryClient.setQueryData(projectKeys.detail('default'), { organization_id: 1 })
  queryClient.setQueryData(organizationKeys.list(), [
    { id: 1, slug: 'free-org', plan: { id: 'free' } },
  ])
  queryClient.setQueryData(organizationKeys.entitlements('free-org'), {
    entitlements: [
      {
        feature: { key: 'log.retention_days' },
        type: 'numeric',
        config: { enabled: true, unlimited: false, value: 1 },
      },
    ],
  })
  return queryClient
}

describe('fixed report retention', () => {
  test.each([7, 30])(
    'allows a %s-day range on a free plan without an upgrade prompt',
    async (days) => {
      const { result } = customRenderHook(
        () =>
          useReportDateRange(REPORT_DATERANGE_HELPER_LABELS.LAST_60_MINUTES, { retentionDays: 30 }),
        { queryClient: freePlanQueryClient() }
      )
      const from = dayjs().subtract(days, 'day').toISOString()
      const to = dayjs().toISOString()

      await act(async () => {
        expect(result.current.handleDatePickerChange({ from, to })).toBe(false)
      })

      expect(result.current.selectedDateRange.period_start.date).toBe(from)
      expect(result.current.showUpgradePrompt).toBe(false)
    }
  )

  test('preserves plan-based retention for existing reports', async () => {
    const { result } = customRenderHook(() => useReportDateRange(), {
      queryClient: freePlanQueryClient(),
    })
    const from = dayjs().subtract(7, 'day').toISOString()

    await act(async () => {
      expect(result.current.handleDatePickerChange({ from, to: dayjs().toISOString() })).toBe(true)
    })

    expect(result.current.showUpgradePrompt).toBe(true)
    expect(result.current.selectedDateRange.period_start.date).not.toBe(from)
  })
})
