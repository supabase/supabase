import { waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { useAutoEnableJitAccess } from './useAutoEnableJitAccess'
import { customRenderHook } from '@/tests/lib/custom-render'

const mockUpdateJitDbAccess = vi.fn()
const mockUseJitDbAccessQuery = vi.fn()

vi.mock('@/data/jit-db-access/jit-db-access-query', () => ({
  useJitDbAccessQuery: (...args: unknown[]) => mockUseJitDbAccessQuery(...args),
}))

vi.mock('@/data/jit-db-access/jit-db-access-update-mutation', () => ({
  useJitDbAccessUpdateMutation: () => ({
    mutateAsync: mockUpdateJitDbAccess,
  }),
}))

describe('useAutoEnableJitAccess', () => {
  it('does not call update when PAM is already enabled', async () => {
    mockUseJitDbAccessQuery.mockReturnValue({
      data: { state: 'enabled', appliedSuccessfully: true },
    })

    const { result } = customRenderHook(() => useAutoEnableJitAccess('project-ref'))
    await result.current.ensureEnabled()

    expect(mockUpdateJitDbAccess).not.toHaveBeenCalled()
  })

  it('enables PAM before granting when disabled', async () => {
    mockUseJitDbAccessQuery.mockReturnValue({
      data: { state: 'disabled', appliedSuccessfully: true },
    })
    mockUpdateJitDbAccess.mockResolvedValue(undefined)

    const { result } = customRenderHook(() => useAutoEnableJitAccess('project-ref'))
    await result.current.ensureEnabled()

    await waitFor(() => {
      expect(mockUpdateJitDbAccess).toHaveBeenCalledWith({
        projectRef: 'project-ref',
        requestedConfig: { state: 'enabled' },
      })
    })
  })

  it('throws when temporary access is unavailable', async () => {
    mockUseJitDbAccessQuery.mockReturnValue({
      data: { state: 'unavailable', unavailableReason: 'postgres_upgrade_required' },
    })

    const { result } = customRenderHook(() => useAutoEnableJitAccess('project-ref'))

    await expect(result.current.ensureEnabled()).rejects.toThrow(
      'Temporary access is unavailable on this project'
    )
  })
})
