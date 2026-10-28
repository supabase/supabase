import { QueryClient } from '@tanstack/react-query'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import mockRouter from 'next-router-mock'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ExplorerLayout } from './ExplorerLayout'
import type { ExplorerNavLevel } from './ExplorerLayout.constants'
import { createTabsState, TabsStateContext } from '@/state/tabs'
import { customRender } from '@/tests/lib/custom-render'

vi.mock('next/navigation', () => ({
  usePathname: () => mockRouter.asPath,
}))

vi.mock('../ProjectLayout', () => ({
  ProjectLayoutWithAuth: ({
    children,
    productMenuHeader,
    productMenu,
  }: {
    children: ReactNode
    productMenuHeader: ReactNode
    productMenu: ReactNode
  }) => (
    <>
      <aside aria-label="Sidebar">
        {productMenuHeader}
        {productMenu}
      </aside>
      {children}
    </>
  ),
}))

// The panels have their own tests. Here they only need to say which one is showing.
vi.mock('./ExplorerNavHome', () => ({
  ExplorerNavHome: ({ onSelectLevel }: { onSelectLevel: (level: ExplorerNavLevel) => void }) => (
    <button type="button" tabIndex={0} onClick={() => onSelectLevel('tables')}>
      Open tables
    </button>
  ),
}))
vi.mock('./ExplorerNavTables', () => ({ ExplorerNavTables: () => <p>Tables panel</p> }))
vi.mock('./ExplorerNavNotebooks', () => ({ ExplorerNavNotebooks: () => null }))
vi.mock('./ExplorerNavChats', () => ({ ExplorerNavChats: () => null }))
vi.mock('./ExplorerPreferencesDropdown', () => ({ ExplorerPreferencesDropdown: () => null }))

vi.mock('@/components/interfaces/Account/Preferences/useExplorerPreferences', () => ({
  useExplorerPreferences: () => ({ home: 'query', hasCompletedOnboarding: true, isReady: true }),
}))
vi.mock('@/components/interfaces/Explorer/ExplorerQueryTabCoordinator', () => ({
  ExplorerQueryTabCoordinator: () => null,
}))
vi.mock('@/components/interfaces/Explorer/ExplorerNotebookTabCoordinator', () => ({
  ExplorerNotebookTabCoordinator: () => null,
}))
vi.mock('@/components/interfaces/Explorer/ExplorerGeneratedPageTabCoordinator', () => ({
  ExplorerGeneratedPageTabCoordinator: () => null,
}))
vi.mock('@/components/interfaces/Explorer/hooks', () => ({
  useCreateChat: () => ({ createChat: vi.fn() }),
  useCreateNotebook: () => ({ createNotebook: vi.fn() }),
  useCreateQuery: () => ({ createQuery: vi.fn() }),
}))

/** Mounts the layout with an empty query cache, as a page load would. */
const renderExplorer = () =>
  customRender(
    <TabsStateContext.Provider value={createTabsState('default')}>
      <ExplorerLayout>Explorer content</ExplorerLayout>
    </TabsStateContext.Provider>,
    { queryClient: new QueryClient({ defaultOptions: { queries: { retry: false } } }) }
  )

const sidebar = () => within(screen.getByRole('complementary', { name: 'Sidebar' }))

describe('Explorer sidebar', () => {
  beforeEach(() => {
    localStorage.clear()
    mockRouter.setCurrentUrl({
      pathname: '/project/[ref]/explorer',
      query: { ref: 'default' },
    })
  })

  it('reopens on the section the user left it on, so the table list stays one click away', async () => {
    const user = userEvent.setup()
    const { unmount } = renderExplorer()

    await user.click(await sidebar().findByRole('button', { name: 'Open tables' }))
    expect(await sidebar().findByText('Tables panel')).toBeInTheDocument()
    unmount()

    renderExplorer()
    expect(await sidebar().findByText('Tables panel')).toBeInTheDocument()
    expect(sidebar().queryByRole('button', { name: 'Open tables' })).not.toBeInTheDocument()
  })

  it('remembers returning to the root as well', async () => {
    const user = userEvent.setup()
    const { unmount } = renderExplorer()

    await user.click(await sidebar().findByRole('button', { name: 'Open tables' }))
    await user.click(await sidebar().findByRole('button', { name: 'Explorer' }))
    expect(await sidebar().findByRole('button', { name: 'Open tables' })).toBeInTheDocument()
    unmount()

    renderExplorer()
    expect(await sidebar().findByRole('button', { name: 'Open tables' })).toBeInTheDocument()
  })
})
