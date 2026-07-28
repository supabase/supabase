import { act } from '@testing-library/react'
import dayjs from 'dayjs'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { useReportDateRange } from './useReportDateRange'
import { REPORT_DATERANGE_HELPER_LABELS } from '@/components/interfaces/Reports/Reports.constants'
import { customRenderHook } from '@/tests/lib/custom-render'

const { mockGetEntitlementMax, mockGetEntitlementNumericValue } = vi.hoisted(() => ({
  mockGetEntitlementMax: vi.fn(),
  mockGetEntitlementNumericValue: vi.fn(),
}))

vi.mock('@/hooks/misc/useCheckEntitlements', () => ({
  useCheckEntitlements: () => ({
    getEntitlementMax: mockGetEntitlementMax,
    getEntitlementNumericValue: mockGetEntitlementNumericValue,
  }),
}))

vi.mock('@/hooks/misc/useCurrentOrgPlan', () => ({
  useCurrentOrgPlan: () => ({ plan: { id: 'team' }, isLoading: false }),
}))

describe('useReportDateRange', () => {
  beforeEach(() => {
    mockGetEntitlementMax.mockReset()
    mockGetEntitlementNumericValue.mockReset()
  })

  test('selecting Last 7 days applies the range when the org is entitled per getEntitlementMax', () => {
    // Org's `log.retention_days` entitlement is unlimited, so `getEntitlementMax` correctly
    // reports no cap, even though the raw numeric value (`getEntitlementNumericValue`) still
    // carries a low placeholder that would wrongly gate a 7-day range if it were used instead.
    mockGetEntitlementMax.mockReturnValue(Number.MAX_SAFE_INTEGER)
    mockGetEntitlementNumericValue.mockReturnValue(1)

    const { result } = customRenderHook(() =>
      useReportDateRange(REPORT_DATERANGE_HELPER_LABELS.LAST_60_MINUTES)
    )

    const from = dayjs().subtract(7, 'day').toISOString()
    const to = dayjs().toISOString()

    act(() => {
      result.current.handleDatePickerChange({
        from,
        to,
        isHelper: true,
        text: REPORT_DATERANGE_HELPER_LABELS.LAST_7_DAYS,
      })
    })

    expect(result.current.showUpgradePrompt).toBe(false)
    expect(result.current.selectedDateRange.period_start.date).toBe(from)
    expect(result.current.selectedDateRange.period_end.date).toBe(to)
  })

  test('selecting a range beyond the entitled cap shows the upgrade prompt instead of applying it', () => {
    mockGetEntitlementMax.mockReturnValue(1)
    mockGetEntitlementNumericValue.mockReturnValue(1)

    const { result } = customRenderHook(() =>
      useReportDateRange(REPORT_DATERANGE_HELPER_LABELS.LAST_60_MINUTES)
    )

    const from = dayjs().subtract(7, 'day').toISOString()
    const to = dayjs().toISOString()

    act(() => {
      result.current.handleDatePickerChange({
        from,
        to,
        isHelper: true,
        text: REPORT_DATERANGE_HELPER_LABELS.LAST_7_DAYS,
      })
    })

    expect(result.current.showUpgradePrompt).toBe(true)
    expect(result.current.selectedDateRange.period_start.date).not.toBe(from)
  })
})
