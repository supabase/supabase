import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useAccountRecoveryAdvice } from './useAccountRecoveryAdvice'

const mock = vi.hoisted(() => ({
  userId: 'user-a',
  flag: true,
  listFactors: vi.fn(),
  getUser: vi.fn(),
  getStatus: vi.fn(),
}))

vi.mock('common', () => ({
  useFlag: () => mock.flag,
  useUser: () => (mock.userId ? { id: mock.userId } : null),
}))

vi.mock('@/lib/gotrue', () => ({
  auth: {
    mfa: { listFactors: mock.listFactors, recoveryCodes: { getStatus: mock.getStatus } },
    getUser: mock.getUser,
  },
}))

vi.mock('@/lib/constants', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/constants')>()),
  IS_PLATFORM: true,
}))

const verifiedFactor = { id: 'factor-a', factor_type: 'totp', status: 'verified' }

const renderAdvice = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  return renderHook(() => useAccountRecoveryAdvice(), { wrapper })
}

describe('useAccountRecoveryAdvice', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mock.userId = 'user-a'
    mock.flag = true
    mock.listFactors.mockResolvedValue({ data: { all: [verifiedFactor] }, error: null })
    mock.getUser.mockResolvedValue({
      data: { user: { identities: [{ provider: 'email' }] } },
      error: null,
    })
    mock.getStatus.mockResolvedValue({
      data: { remaining: 0 },
      error: null,
    })
  })

  it('does not read account data when the feature is disabled', () => {
    mock.flag = false
    const { result } = renderAdvice()
    expect(result.current).toBeUndefined()
    expect(mock.listFactors).not.toHaveBeenCalled()
    expect(mock.getUser).not.toHaveBeenCalled()
    expect(mock.getStatus).not.toHaveBeenCalled()
  })

  it('waits for all successful reads before showing advice', async () => {
    let resolveStatus: (value: unknown) => void = () => undefined
    mock.getStatus.mockReturnValue(new Promise((resolve) => (resolveStatus = resolve)))

    const { result } = renderAdvice()
    await waitFor(() => expect(mock.getStatus).toHaveBeenCalledOnce())
    expect(result.current).toBeUndefined()

    resolveStatus({ data: { remaining: 0 }, error: null })
    await waitFor(() => expect(result.current?.severity).toBe('critical'))
  })

  it('does not show advice when a required read fails or the identity is SSO', async () => {
    mock.getUser.mockResolvedValueOnce({ data: null, error: new Error('Identity read failed') })
    const failed = renderAdvice()
    await waitFor(() => expect(mock.getUser).toHaveBeenCalledOnce())
    expect(failed.result.current).toBeUndefined()
    expect(mock.getStatus).not.toHaveBeenCalled()
    failed.unmount()

    vi.clearAllMocks()
    mock.getUser.mockResolvedValue({
      data: { user: { identities: [{ provider: 'sso:example' }] } },
      error: null,
    })
    const sso = renderAdvice()
    await waitFor(() => expect(mock.getUser).toHaveBeenCalledOnce())
    expect(sso.result.current).toBeUndefined()
    expect(mock.getStatus).not.toHaveBeenCalled()
  })

  it('isolates cached advice when the signed-in user changes', async () => {
    const { result, rerender } = renderAdvice()
    await waitFor(() => expect(result.current?.severity).toBe('critical'))

    mock.userId = 'user-b'
    mock.getStatus.mockResolvedValue({ data: { remaining: 10 }, error: null })
    rerender()
    expect(result.current).toBeUndefined()
    await waitFor(() => expect(mock.getStatus).toHaveBeenCalledTimes(2))
    expect(result.current).toBeUndefined()
  })
})
