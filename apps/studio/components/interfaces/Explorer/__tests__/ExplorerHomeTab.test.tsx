import { QueryClient } from '@tanstack/react-query'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LOCAL_STORAGE_KEYS } from 'common'
import { StrictMode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ExplorerHomeTab } from '../ExplorerHomeTab'
import { customRender } from '@/tests/lib/custom-render'
import { createMockProfileContext } from '@/tests/lib/profile-helpers'

const { createQuery, project } = vi.hoisted(() => ({
  createQuery: vi.fn(),
  project: { ref: 'default' as string | undefined },
}))

vi.mock('common', async (importOriginal) => ({
  ...(await importOriginal<typeof import('common')>()),
  IS_PLATFORM: true,
  useParams: () => ({ ref: 'default' }),
}))

vi.mock('../hooks', () => ({
  useCreateQuery: () => ({ createQuery, projectRef: project.ref }),
  useCreateNotebook: () => ({ createNotebook: vi.fn() }),
  useCreateChat: () => ({ createChat: vi.fn() }),
}))
vi.mock('@/components/ui/AIAssistantPanel/AssistantChatForm', () => ({
  AssistantChatForm: () => <div aria-label="Start page chat" />,
}))
vi.mock('@/components/ui/AIAssistantPanel/AssistantAgentHarnessFooter', () => ({
  AssistantAgentHarnessFooter: () => null,
}))

const storageKey = LOCAL_STORAGE_KEYS.EXPLORER_PREFERENCES
const seedPreferences = (home: 'home' | 'query', hasCompletedOnboarding = true) => {
  localStorage.setItem(storageKey, JSON.stringify({ '1': { home, hasCompletedOnboarding } }))
}
const renderHome = () =>
  customRender(
    <StrictMode>
      <ExplorerHomeTab />
    </StrictMode>,
    {
      queryClient: new QueryClient({ defaultOptions: { queries: { retry: false } } }),
      profileContext: createMockProfileContext(),
    }
  )

beforeEach(() => {
  createQuery.mockClear()
  project.ref = 'default'
})
afterEach(() => localStorage.clear())

describe('Explorer home onboarding', () => {
  it('lets the user complete onboarding with the start page and does not show it on return', async () => {
    const user = userEvent.setup()
    const first = renderHome()
    expect(await screen.findByRole('heading', { name: 'Welcome to Explorer' })).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Continue to Explorer' }))
    expect(await screen.findByLabelText('Start page chat')).toBeInTheDocument()
    first.unmount()

    renderHome()
    expect(await screen.findByLabelText('Start page chat')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Welcome to Explorer' })).not.toBeInTheDocument()
    expect(createQuery).not.toHaveBeenCalled()
  })

  it('explains Explorer without asking for a startup preference', async () => {
    renderHome()
    await screen.findByRole('heading', { name: 'Welcome to Explorer' })
    for (const name of ['Run SQL', 'Chat with your project', 'Save to notebooks']) {
      expect(screen.getByRole('heading', { name })).toBeVisible()
    }
    expect(screen.queryByRole('radio')).not.toBeInTheDocument()
  })

  it('opens a query after onboarding when the saved preference is a query', async () => {
    const user = userEvent.setup()
    seedPreferences('query', false)
    renderHome()
    expect(await screen.findByRole('heading', { name: 'Welcome to Explorer' })).toBeVisible()
    expect(createQuery).not.toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: 'Continue to Explorer' }))
    await waitFor(() => expect(createQuery).toHaveBeenCalledExactlyOnceWith({ replace: true }))
  })

  it('opens one query for a returning user, even under Strict Mode', async () => {
    seedPreferences('query')
    renderHome()
    await waitFor(() => expect(createQuery).toHaveBeenCalledExactlyOnceWith({ replace: true }))
    expect(screen.queryByRole('heading', { name: 'Welcome to Explorer' })).not.toBeInTheDocument()
  })

  it.each([undefined, 'previous-project'])(
    'waits for the current project when the selected project is %s',
    async (selectedRef) => {
      seedPreferences('query')
      project.ref = selectedRef
      const { rerender } = renderHome()
      await screen.findByRole('status', { name: 'Opening Explorer' })
      expect(createQuery).not.toHaveBeenCalled()
      project.ref = 'default'
      rerender(
        <StrictMode>
          <ExplorerHomeTab />
        </StrictMode>
      )
      await waitFor(() => expect(createQuery).toHaveBeenCalledExactlyOnceWith({ replace: true }))
    }
  )
})
