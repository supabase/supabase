import { QueryClient } from '@tanstack/react-query'
import { act } from '@testing-library/react'
import dayjs from 'dayjs'
import { describe, expect, test } from 'vitest'

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

describe('organization log retention', () => {
  test.each([7, 30])(
    'requires an upgrade for a %s-day range beyond log retention',
    async (days) => {
      const { result } = customRenderHook(() => useReportDateRange(), {
        queryClient: freePlanQueryClient(),
      })
      const from = dayjs().subtract(days, 'day').toISOString()

      await act(async () => {
        expect(result.current.handleDatePickerChange({ from, to: dayjs().toISOString() })).toBe(
          true
        )
      })

      expect(result.current.showUpgradePrompt).toBe(true)
      expect(result.current.selectedDateRange.period_start.date).not.toBe(from)
    }
  )
})
