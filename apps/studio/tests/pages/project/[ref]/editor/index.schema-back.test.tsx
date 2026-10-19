import { QueryClient } from '@tanstack/react-query'
import { act, waitFor } from '@testing-library/react'
import { LOCAL_STORAGE_KEYS } from 'common'
import mockRouter from 'next-router-mock'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { isHistoryTraverseNavigation, resetHistoryTraverseState } from '@/lib/history-traverse'
import TableEditorPage from '@/pages/project/[ref]/editor/index'
import { TabsStateContextProvider } from '@/state/tabs'
import { customRender } from '@/tests/lib/custom-render'

vi.mock('@/lib/history-traverse', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/history-traverse')>()
  return {
    ...actual,
    isHistoryTraverseNavigation: vi.fn(actual.isHistoryTraverseNavigation),
  }
})

vi.mock('@/components/layouts/Tabs/NewTab', () => ({ NewTab: () => null }))
vi.mock('@/components/interfaces/TableGridEditor/SidePanelEditor/SidePanelEditor', () => ({
  SidePanelEditor: () => null,
}))

const HISTORY_QUERY_KEY = ['localStorage', LOCAL_STORAGE_KEYS.DASHBOARD_HISTORY('default')]

const seedLastTable = ({ tableId, schema }: { tableId: number; schema: string }) => {
  localStorage.setItem(
    LOCAL_STORAGE_KEYS.DASHBOARD_HISTORY('default'),
    JSON.stringify({ editor: String(tableId) })
  )
  localStorage.setItem(
    'supabase_studio_tabs_default',
    JSON.stringify({
      openTabs: [`r-${tableId}`],
      activeTab: `r-${tableId}`,
      tabsMap: {
        [`r-${tableId}`]: {
          id: `r-${tableId}`,
          type: 'r',
          label: 'users',
          metadata: { tableId, schema, name: 'users' },
        },
      },
    })
  )
}

const mockNavigationType = (type: PerformanceNavigationTiming['type']) => {
  vi.spyOn(performance, 'getEntriesByType').mockImplementation((entryType) => {
    if (entryType !== 'navigation') return []
    return [{ type } as PerformanceNavigationTiming]
  })
}

const renderIndex = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  customRender(
    <TabsStateContextProvider>
      <TableEditorPage dehydratedState={undefined} />
    </TabsStateContextProvider>,
    { queryClient }
  )
  return queryClient
}

const waitForHistory = async (queryClient: QueryClient) => {
  await waitFor(() => {
    expect(queryClient.getQueryState(HISTORY_QUERY_KEY)?.status).toBe('success')
  })
}

const waitForRedirectDecision = async () => {
  await waitFor(() => {
    expect(isHistoryTraverseNavigation).toHaveBeenCalled()
  })
}

describe('Table Editor index schema and history', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    resetHistoryTraverseState()
    vi.restoreAllMocks()
    mockRouter.setCurrentUrl('/project/default/editor')
  })

  test('opens the last table on a fresh visit when no schema is in the url', async () => {
    mockNavigationType('navigate')
    seedLastTable({ tableId: 12, schema: 'auth' })
    const replace = vi.spyOn(mockRouter, 'replace')
    const push = vi.spyOn(mockRouter, 'push')

    const queryClient = renderIndex()
    await waitForHistory(queryClient)

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith(
        expect.stringMatching(/\/project\/default\/editor\/12\?schema=auth$/)
      )
    })
    expect(push).not.toHaveBeenCalled()
  })

  test('opens the last table when the explicit schema matches it', async () => {
    mockNavigationType('navigate')
    seedLastTable({ tableId: 12, schema: 'auth' })
    mockRouter.setCurrentUrl('/project/default/editor?schema=auth')
    const replace = vi.spyOn(mockRouter, 'replace')

    const queryClient = renderIndex()
    await waitForHistory(queryClient)

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith(
        expect.stringMatching(/\/project\/default\/editor\/12\?schema=auth$/)
      )
    })
  })

  test('does not redirect when the explicit schema does not match the last table', async () => {
    mockNavigationType('navigate')
    seedLastTable({ tableId: 12, schema: 'auth' })
    mockRouter.setCurrentUrl('/project/default/editor?schema=public')
    const replace = vi.spyOn(mockRouter, 'replace')

    const queryClient = renderIndex()
    await waitForHistory(queryClient)
    await waitForRedirectDecision()

    expect(replace).not.toHaveBeenCalled()
    expect(mockRouter.asPath).toBe('/project/default/editor?schema=public')
  })

  test('does not redirect on a history pop even when the schema matches', async () => {
    mockNavigationType('navigate')
    seedLastTable({ tableId: 12, schema: 'public' })
    mockRouter.setCurrentUrl('/project/default/editor?schema=public')
    window.dispatchEvent(new PopStateEvent('popstate'))
    const replace = vi.spyOn(mockRouter, 'replace')

    const queryClient = renderIndex()
    await waitForHistory(queryClient)
    await waitForRedirectDecision()

    expect(replace).not.toHaveBeenCalled()
    expect(mockRouter.asPath).toBe('/project/default/editor?schema=public')
  })

  test('does not redirect when the document was restored with back or forward', async () => {
    mockNavigationType('back_forward')
    seedLastTable({ tableId: 12, schema: 'auth' })
    const replace = vi.spyOn(mockRouter, 'replace')

    const queryClient = renderIndex()
    await waitForHistory(queryClient)
    await waitForRedirectDecision()

    expect(replace).not.toHaveBeenCalled()
  })

  test('does not reopen the last table if the schema changes after the visit is decided', async () => {
    mockNavigationType('navigate')
    seedLastTable({ tableId: 12, schema: 'auth' })
    mockRouter.setCurrentUrl('/project/default/editor?schema=public')
    const replace = vi.spyOn(mockRouter, 'replace')

    const queryClient = renderIndex()
    await waitForHistory(queryClient)
    await waitForRedirectDecision()
    expect(replace).not.toHaveBeenCalled()

    const decisionsBeforeSchemaChange = vi.mocked(isHistoryTraverseNavigation).mock.calls.length

    await act(async () => {
      mockRouter.setCurrentUrl('/project/default/editor?schema=auth')
    })

    await waitFor(() => {
      expect(mockRouter.query.schema).toBe('auth')
    })
    expect(vi.mocked(isHistoryTraverseNavigation).mock.calls.length).toBe(
      decisionsBeforeSchemaChange
    )
    expect(replace).not.toHaveBeenCalled()
  })
})
