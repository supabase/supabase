import { createMemoryHistory, createRootRoute, createRouter } from '@tanstack/react-router'
import { act } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useCreateChat, useCreateQuery } from '../hooks'
import { parseSearch, stringifySearch } from '@/lib/router-search-params'
import { customRenderHook } from '@/tests/lib/custom-render'

const { mockCreateChat, mockCreateDraft, mockSelectChat, mockSetContext, mockWhenInitialized } =
  vi.hoisted(() => ({
    mockCreateChat: vi.fn(() => 'chat-2'),
    mockCreateDraft: vi.fn(),
    mockSelectChat: vi.fn(),
    mockSetContext: vi.fn(),
    mockWhenInitialized: vi.fn(() => Promise.resolve()),
  }))

vi.mock('@/hooks/misc/useSelectedProject', () => ({
  useSelectedProjectQuery: () => ({
    data: { ref: 'default', connectionString: 'postgres://example' },
  }),
}))
vi.mock('@/hooks/misc/useSelectedOrganization', () => ({
  useSelectedOrganizationQuery: () => ({ data: { slug: 'acme' } }),
}))
vi.mock('@/lib/api/snippets.browser', () => ({
  generateUuid: () => 'query-new',
}))
vi.mock('@/state/explorer-query', () => ({
  useExplorerQueryStateSnapshot: () => ({ createDraft: mockCreateDraft }),
}))
vi.mock('@/state/ai-assistant-state', () => ({
  useAiAssistantState: () => ({
    createChat: mockCreateChat,
    selectChat: mockSelectChat,
    setContext: mockSetContext,
  }),
  whenAiAssistantInitialized: () => mockWhenInitialized(),
}))

const createTestRouter = () =>
  createRouter({
    routeTree: createRootRoute(),
    history: createMemoryHistory({ initialEntries: ['/project/default/explorer'] }),
    parseSearch,
    stringifySearch,
  })

beforeEach(() => vi.clearAllMocks())

describe('useCreateChat', () => {
  beforeEach(() => {
    mockWhenInitialized.mockImplementation(() => Promise.resolve())
  })

  it('creates and opens Explorer chats without changing the sidebar selection', async () => {
    const router = createTestRouter()
    const navigateSpy = vi.spyOn(router, 'navigate')
    const { result } = customRenderHook(() => useCreateChat(), { router })

    await act(async () => {
      await result.current.createChat({
        name: 'Investigate errors',
        initialMessage: 'What happened?',
      })
    })

    expect(mockSetContext).toHaveBeenCalledWith({
      projectRef: 'default',
      orgSlug: 'acme',
      connectionString: 'postgres://example',
    })
    expect(mockCreateChat).toHaveBeenCalledWith({
      name: 'Investigate errors',
      initialMessage: 'What happened?',
    })
    expect(navigateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        to: '/project/$ref/explorer/chat/$id',
        params: { ref: 'default', id: 'chat-2' },
      })
    )
    expect(mockSelectChat).not.toHaveBeenCalled()

    act(() => result.current.openChat('chat-1'))

    expect(navigateSpy).toHaveBeenLastCalledWith(
      expect.objectContaining({
        to: '/project/$ref/explorer/chat/$id',
        params: { ref: 'default', id: 'chat-1' },
      })
    )
    expect(mockSelectChat).not.toHaveBeenCalled()
  })

  // Hydration replaces the chat map wholesale, so a chat created mid-load would be
  // dropped the moment the persisted state lands
  it('waits for the assistant state to hydrate before creating the chat', async () => {
    let resolveHydration = () => {}
    mockWhenInitialized.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveHydration = resolve
        })
    )

    const router = createTestRouter()
    const navigateSpy = vi.spyOn(router, 'navigate')
    const { result } = customRenderHook(() => useCreateChat(), { router })

    let created: Promise<string | undefined> | undefined
    await act(async () => {
      created = result.current.createChat({ name: 'Investigate errors' })
    })

    expect(mockCreateChat).not.toHaveBeenCalled()
    expect(navigateSpy).not.toHaveBeenCalled()

    await act(async () => {
      resolveHydration()
      await created
    })

    expect(mockCreateChat).toHaveBeenCalledWith({
      name: 'Investigate errors',
      initialMessage: undefined,
    })
    expect(navigateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        to: '/project/$ref/explorer/chat/$id',
        params: { ref: 'default', id: 'chat-2' },
      })
    )
  })
})

describe('useCreateQuery', () => {
  it('replaces the start route when opening the preferred query on startup', () => {
    const router = createTestRouter()
    const navigateSpy = vi.spyOn(router, 'navigate')
    const { result } = customRenderHook(() => useCreateQuery(), { router })

    expect(result.current.createQuery({ replace: true })).toBe('query-new')
    expect(mockCreateDraft).toHaveBeenCalledExactlyOnceWith({
      id: 'query-new',
      projectRef: 'default',
      sql: undefined,
      name: undefined,
      autoRun: undefined,
    })
    expect(navigateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        to: '/project/$ref/explorer/query/$id',
        params: { ref: 'default', id: 'query-new' },
        replace: true,
      })
    )
  })

  it('creates a draft and opens it as an Explorer query tab', () => {
    const router = createTestRouter()
    const navigateSpy = vi.spyOn(router, 'navigate')
    const { result } = customRenderHook(() => useCreateQuery(), { router })

    expect(result.current.createQuery({ sql: 'select 1', name: 'Untitled query' })).toBe(
      'query-new'
    )
    expect(mockCreateDraft).toHaveBeenCalledWith({
      id: 'query-new',
      projectRef: 'default',
      sql: 'select 1',
      name: 'Untitled query',
    })
    expect(navigateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        to: '/project/$ref/explorer/query/$id',
        params: { ref: 'default', id: 'query-new' },
        replace: false,
      })
    )
  })

  it('forwards autoRun to the draft so its query tab can run itself once mounted', () => {
    const router = createTestRouter()
    const { result } = customRenderHook(() => useCreateQuery(), { router })

    result.current.createQuery({ sql: 'select 1', autoRun: true })
    expect(mockCreateDraft).toHaveBeenCalledWith({
      id: 'query-new',
      projectRef: 'default',
      sql: 'select 1',
      name: undefined,
      autoRun: true,
    })
  })
})
