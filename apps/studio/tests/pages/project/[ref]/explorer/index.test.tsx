import { screen } from '@testing-library/react'
import mockRouter from 'next-router-mock'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import ProjectExplorerPage from '@/pages/project/[ref]/explorer/index'
import { customRender } from '@/tests/lib/custom-render'

// `common`'s useParams and `next/router` are globally mocked in vitestSetup.ts
// to `{ ref: 'default' }` and `next-router-mock` respectively.

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

describe('ProjectExplorerPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRouter.setCurrentUrl('/project/default/explorer')
    vi.spyOn(mockRouter, 'replace')
    mocks.useLoadNotebook.mockReturnValue({ isNotFound: false, isLoading: false })
    mocks.assistantSnapshot.mockReturnValue({ isInitialized: true, chats: {} })
  })

  it('shows the checking state until dashboard history has loaded', () => {
    mocks.useDashboardHistory.mockReturnValue({
      history: {},
      isHistoryLoaded: false,
      setLastVisitedExplorerTab: mocks.setLastVisitedExplorerTab,
    })

    customRender(<ProjectExplorerPage dehydratedState={undefined} />)

    expect(mocks.activatePinnedTab).not.toHaveBeenCalled()
    expect(screen.getByText('Checking last tab')).toBeInTheDocument()
  })

  it('activates the Home tab when there is no last visited Explorer tab', () => {
    mockHistory(undefined)

    customRender(<ProjectExplorerPage dehydratedState={undefined} />)

    expect(mocks.activatePinnedTab).toHaveBeenCalled()
    expect(mockRouter.replace).not.toHaveBeenCalled()
    expect(screen.getByText('Explorer home')).toBeInTheDocument()
  })

  it('redirects to the last visited query tab when its draft still exists', () => {
    mocks.restoreDraft.mockReturnValue(true)
    mockHistory({ type: 'query', id: 'query-1' })

    customRender(<ProjectExplorerPage dehydratedState={undefined} />)

    expect(mocks.restoreDraft).toHaveBeenCalledWith({ id: 'query-1', projectRef: 'default' })
    expect(mockRouter.replace).toHaveBeenCalledWith('/project/default/explorer/query/query-1')
    expect(mocks.activatePinnedTab).not.toHaveBeenCalled()
  })

  it('falls back to Home and forgets the entry when the query draft is gone', () => {
    mocks.restoreDraft.mockReturnValue(false)
    mockHistory({ type: 'query', id: 'query-1' })

    customRender(<ProjectExplorerPage dehydratedState={undefined} />)

    expect(mockRouter.replace).not.toHaveBeenCalled()
    expect(mocks.setLastVisitedExplorerTab).toHaveBeenCalledWith(undefined)
    expect(mocks.activatePinnedTab).toHaveBeenCalled()
  })

  it('redirects to the last visited chat tab when the chat still exists', () => {
    mocks.assistantSnapshot.mockReturnValue({
      isInitialized: true,
      chats: { 'chat-1': { id: 'chat-1', name: 'Investigate' } },
    })
    mockHistory({ type: 'chat', id: 'chat-1' })

    customRender(<ProjectExplorerPage dehydratedState={undefined} />)

    expect(mockRouter.replace).toHaveBeenCalledWith('/project/default/explorer/chat/chat-1')
  })

  it('waits for chat hydration before deciding', () => {
    mocks.assistantSnapshot.mockReturnValue({ isInitialized: false, chats: {} })
    mockHistory({ type: 'chat', id: 'chat-1' })

    customRender(<ProjectExplorerPage dehydratedState={undefined} />)

    expect(mockRouter.replace).not.toHaveBeenCalled()
    expect(mocks.activatePinnedTab).not.toHaveBeenCalled()
    expect(screen.getByText('Checking last tab')).toBeInTheDocument()
  })

  it('falls back to Home when the last visited chat was deleted', () => {
    mocks.assistantSnapshot.mockReturnValue({ isInitialized: true, chats: {} })
    mockHistory({ type: 'chat', id: 'chat-1' })

    customRender(<ProjectExplorerPage dehydratedState={undefined} />)

    expect(mockRouter.replace).not.toHaveBeenCalled()
    expect(mocks.setLastVisitedExplorerTab).toHaveBeenCalledWith(undefined)
    expect(mocks.activatePinnedTab).toHaveBeenCalled()
  })

  it('shows the checking state while the last visited notebook is still loading', () => {
    mocks.useLoadNotebook.mockReturnValue({ isNotFound: false, isLoading: true })
    mockHistory({ type: 'notebook', id: 'notebook-1' })

    customRender(<ProjectExplorerPage dehydratedState={undefined} />)

    expect(mockRouter.replace).not.toHaveBeenCalled()
    expect(screen.getByText('Checking last tab')).toBeInTheDocument()
  })

  it('redirects to the last visited notebook once it is confirmed to exist', () => {
    mocks.useLoadNotebook.mockReturnValue({ isNotFound: false, isLoading: false })
    mockHistory({ type: 'notebook', id: 'notebook-1' })

    customRender(<ProjectExplorerPage dehydratedState={undefined} />)

    expect(mockRouter.replace).toHaveBeenCalledWith('/project/default/explorer/notebook/notebook-1')
  })

  it('falls back to Home when the last visited notebook no longer exists', () => {
    mocks.useLoadNotebook.mockReturnValue({ isNotFound: true, isLoading: false })
    mockHistory({ type: 'notebook', id: 'notebook-1' })

    customRender(<ProjectExplorerPage dehydratedState={undefined} />)

    expect(mockRouter.replace).not.toHaveBeenCalled()
    expect(mocks.setLastVisitedExplorerTab).toHaveBeenCalledWith(undefined)
    expect(mocks.activatePinnedTab).toHaveBeenCalled()
  })
})
