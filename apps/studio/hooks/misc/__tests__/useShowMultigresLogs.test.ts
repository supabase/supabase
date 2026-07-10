import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useShowMultigresLogs } from '../useShowMultigresLogs'

const mockUseFlag = vi.fn()
const mockUseIsHighAvailability = vi.fn()

vi.mock('common', async (importOriginal) => ({
  ...(await importOriginal<typeof import('common')>()),
  useFlag: (name: string) => mockUseFlag(name),
}))

vi.mock('../useSelectedProject', () => ({
  useIsHighAvailability: () => mockUseIsHighAvailability(),
}))

describe('useShowMultigresLogs', () => {
  beforeEach(() => {
    mockUseFlag.mockReset()
    mockUseIsHighAvailability.mockReset()
  })

  it('returns true only when the multigresLogs flag and high availability are both enabled', () => {
    mockUseFlag.mockReturnValue(true)
    mockUseIsHighAvailability.mockReturnValue(true)

    const { result } = renderHook(() => useShowMultigresLogs())

    expect(result.current).toBe(true)
    expect(mockUseFlag).toHaveBeenCalledWith('multigresLogs')
  })

  it('returns false when the flag is off, even on a high availability project', () => {
    mockUseFlag.mockReturnValue(false)
    mockUseIsHighAvailability.mockReturnValue(true)

    const { result } = renderHook(() => useShowMultigresLogs())

    expect(result.current).toBe(false)
  })

  it('returns false when the project is not high availability, even with the flag on', () => {
    mockUseFlag.mockReturnValue(true)
    mockUseIsHighAvailability.mockReturnValue(false)

    const { result } = renderHook(() => useShowMultigresLogs())

    expect(result.current).toBe(false)
  })

  it('returns false when both the flag and high availability are off', () => {
    mockUseFlag.mockReturnValue(false)
    mockUseIsHighAvailability.mockReturnValue(false)

    const { result } = renderHook(() => useShowMultigresLogs())

    expect(result.current).toBe(false)
  })
})
