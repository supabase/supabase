import { renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { useDataApiRevokeOnCreateDefaultEnabled } from '../useDataApiRevokeOnCreateDefault'
import { usePHFlag } from '@/hooks/ui/useFlag'
import * as constants from '@/lib/constants'

vi.mock('@/hooks/ui/useFlag', () => ({
  usePHFlag: vi.fn(),
}))

vi.mock('@/lib/constants', async () => {
  const actual = await vi.importActual<typeof import('@/lib/constants')>('@/lib/constants')
  return {
    ...actual,
    IS_TEST_ENV: false,
  }
})

describe('useDataApiRevokeOnCreateDefaultEnabled', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.mocked(constants, { partial: true }).IS_TEST_ENV = false
  })

  it('returns false when the PostHog flag is undefined (not yet resolved)', () => {
    vi.mocked(usePHFlag).mockReturnValue(undefined)
    const { result } = renderHook(() => useDataApiRevokeOnCreateDefaultEnabled())
    expect(result.current).toBe(false)
  })

  it('returns false when the PostHog flag is false', () => {
    vi.mocked(usePHFlag).mockReturnValue(false)
    const { result } = renderHook(() => useDataApiRevokeOnCreateDefaultEnabled())
    expect(result.current).toBe(false)
  })

  it('returns true when the PostHog flag is true', () => {
    vi.mocked(usePHFlag).mockReturnValue(true)
    const { result } = renderHook(() => useDataApiRevokeOnCreateDefaultEnabled())
    expect(result.current).toBe(true)
  })

  it('returns false in test env regardless of flag value', () => {
    vi.mocked(constants, { partial: true }).IS_TEST_ENV = true
    vi.mocked(usePHFlag).mockReturnValue(true)
    const { result } = renderHook(() => useDataApiRevokeOnCreateDefaultEnabled())
    expect(result.current).toBe(false)
  })
})
