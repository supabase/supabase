import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { RecoveryReminderController } from './RecoveryReminderController'
import { writeRecoveryReminderSnooze } from '@/lib/account-recovery/recovery-reminder'

const mock = vi.hoisted(() => ({
  userId: 'controller-user',
  rolloutEnabled: true,
  isAuthLoading: false,
  flagsLoaded: true,
  getAssurance: vi.fn(),
  listFactors: vi.fn(),
  getUser: vi.fn(),
  getStatus: vi.fn(),
  track: vi.fn(),
}))

vi.mock('common', async (importOriginal) => ({
  ...(await importOriginal<typeof import('common')>()),
  useFlag: (name: string) =>
    name === 'enableAccountRecoveryInterstitial' ? mock.rolloutEnabled : true,
  useFeatureFlags: () => ({ hasLoaded: mock.flagsLoaded }),
  useUser: () => (mock.userId ? { id: mock.userId } : null),
  useAuth: () => ({
    session: mock.userId ? { user: { id: mock.userId } } : null,
    isLoading: mock.isAuthLoading,
  }),
}))
vi.mock('@/hooks/misc/useIsFeatureEnabled', () => ({ useIsFeatureEnabled: () => true }))
vi.mock('@/lib/gotrue', () => ({
  auth: {
    mfa: {
      getAuthenticatorAssuranceLevel: mock.getAssurance,
      listFactors: mock.listFactors,
      recoveryCodes: { getStatus: mock.getStatus },
    },
    getUser: mock.getUser,
  },
}))
vi.mock('@/lib/constants', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/constants')>()),
  IS_PLATFORM: true,
  BASE_PATH: '/dashboard',
}))
vi.mock('@/lib/telemetry/track', () => ({ useTrack: () => mock.track }))

function renderController(href = '/organizations') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const onNavigate = vi.fn()
  const createTree = (destination: string) => (
    <QueryClientProvider client={client}>
      <RecoveryReminderController href={destination} onNavigate={onNavigate}>
        <div>Dashboard content</div>
      </RecoveryReminderController>
    </QueryClientProvider>
  )
  const view = render(createTree(href))
  return {
    client,
    onNavigate,
    rerender: (destination = href) => view.rerender(createTree(destination)),
  }
}

async function settle(client: QueryClient) {
  await waitFor(() => expect(client.isFetching()).toBe(0))
  await act(async () => {})
}

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
  mock.userId = 'controller-user'
  mock.rolloutEnabled = true
  mock.isAuthLoading = false
  mock.flagsLoaded = true
  mock.getAssurance.mockResolvedValue({
    data: { currentLevel: 'aal2', nextLevel: 'aal2' },
    error: null,
  })
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
afterEach(() => vi.restoreAllMocks())

describe('RecoveryReminderController', () => {
  it('shows the dashboard immediately while flags and the entry check resolve', async () => {
    mock.flagsLoaded = false
    const { client, rerender, onNavigate } = renderController()
    expect(screen.getByText('Dashboard content')).toBeInTheDocument()
    expect(screen.queryByRole('status', { name: 'Loading dashboard' })).not.toBeInTheDocument()
    mock.flagsLoaded = true
    mock.getStatus.mockResolvedValue({ data: { remaining: 10 }, error: null })
    rerender()
    await screen.findByText('Dashboard content')
    await settle(client)
    expect(onNavigate).not.toHaveBeenCalled()
  })
  it('shows the dashboard while checking and then redirects an eligible account', async () => {
    const { onNavigate } = renderController()
    expect(screen.getByText('Dashboard content')).toBeInTheDocument()
    await waitFor(() => expect(onNavigate).toHaveBeenCalledOnce())
    expect(screen.getByText('Dashboard content')).toBeInTheDocument()
  })
  it('keeps the dashboard visible during background reads', async () => {
    mock.getStatus.mockResolvedValue({ data: { remaining: 10 }, error: null })
    const { client } = renderController()
    await screen.findByText('Dashboard content')
    await settle(client)
    mock.getStatus.mockReturnValue(new Promise(() => {}))
    act(() => {
      void client.invalidateQueries({ queryKey: ['recovery-code-status-query'] })
    })
    await waitFor(() => expect(mock.getStatus).toHaveBeenCalledTimes(2))
    expect(screen.getByText('Dashboard content')).toBeInTheDocument()
  })
  it('can interrupt the same account after sign-out and clearing snooze', async () => {
    const { client, onNavigate, rerender } = renderController()
    await waitFor(() => expect(onNavigate).toHaveBeenCalledOnce())
    writeRecoveryReminderSnooze(mock.userId, 'exhausted')
    mock.userId = ''
    rerender()
    await settle(client)
    localStorage.removeItem('account-recovery-reminder:controller-user')
    mock.userId = 'controller-user'
    rerender()
    await waitFor(() => expect(onNavigate).toHaveBeenCalledTimes(2))
  })

  it('preserves the full destination and avoids duplicate redirects', async () => {
    const href = '/project/ref/editor?schema=private&table=notes#row-2'
    const { client, onNavigate, rerender } = renderController(href)
    await waitFor(() => expect(onNavigate).toHaveBeenCalledOnce())
    const redirect = new URL(onNavigate.mock.calls[0][0], 'https://studio.local')
    expect(redirect.pathname).toBe('/account-recovery')
    expect(redirect.searchParams.get('returnTo')).toBe(href)
    rerender()
    await settle(client)
    expect(onNavigate).toHaveBeenCalledOnce()
    expect(mock.track).toHaveBeenCalledWith('account_recovery_reminder_exposed', {
      gap: 'exhausted',
    })
  })

  it('recognizes the deployment base path and retains the complete return URL', async () => {
    const href = '/dashboard/project/ref/editor?schema=private#row-2'
    const { onNavigate } = renderController(href)
    await waitFor(() => expect(onNavigate).toHaveBeenCalledOnce())
    expect(
      new URL(onNavigate.mock.calls[0][0], 'https://studio.local').searchParams.get('returnTo')
    ).toBe(href)
    expect(screen.getByText('Dashboard content')).toBeInTheDocument()
  })

  it('does not interrupt when rollout is disabled', async () => {
    mock.rolloutEnabled = false
    const { client, onNavigate } = renderController()
    await settle(client)
    expect(onNavigate).not.toHaveBeenCalled()
    expect(mock.getStatus).not.toHaveBeenCalled()
  })

  it('waits for MFA verification', async () => {
    mock.getAssurance.mockResolvedValue({
      data: { currentLevel: 'aal1', nextLevel: 'aal2' },
      error: null,
    })
    const { client, onNavigate } = renderController()
    await settle(client)
    expect(onNavigate).not.toHaveBeenCalled()
    expect(mock.getStatus).not.toHaveBeenCalled()
  })

  it('waits for authentication loading to finish', async () => {
    mock.isAuthLoading = true
    const { client, onNavigate } = renderController()
    await settle(client)
    expect(onNavigate).not.toHaveBeenCalled()
    expect(mock.getStatus).not.toHaveBeenCalled()
  })

  it('does not turn failed recovery reads into interruptions', async () => {
    mock.getStatus.mockResolvedValue({ data: null, error: new Error('Unavailable') })
    const { client, onNavigate } = renderController()
    await waitFor(() => expect(mock.getStatus).toHaveBeenCalled())
    await settle(client)
    expect(onNavigate).not.toHaveBeenCalled()
  })

  it('waits for recovery reads to finish', async () => {
    mock.getStatus.mockReturnValue(new Promise(() => {}))
    const { onNavigate } = renderController()
    await waitFor(() => expect(mock.getStatus).toHaveBeenCalled())
    expect(onNavigate).not.toHaveBeenCalled()
    expect(screen.getByText('Dashboard content')).toBeInTheDocument()
  })

  it('does not interrupt for an authenticator recommendation alone', async () => {
    mock.getStatus.mockResolvedValue({ data: { remaining: 10 }, error: null })
    const { client, onNavigate } = renderController()
    await waitFor(() => expect(mock.getStatus).toHaveBeenCalled())
    await settle(client)
    expect(onNavigate).not.toHaveBeenCalled()
  })

  it('honors snooze without sharing it with another user', async () => {
    writeRecoveryReminderSnooze('controller-user', 'exhausted')
    const { client, onNavigate, rerender } = renderController()
    await waitFor(() => expect(mock.getStatus).toHaveBeenCalledOnce())
    await settle(client)
    expect(onNavigate).not.toHaveBeenCalled()
    mock.userId = 'controller-other-user'
    rerender()
    await waitFor(() => expect(onNavigate).toHaveBeenCalledOnce())
    expect(mock.getStatus).toHaveBeenCalledTimes(2)
  })

  it('does not interrupt the account recovery route', async () => {
    const { client, onNavigate } = renderController('/account-recovery')
    await settle(client)
    expect(onNavigate).not.toHaveBeenCalled()
    expect(mock.getStatus).not.toHaveBeenCalled()
  })
})
