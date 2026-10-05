import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useAccountRecoveryAdvisor } from './useAccountRecoveryAdvisor'

const { getUser, listFactors, getStatus, useFlag } = vi.hoisted(() => ({
  getUser: vi.fn(),
  listFactors: vi.fn(),
  getStatus: vi.fn(),
  useFlag: vi.fn(),
}))

vi.mock('common', async (importOriginal) => ({
  ...(await importOriginal<typeof import('common')>()),
  useFlag,
}))
vi.mock('@/lib/constants', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/constants')>()),
  IS_PLATFORM: true,
}))
vi.mock('@/lib/gotrue', () => ({
  auth: { getUser, mfa: { listFactors, recoveryCodes: { getStatus } } },
}))

const renderAdvisor = (enabled = true) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
  return renderHook(() => useAccountRecoveryAdvisor({ enabled }), { wrapper })
}

describe('useAccountRecoveryAdvisor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useFlag.mockReturnValue(true)
    getUser.mockResolvedValue({ data: { user: { identities: [{ provider: 'github' }] } } })
    listFactors.mockResolvedValue({
      data: {
        all: [
          { factor_type: 'totp', status: 'verified' },
          { factor_type: 'recovery_code', status: 'verified' },
          { factor_type: 'totp', status: 'unverified' },
        ],
      },
    })
    getStatus.mockResolvedValue({ data: { remaining: 0, total: 10 } })
  })

  it('excludes recovery-code and unverified factors from backup counting', async () => {
    const { result } = renderAdvisor()
    await waitFor(() => expect(result.current?.severity).toBe('critical'))
  })

  it.each([
    [false, true],
    [true, false],
  ])('does not fetch with enabled=%s and flag=%s', async (enabled, flag) => {
    useFlag.mockReturnValue(flag)
    const { result } = renderAdvisor(enabled)
    expect(result.current).toBeUndefined()
    expect(getUser).not.toHaveBeenCalled()
  })

  it('excludes SSO accounts before checking factors', async () => {
    getUser.mockResolvedValue({
      data: { user: { identities: [{ provider: 'sso:organisation' }] } },
    })
    const { result } = renderAdvisor()
    await waitFor(() => expect(getUser).toHaveBeenCalled())
    expect(result.current).toBeUndefined()
    expect(listFactors).not.toHaveBeenCalled()
  })

  it('does not mistake a failed code lookup for missing codes', async () => {
    getStatus.mockRejectedValue(new Error('Unavailable'))
    const { result } = renderAdvisor()
    await waitFor(() => expect(getStatus).toHaveBeenCalled())
    expect(result.current).toBeUndefined()
  })
})
