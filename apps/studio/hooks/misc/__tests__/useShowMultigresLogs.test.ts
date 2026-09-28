import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useShowMultigresLogs } from '../useShowMultigresLogs'

const mockUseFlag = vi.fn()

vi.mock('common', async (importOriginal) => ({
  ...(await importOriginal<typeof import('common')>()),
  useFlag: (name: string) => mockUseFlag(name),
}))

describe('useShowMultigresLogs', () => {
  beforeEach(() => {
    mockUseFlag.mockReset()
  })

  it('returns true when the showMultigresLogs flag is enabled', () => {
    mockUseFlag.mockReturnValue(true)

    const { result } = renderHook(() => useShowMultigresLogs())

    expect(result.current).toBe(true)
    expect(mockUseFlag).toHaveBeenCalledWith('showMultigresLogs')
  })

  it('returns false when the showMultigresLogs flag is disabled', () => {
    mockUseFlag.mockReturnValue(false)

    const { result } = renderHook(() => useShowMultigresLogs())

    expect(result.current).toBe(false)
  })
})
