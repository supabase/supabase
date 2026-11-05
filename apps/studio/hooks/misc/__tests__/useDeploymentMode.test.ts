// @vitest-environment jsdom
import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { useDeploymentMode } from '../useDeploymentMode'

const { mockIsPlatform, mockUseDeploymentModeQuery } = vi.hoisted(() => ({
  mockIsPlatform: { value: false },
  mockUseDeploymentModeQuery: vi.fn(),
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

vi.mock('@/data/config/deployment-mode-query', () => ({
  useDeploymentModeQuery: mockUseDeploymentModeQuery,
}))

describe('useDeploymentMode', () => {
  beforeEach(() => {
    mockIsPlatform.value = false
    mockUseDeploymentModeQuery.mockReset()
  })

  test('platform build: returns isPlatform regardless of query state', () => {
    mockIsPlatform.value = true
    mockUseDeploymentModeQuery.mockReturnValue({ data: undefined })

    const { result } = renderHook(() => useDeploymentMode())

    expect(result.current).toEqual({
      isPlatform: true,
      isCli: false,
      isSelfHosted: false,
    })
  })

  // Loading (data undefined) defaults to CLI via the `?? true` flip — see useDeploymentMode for
  // the asymmetry rationale: `'direct'` is the only universally-valid connection method.
  test.each([
    ['loading window (data undefined)', undefined, { isCli: true, isSelfHosted: false }],
    ['resolved is_cli_mode=true', { is_cli_mode: true }, { isCli: true, isSelfHosted: false }],
    ['resolved is_cli_mode=false', { is_cli_mode: false }, { isCli: false, isSelfHosted: true }],
  ])('non-platform, %s', (_, data, expected) => {
    mockUseDeploymentModeQuery.mockReturnValue({ data })

    const { result } = renderHook(() => useDeploymentMode())

    expect(result.current).toEqual({ isPlatform: false, ...expected })
  })

  test('returns a stable reference across renders when primitive flags do not change', () => {
    // Distinct `data` object refs with equal contents — pins memoization on the
    // primitive flags (`[isCli, isSelfHosted]`), not on the `data` reference.
    mockUseDeploymentModeQuery
      .mockReturnValueOnce({ data: { is_cli_mode: false } })
      .mockReturnValueOnce({ data: { is_cli_mode: false } })

    const { result, rerender } = renderHook(() => useDeploymentMode())
    const first = result.current
    rerender()

    expect(result.current).toBe(first)
  })
})
