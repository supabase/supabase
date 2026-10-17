import { renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useAccountRecoveryAdvice } from './useAccountRecoveryAdvice'

const mockUseAccountRecovery = vi.hoisted(() => vi.fn())

vi.mock('@/hooks/misc/useAccountRecovery', () => ({
  useAccountRecovery: mockUseAccountRecovery,
}))

describe('useAccountRecoveryAdvice preview', () => {
  beforeEach(() => {
    vi.stubEnv('NODE_ENV', 'development')
    mockUseAccountRecovery.mockReturnValue({ findings: [], isPending: false, isError: false })
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    window.history.replaceState({}, '', '/')
    vi.clearAllMocks()
  })

  it.each([
    ['exhausted', 'recovery-codes-exhausted'],
    ['missing', 'recovery-codes-missing'],
    ['low', 'recovery-codes-low'],
    ['single-identity', 'single-oauth-identity'],
    ['single-factor', 'single-mfa-factor'],
  ])('previews %s using the shared evaluator', (preview, type) => {
    window.history.replaceState({}, '', `/?mockAccountAdvisor=${preview}`)
    const { result } = renderHook(() => useAccountRecoveryAdvice())

    expect(result.current.map((item) => item.type)).toEqual([type])
    expect(mockUseAccountRecovery).toHaveBeenCalledWith({ enabled: false })
  })

  it('uses live findings without a preview and respects the enabled option', () => {
    mockUseAccountRecovery.mockReturnValue({
      findings: [{ id: 'single-mfa-factor', severity: 'info', action: 'add-factor' }],
      isPending: false,
      isError: false,
    })
    const live = renderHook(() => useAccountRecoveryAdvice())
    expect(live.result.current.map((item) => item.type)).toEqual(['single-mfa-factor'])
    expect(mockUseAccountRecovery).toHaveBeenCalledWith({ enabled: true })

    live.rerender()
    const disabled = renderHook(() => useAccountRecoveryAdvice({ enabled: false }))
    expect(disabled.result.current).toEqual([])
  })
})
