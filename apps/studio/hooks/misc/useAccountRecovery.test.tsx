import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useAccountRecovery } from './useAccountRecovery'
import { useMfaListFactorsQuery } from '@/data/profile/mfa-list-factors-query'
import { useProfileIdentitiesQuery } from '@/data/profile/profile-identities-query'
import { useRecoveryCodesStatusQuery } from '@/data/recovery-codes/recovery-codes-status-query'

const mock = vi.hoisted(() => ({
  userId: 'user-a',
  hasSecuritySettings: true,
  recoveryCodesEnabled: true,
  passwordEnabled: true,
  listFactors: vi.fn(),
  getUser: vi.fn(),
  getStatus: vi.fn(),
}))

vi.mock('common', () => ({
  useFlag: (name: string) =>
    name === 'enableAuthRecoveryCodes' ? mock.recoveryCodesEnabled : mock.passwordEnabled,
  useUser: () => (mock.userId ? { id: mock.userId } : null),
}))

vi.mock('@/hooks/misc/useIsFeatureEnabled', () => ({
  useIsFeatureEnabled: () => mock.hasSecuritySettings,
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

const renderRecovery = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  return renderHook(() => useAccountRecovery(), { wrapper })
}

describe('useAccountRecovery', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mock.userId = 'user-a'
    mock.hasSecuritySettings = true
    mock.recoveryCodesEnabled = true
    mock.passwordEnabled = true
    mock.listFactors.mockResolvedValue({
      data: { all: [{ factor_type: 'totp', status: 'verified' }] },
      error: null,
    })
    mock.getUser.mockResolvedValue({
      data: { user: { identities: [{ provider: 'email' }], email: 'person@example.com' } },
      error: null,
    })
    mock.getStatus.mockResolvedValue({ data: { remaining: 0 }, error: null })
  })

  it('waits for code status before showing a code or factor finding', async () => {
    let resolveStatus: (value: unknown) => void = () => undefined
    mock.getStatus.mockReturnValue(new Promise((resolve) => (resolveStatus = resolve)))
    const { result } = renderRecovery()

    await waitFor(() => expect(mock.getStatus).toHaveBeenCalledOnce())
    expect(result.current).toMatchObject({ findings: [], isPending: true, isError: false })
    resolveStatus({ data: { remaining: 0 }, error: null })
    await waitFor(() => expect(result.current.findings[0]?.id).toBe('recovery-codes-exhausted'))
    expect(result.current.isPending).toBe(false)
  })

  it('keeps the password finding independent of unavailable Security settings', async () => {
    mock.hasSecuritySettings = false
    mock.getUser.mockResolvedValue({
      data: { user: { identities: [{ provider: 'github' }], email: 'person@example.com' } },
      error: null,
    })
    const { result } = renderRecovery()
    await waitFor(() => expect(result.current.findings[0]?.id).toBe('single-oauth-identity'))
    expect(mock.listFactors).not.toHaveBeenCalled()
    expect(mock.getStatus).not.toHaveBeenCalled()
  })

  it('does not treat a failed code read as missing codes', async () => {
    mock.getStatus.mockResolvedValue({ data: null, error: new Error('Unavailable') })
    const { result } = renderRecovery()
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.findings).toEqual([])
  })

  it('isolates existing callers that omit a user ID', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const { result, rerender } = renderHook(
      () => ({
        factors: useMfaListFactorsQuery(),
        identities: useProfileIdentitiesQuery(),
        codes: useRecoveryCodesStatusQuery(),
      }),
      {
        wrapper: ({ children }) => (
          <QueryClientProvider client={client}>{children}</QueryClientProvider>
        ),
      }
    )
    await waitFor(() => expect(result.current.codes.isSuccess).toBe(true))
    await waitFor(() => expect(result.current.factors.isSuccess).toBe(true))
    await waitFor(() => expect(result.current.identities.isSuccess).toBe(true))
    mock.userId = 'user-b'
    rerender()
    expect(result.current.factors.data).toBeUndefined()
    expect(result.current.identities.data).toBeUndefined()
    expect(result.current.codes.data).toBeUndefined()
    await waitFor(() => expect(mock.getStatus).toHaveBeenCalledTimes(2))
    await waitFor(() => expect(mock.listFactors).toHaveBeenCalledTimes(2))
    await waitFor(() => expect(mock.getUser).toHaveBeenCalledTimes(2))
  })

  it('does not reuse findings after the signed-in user changes', async () => {
    const { result, rerender } = renderRecovery()
    await waitFor(() => expect(result.current.findings[0]?.id).toBe('recovery-codes-exhausted'))

    mock.userId = 'user-b'
    mock.getStatus.mockResolvedValue({ data: { remaining: 10 }, error: null })
    rerender()
    expect(result.current.findings).toEqual([])
    await waitFor(() => expect(mock.getStatus).toHaveBeenCalledTimes(2))
    expect(result.current.findings.map((finding) => finding.id)).toEqual(['single-mfa-factor'])
  })
})
