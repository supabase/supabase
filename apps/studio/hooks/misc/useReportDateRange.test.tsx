import { QueryClient } from '@tanstack/react-query'
import { act, waitFor } from '@testing-library/react'
import dayjs from 'dayjs'
import { describe, expect, test } from 'vitest'

import { useReportDateRange } from './useReportDateRange'
import { organizationKeys } from '@/data/organizations/keys'
import { projectKeys } from '@/data/projects/keys'
import { customRenderHook } from '@/tests/lib/custom-render'

const hoursAgo = (hours: number) => dayjs().subtract(hours, 'hour').toISOString()

const render = (searchParams?: Record<string, string>) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  })
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
  return customRenderHook(() => useReportDateRange(), {
    queryClient,
    nuqs: { hasMemory: true, searchParams },
  })
}

describe('useReportDateRange retention entitlement', () => {
  test('handleDatePickerChange prompts for a start 36 hours ago with a one-day entitlement', async () => {
    const { result } = render()
    await waitFor(() => expect(result.current.isOrgPlanLoading).toBe(false))

    let isLocked = false
    act(() => {
      isLocked = result.current.handleDatePickerChange({
        from: hoursAgo(36),
        to: dayjs().toISOString(),
        isHelper: false,
      })
    })

    expect(isLocked).toBe(true)
    expect(result.current.showUpgradePrompt).toBe(true)
  })

  test('handleDatePickerChange accepts a start inside the entitlement', async () => {
    const { result } = render()
    await waitFor(() => expect(result.current.isOrgPlanLoading).toBe(false))

    let isLocked = true
    act(() => {
      isLocked = result.current.handleDatePickerChange({
        from: hoursAgo(12),
        to: dayjs().toISOString(),
        isHelper: false,
      })
    })

    expect(isLocked).toBe(false)
    expect(result.current.showUpgradePrompt).toBe(false)
  })

  test('ignores a stored start 36 hours ago and falls back to the default range', async () => {
    const stored = hoursAgo(36)
    const { result } = render({ its: stored, ite: dayjs().toISOString() })
    await waitFor(() => expect(result.current.isOrgPlanLoading).toBe(false))

    expect(result.current.selectedDateRange.period_start.date).not.toBe(stored)
  })

  test('keeps a stored start inside the entitlement', async () => {
    const stored = hoursAgo(12)
    const { result } = render({ its: stored, ite: dayjs().toISOString() })
    await waitFor(() => expect(result.current.isOrgPlanLoading).toBe(false))

    expect(result.current.selectedDateRange.period_start.date).toBe(stored)
  })
})
