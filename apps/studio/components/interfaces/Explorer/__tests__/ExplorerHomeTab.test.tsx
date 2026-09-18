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
    expect(screen.getByRole('radio', { name: /^Start page/ })).toBeChecked()
    await user.click(screen.getByRole('button', { name: 'Open Explorer' }))
    expect(await screen.findByLabelText('Start page chat')).toBeInTheDocument()
    first.unmount()

    renderHome()
    expect(await screen.findByLabelText('Start page chat')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Welcome to Explorer' })).not.toBeInTheDocument()
    expect(createQuery).not.toHaveBeenCalled()
  })

  it('supports keyboard selection and waits for completion before opening a query', async () => {
    const user = userEvent.setup()
    renderHome()
    const startPage = await screen.findByRole('radio', { name: /^Start page/ })
    await user.click(startPage)
    // Radix defers moving focus; keep the key down until that focus event selects the radio.
    await user.keyboard('{ArrowRight>}')
    await waitFor(() => expect(screen.getByRole('radio', { name: /^SQL query/ })).toBeChecked())
    await user.keyboard('{/ArrowRight}')
    expect(createQuery).not.toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: 'Open Explorer' }))
    await waitFor(() => expect(createQuery).toHaveBeenCalledExactlyOnceWith({ replace: true }))
  })

  it('shows onboarding for an unfinished query preference', async () => {
    seedPreferences('query', false)
    renderHome()
    expect(await screen.findByRole('heading', { name: 'Welcome to Explorer' })).toBeVisible()
    expect(screen.getByRole('radio', { name: /^SQL query/ })).toBeChecked()
    expect(createQuery).not.toHaveBeenCalled()
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

  it('keeps Learn more collapsed initially and supports expanding and collapsing with the keyboard', async () => {
    const user = userEvent.setup()
    renderHome()
    const trigger = await screen.findByRole('button', { name: 'Learn more' })
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByText('Where did my snippets go?')).not.toBeInTheDocument()
    await user.click(trigger)
    expect(screen.getByText('Where did my snippets go?')).toBeVisible()
    await user.keyboard('{Enter}')
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
  })
})
