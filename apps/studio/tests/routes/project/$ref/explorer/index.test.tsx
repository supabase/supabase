import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { Route } from '@/routes/project/$ref/explorer/index'
import { renderRoute } from '@/tests/lib/route-render'

const mocks = vi.hoisted(() => ({
  activatePinnedTab: vi.fn(),
  assistantSnapshot: vi.fn(),
  restoreDraft: vi.fn(),
  setLastVisitedExplorerTab: vi.fn(),
  useDashboardHistory: vi.fn(),
  useLoadNotebook: vi.fn(),
}))

vi.mock('@/hooks/misc/useDashboardHistory', () => ({
  useDashboardHistory: () => mocks.useDashboardHistory(),
}))

vi.mock('@/components/interfaces/Explorer/hooks', () => ({
  useLoadNotebook: () => mocks.useLoadNotebook(),
}))

vi.mock('@/components/interfaces/Explorer/ExplorerHomeTab', () => ({
  ExplorerHomeTab: () => <div>Explorer home</div>,
  ExplorerHomeLoading: () => <div>Checking last tab</div>,
}))

vi.mock('@/state/explorer-query', () => ({
  explorerQueryState: { restoreDraft: (...args: unknown[]) => mocks.restoreDraft(...args) },
}))

vi.mock('@/state/ai-assistant-state', () => ({
  useAiAssistantStateSnapshot: () => mocks.assistantSnapshot(),
}))

vi.mock('@/state/tabs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/state/tabs')>()
  return {
    ...actual,
    useTabsStateSnapshot: () => ({ activatePinnedTab: mocks.activatePinnedTab }),
  }
})

const mockHistory = (explorer?: { type: 'notebook' | 'query' | 'chat'; id: string }) => {
  mocks.useDashboardHistory.mockReturnValue({
    history: { explorer },
    isHistoryLoaded: true,
    setLastVisitedExplorerTab: mocks.setLastVisitedExplorerTab,
  })
}

const renderExplorer = () =>
  renderRoute(Route, { routeId: '/project/$ref/explorer/', url: '/project/default/explorer' })

describe('/project/$ref/explorer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.useLoadNotebook.mockReturnValue({ isNotFound: false, isLoading: false })
    mocks.assistantSnapshot.mockReturnValue({ isInitialized: true, chats: {} })
  })

  it('shows the checking state until dashboard history has loaded', async () => {
    mocks.useDashboardHistory.mockReturnValue({
      history: {},
      isHistoryLoaded: false,
      setLastVisitedExplorerTab: mocks.setLastVisitedExplorerTab,
    })

    await renderExplorer()

    expect(mocks.activatePinnedTab).not.toHaveBeenCalled()
    expect(screen.getByText('Checking last tab')).toBeInTheDocument()
  })

  it('activates the Home tab when there is no last visited Explorer tab', async () => {
    mockHistory(undefined)

    const { router } = await renderExplorer()

    expect(mocks.activatePinnedTab).toHaveBeenCalled()
    expect(router.history.location.pathname).toBe('/project/default/explorer')
    expect(screen.getByText('Explorer home')).toBeInTheDocument()
  })

  it('redirects to the last visited query tab when its draft still exists', async () => {
    mocks.restoreDraft.mockReturnValue(true)
    mockHistory({ type: 'query', id: 'query-1' })

    const { router } = await renderExplorer()

    expect(mocks.restoreDraft).toHaveBeenCalledWith({ id: 'query-1', projectRef: 'default' })
    await vi.waitFor(() =>
      expect(router.state.location.pathname).toBe('/project/default/explorer/query/query-1')
    )
    expect(router.history.length).toBe(1)
    expect(mocks.activatePinnedTab).not.toHaveBeenCalled()
  })

  it('falls back to Home and forgets the entry when the query draft is gone', async () => {
    mocks.restoreDraft.mockReturnValue(false)
    mockHistory({ type: 'query', id: 'query-1' })

    const { router } = await renderExplorer()

    expect(router.history.location.pathname).toBe('/project/default/explorer')
    expect(mocks.setLastVisitedExplorerTab).toHaveBeenCalledWith(undefined)
    expect(mocks.activatePinnedTab).toHaveBeenCalled()
  })

  it('redirects to the last visited chat tab when the chat still exists', async () => {
    mocks.assistantSnapshot.mockReturnValue({
      isInitialized: true,
      chats: { 'chat-1': { id: 'chat-1', name: 'Investigate' } },
    })
    mockHistory({ type: 'chat', id: 'chat-1' })

    const { router } = await renderExplorer()

    await vi.waitFor(() =>
      expect(router.state.location.pathname).toBe('/project/default/explorer/chat/chat-1')
    )
    expect(router.history.length).toBe(1)
  })

  it('waits for chat hydration before deciding', async () => {
    mocks.assistantSnapshot.mockReturnValue({ isInitialized: false, chats: {} })
    mockHistory({ type: 'chat', id: 'chat-1' })

    const { router } = await renderExplorer()

    expect(router.history.location.pathname).toBe('/project/default/explorer')
    expect(mocks.activatePinnedTab).not.toHaveBeenCalled()
    expect(screen.getByText('Checking last tab')).toBeInTheDocument()
  })

  it('falls back to Home when the last visited chat was deleted', async () => {
    mocks.assistantSnapshot.mockReturnValue({ isInitialized: true, chats: {} })
    mockHistory({ type: 'chat', id: 'chat-1' })

    const { router } = await renderExplorer()

    expect(router.history.location.pathname).toBe('/project/default/explorer')
    expect(mocks.setLastVisitedExplorerTab).toHaveBeenCalledWith(undefined)
    expect(mocks.activatePinnedTab).toHaveBeenCalled()
  })

  it('shows the checking state while the last visited notebook is still loading', async () => {
    mocks.useLoadNotebook.mockReturnValue({ isNotFound: false, isLoading: true })
    mockHistory({ type: 'notebook', id: 'notebook-1' })

    const { router } = await renderExplorer()

    expect(router.history.location.pathname).toBe('/project/default/explorer')
    expect(screen.getByText('Checking last tab')).toBeInTheDocument()
  })

  it('redirects to the last visited notebook once it is confirmed to exist', async () => {
    mocks.useLoadNotebook.mockReturnValue({ isNotFound: false, isLoading: false })
    mockHistory({ type: 'notebook', id: 'notebook-1' })

    const { router } = await renderExplorer()

    await vi.waitFor(() =>
      expect(router.state.location.pathname).toBe('/project/default/explorer/notebook/notebook-1')
    )
    expect(router.history.length).toBe(1)
  })

  it('falls back to Home when the last visited notebook no longer exists', async () => {
    mocks.useLoadNotebook.mockReturnValue({ isNotFound: true, isLoading: false })
    mockHistory({ type: 'notebook', id: 'notebook-1' })

    const { router } = await renderExplorer()

    expect(router.history.location.pathname).toBe('/project/default/explorer')
    expect(mocks.setLastVisitedExplorerTab).toHaveBeenCalledWith(undefined)
    expect(mocks.activatePinnedTab).toHaveBeenCalled()
  })
})
