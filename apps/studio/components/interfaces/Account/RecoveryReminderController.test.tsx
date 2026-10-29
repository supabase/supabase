import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button, Dialog, DialogContent, DialogTitle, DialogTrigger } from 'ui'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { RecoveryReminderController } from './RecoveryReminderController'
import { profileKeys } from '@/data/profile/keys'
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

vi.mock('./RecoveryInterstitial/RecoveryInterstitial', () => ({
  RecoveryInterstitial: ({ onDismiss }: { onDismiss: () => void }) => (
    <>
      <Button
        onClick={() => {
          writeRecoveryReminderSnooze(mock.userId, 'exhausted')
          onDismiss()
        }}
      >
        Skip for now
      </Button>
      <Dialog>
        <DialogTrigger>Open recovery dialog</DialogTrigger>
        <DialogContent aria-describedby={undefined}>
          <DialogTitle>Recovery codes</DialogTitle>
          <input aria-label="Code confirmation" />
        </DialogContent>
      </Dialog>
    </>
  ),
}))

function renderController(href = '/organizations') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const createTree = (destination: string) => (
    <QueryClientProvider client={client}>
      <RecoveryReminderController href={destination}>
        <input aria-label="Unsaved editor" defaultValue="Unsaved work" />
      </RecoveryReminderController>
    </QueryClientProvider>
  )
  const view = render(createTree(href))
  return { client, rerender: (destination = href) => view.rerender(createTree(destination)) }
}
const takeover = () => screen.queryByRole('dialog', { name: 'Secure your account' })
const waitForTakeover = () => screen.findByRole('dialog', { name: 'Secure your account' })

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
  it('keeps the page mounted and its URL intact through opening and dismissal', async () => {
    const href = '/dashboard/project/ref/editor?schema=private#row-2'
    history.replaceState(null, '', href)
    const historyLength = history.length
    const { rerender } = renderController(href)
    const editor = screen.getByRole('textbox')
    editor.focus()
    fireEvent.change(editor, { target: { value: 'Edited draft' } })
    await waitForTakeover()
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    expect(editor.isConnected).toBe(true)
    rerender()
    expect(mock.track).toHaveBeenCalledTimes(1)
    fireEvent.click(screen.getByRole('button', { name: 'Skip for now' }))
    await waitFor(() => expect(takeover()).not.toBeInTheDocument())
    expect(screen.getByRole('textbox')).toBe(editor)
    expect(editor).toHaveValue('Edited draft')
    await waitFor(() => expect(editor).toHaveFocus())
    expect(location.pathname + location.search + location.hash).toBe(href)
    expect(history.length).toBe(historyLength)
  })

  it('does not send takeover keyboard events to dashboard window handlers', async () => {
    renderController()
    await waitForTakeover()
    const handler = vi.fn()
    window.addEventListener('keydown', handler)
    window.addEventListener('keyup', handler)
    try {
      await userEvent.tab()
      expect(takeover()?.contains(document.activeElement)).toBe(true)
      const skip = screen.getByRole('button', { name: 'Skip for now' })
      fireEvent.keyDown(skip, { key: 'Escape' })
      expect(takeover()).toBeInTheDocument()
      fireEvent.keyDown(skip, { key: 'k', metaKey: true })
      fireEvent.keyUp(skip, { key: 'k', metaKey: true })
      expect(handler).not.toHaveBeenCalled()
      fireEvent.click(screen.getByRole('button', { name: 'Open recovery dialog' }))
      const confirmation = screen.getByRole('textbox', { name: 'Code confirmation' })
      fireEvent.keyDown(confirmation, { key: 'k', metaKey: true })
      fireEvent.keyUp(confirmation, { key: 'k', metaKey: true })
      fireEvent.keyDown(confirmation, { key: 'Escape' })
      await waitFor(() =>
        expect(screen.queryByRole('dialog', { name: 'Recovery codes' })).not.toBeInTheDocument()
      )
      expect(takeover()).toBeInTheDocument()
      expect(handler).not.toHaveBeenCalled()
    } finally {
      window.removeEventListener('keydown', handler)
      window.removeEventListener('keyup', handler)
    }
  })

  it('waits for an existing dialog to close', async () => {
    const existing = document.createElement('div')
    existing.setAttribute('role', 'dialog')
    existing.setAttribute('data-state', 'open')
    document.body.append(existing)
    try {
      const { client } = renderController()
      await waitFor(() => expect(mock.getStatus).toHaveBeenCalled())
      await settle(client)
      expect(takeover()).not.toBeInTheDocument()
      existing.setAttribute('data-state', 'closed')
      await waitForTakeover()
    } finally {
      existing.remove()
    }
  })

  it('ignores permanent navigation menus and closed mounted dialogs', async () => {
    const sidebar = document.createElement('div')
    sidebar.innerHTML = '<nav role="menu"></nav><div role="dialog" data-state="closed"></div>'
    document.body.append(sidebar)
    try {
      renderController()
      await waitForTakeover()
    } finally {
      sidebar.remove()
    }
  })

  it('does not unmount an active task dialog during background refreshes', async () => {
    const { client } = renderController()
    const takeoverElement = await waitForTakeover()
    fireEvent.click(screen.getByRole('button', { name: 'Open recovery dialog' }))
    mock.getStatus.mockResolvedValue({ data: { remaining: 10 }, error: null })
    await act(() => client.invalidateQueries({ queryKey: ['recovery-code-status-query'] }))
    await settle(client)
    expect(takeoverElement).toBeInTheDocument()
    expect(screen.getByRole('dialog', { name: 'Recovery codes' })).toBeInTheDocument()
  })

  it('isolates snooze between users and removes the takeover on sign-out', async () => {
    writeRecoveryReminderSnooze(mock.userId, 'exhausted')
    const { client, rerender } = renderController()
    await waitFor(() => expect(mock.getStatus).toHaveBeenCalled())
    await settle(client)
    expect(takeover()).not.toBeInTheDocument()
    mock.userId = 'other-controller-user'
    rerender()
    await waitForTakeover()
    mock.userId = ''
    rerender()
    await waitFor(() => expect(takeover()).not.toBeInTheDocument())
  })

  it('checks the next user even when their verified session is cached', async () => {
    const { client, rerender } = renderController()
    await waitForTakeover()
    client.setQueryData(profileKeys.aaLevel('cached-user'), {
      currentLevel: 'aal2',
      nextLevel: 'aal2',
    })
    mock.userId = 'cached-user'
    rerender()
    await waitFor(() => expect(mock.track).toHaveBeenCalledTimes(2))
    await waitForTakeover()
  })

  it.each([
    'flags',
    'rollout',
    'auth loading',
    'MFA',
    'failed read',
    'pending read',
    'no gap',
    'route',
  ])('does not interrupt for %s', async (reason) => {
    if (reason === 'flags') mock.flagsLoaded = false
    if (reason === 'rollout') mock.rolloutEnabled = false
    if (reason === 'auth loading') mock.isAuthLoading = true
    if (reason === 'MFA')
      mock.getAssurance.mockResolvedValue({
        data: { currentLevel: 'aal1', nextLevel: 'aal2' },
        error: null,
      })
    if (reason === 'failed read')
      mock.getStatus.mockResolvedValue({ data: null, error: new Error('Unavailable') })
    if (reason === 'pending read') mock.getStatus.mockReturnValue(new Promise(() => {}))
    if (reason === 'no gap')
      mock.getStatus.mockResolvedValue({ data: { remaining: 10 }, error: null })
    const { client } = renderController(reason === 'route' ? '/account/security' : undefined)
    if (reason === 'pending read') await waitFor(() => expect(mock.getStatus).toHaveBeenCalled())
    else await settle(client)
    expect(takeover()).not.toBeInTheDocument()
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })
})
