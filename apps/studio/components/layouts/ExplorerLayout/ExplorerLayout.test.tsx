import { QueryClient } from '@tanstack/react-query'
import { createMemoryHistory, createRootRoute, createRouter } from '@tanstack/react-router'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LOCAL_STORAGE_KEYS } from 'common'
import mockRouter from 'next-router-mock'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ExplorerLayout } from './ExplorerLayout'
import { parseSearch, stringifySearch } from '@/lib/router-search-params'
import { createTabsState, TabsStateContext } from '@/state/tabs'
import { customRender } from '@/tests/lib/custom-render'

vi.mock('../ProjectLayout', () => ({
  ProjectLayoutWithAuth: ({ children }: { children: ReactNode }) => <>{children}</>,
}))

vi.mock('@/components/interfaces/Account/Preferences/useExplorerPreferences', () => ({
  useExplorerPreferences: () => ({ home: 'home', hasCompletedOnboarding: true, isReady: true }),
}))

vi.mock('@/components/interfaces/Explorer/ExplorerQueryTabCoordinator', () => ({
  ExplorerQueryTabCoordinator: () => null,
}))

vi.mock('@/components/interfaces/Explorer/ExplorerNotebookTabCoordinator', () => ({
  ExplorerNotebookTabCoordinator: () => null,
}))

vi.mock('@/components/interfaces/Explorer/hooks', () => ({
  useCreateChat: () => ({ createChat: vi.fn() }),
  useCreateNotebook: () => ({ createNotebook: vi.fn() }),
  useCreateQuery: () => ({ createQuery: vi.fn() }),
}))

describe('Explorer Home tab navigation', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
    mockRouter.setCurrentUrl({
      pathname: '/project/[ref]/explorer/query/[id]',
      query: { ref: 'default', id: 'query-1' },
    })
  })

  it.each(['mouse', 'keyboard'] as const)(
    'clears the saved Explorer destination before navigating Home with the %s',
    async (input) => {
      const user = userEvent.setup()
      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false, staleTime: Infinity } },
      })
      const historyKey = ['localStorage', LOCAL_STORAGE_KEYS.DASHBOARD_HISTORY('default')]
      const otherHistory = { editor: 'table-1', sql: 'snippet-1' }
      queryClient.setQueryData(historyKey, {
        ...otherHistory,
        explorer: { type: 'query', id: 'query-1' },
      })

      const tabs = createTabsState('default')
      tabs.addTab({
        id: 'query-query-1',
        type: 'query',
        label: 'My query',
        metadata: { queryId: 'query-1' },
        isPreview: false,
      })
      const router = createRouter({
        routeTree: createRootRoute(),
        history: createMemoryHistory({
          initialEntries: ['/project/default/explorer/query/query-1'],
        }),
        parseSearch,
        stringifySearch,
      })
      let historyAtNavigation: unknown
      const navigate = vi.spyOn(router, 'navigate')
      navigate.mockImplementationOnce(async () => {
        historyAtNavigation = queryClient.getQueryData(historyKey)
      })

      customRender(
        <TabsStateContext.Provider value={tabs}>
          <ExplorerLayout>Explorer content</ExplorerLayout>
        </TabsStateContext.Provider>,
        { queryClient, router }
      )

      if (input === 'mouse') {
        await user.click(screen.getByRole('tab', { name: 'Open Explorer home' }))
      } else {
        await user.tab()
        expect(screen.getByRole('tab', { name: 'My query' })).toHaveFocus()
        await user.keyboard('{ArrowLeft}')
      }

      expect(navigate).toHaveBeenCalledWith(
        expect.objectContaining({ to: '/project/default/explorer' })
      )
      expect(historyAtNavigation).toEqual(otherHistory)
      expect(queryClient.getQueryData(historyKey)).toEqual(otherHistory)
      expect(screen.getByRole('tab', { name: 'Open Explorer home' })).toHaveAttribute(
        'aria-selected',
        'true'
      )
      expect(tabs.tabsMap['query-query-1']).toBeDefined()
    }
  )
})
