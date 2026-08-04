import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { useShowUpgradeCta } from '../useShowUpgradeCta'

const { mockIsPlatform, mockUseSelectedOrganizationQuery } = vi.hoisted(() => ({
  mockIsPlatform: { value: true },
  mockUseSelectedOrganizationQuery: vi.fn(),
}))

vi.mock('@/lib/constants', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('@/lib/constants')
  return {
    ...actual,
    get IS_PLATFORM() {
      return mockIsPlatform.value
    },
  }
})

vi.mock('@/hooks/misc/useSelectedOrganization', () => ({
  useSelectedOrganizationQuery: mockUseSelectedOrganizationQuery,
}))

const freePlanOrg = { plan: { id: 'free' } }
const paidPlanOrg = { plan: { id: 'pro' } }

describe('useShowUpgradeCta', () => {
  beforeEach(() => {
    mockIsPlatform.value = true
    mockUseSelectedOrganizationQuery.mockReset()
  })

  test('hosted free plan: shows the CTA', () => {
    mockUseSelectedOrganizationQuery.mockReturnValue({ data: freePlanOrg, isPending: false })

    const { result } = renderHook(() => useShowUpgradeCta())

    expect(result.current).toEqual({ isFreePlan: true, showUpgradeCta: true })
  })

  test('hosted paid plan: hides the CTA', () => {
    mockUseSelectedOrganizationQuery.mockReturnValue({ data: paidPlanOrg, isPending: false })

    const { result } = renderHook(() => useShowUpgradeCta())

    expect(result.current).toEqual({ isFreePlan: false, showUpgradeCta: false })
  })

  test('self-hosted: never shows the CTA, even on a free plan', () => {
    mockIsPlatform.value = false
    mockUseSelectedOrganizationQuery.mockReturnValue({ data: freePlanOrg, isPending: false })

    const { result } = renderHook(() => useShowUpgradeCta())

    expect(result.current.showUpgradeCta).toBe(false)
  })

  test('plan still loading: hides the CTA until the org resolves', () => {
    mockUseSelectedOrganizationQuery.mockReturnValue({ data: undefined, isPending: true })

    const { result } = renderHook(() => useShowUpgradeCta())

    expect(result.current).toEqual({ isFreePlan: false, showUpgradeCta: false })
  })

  test('missing / errored organization: hides the CTA', () => {
    mockUseSelectedOrganizationQuery.mockReturnValue({ data: undefined, isPending: false })

    const { result } = renderHook(() => useShowUpgradeCta())

    expect(result.current).toEqual({ isFreePlan: false, showUpgradeCta: false })
  })

  test('enabled: false — hides the CTA and does not fetch organization data', () => {
    mockUseSelectedOrganizationQuery.mockReturnValue({ data: undefined, isPending: true })

    const { result } = renderHook(() => useShowUpgradeCta({ enabled: false }))

    expect(result.current.showUpgradeCta).toBe(false)
    expect(mockUseSelectedOrganizationQuery).toHaveBeenCalledWith({ enabled: false })
  })

  test('enabled + hosted: fetches organization data', () => {
    mockUseSelectedOrganizationQuery.mockReturnValue({ data: freePlanOrg, isPending: false })

    renderHook(() => useShowUpgradeCta({ enabled: true }))

    expect(mockUseSelectedOrganizationQuery).toHaveBeenCalledWith({ enabled: true })
  })
})
