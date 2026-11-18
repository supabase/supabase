import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useCreateChat, useCreateQuery, useOpenNotebookTemplate } from '../hooks'
import { notebooksState } from '@/state/notebooks/notebooks-state'
import { addAPIMock } from '@/tests/lib/msw'

const {
  mockCreateChat,
  mockCreateDraft,
  mockPush,
  mockReplace,
  mockSelectChat,
  mockSetContext,
  mockWhenInitialized,
} = vi.hoisted(() => ({
  mockCreateChat: vi.fn(() => 'chat-2'),
  mockCreateDraft: vi.fn(),
  mockPush: vi.fn(),
  mockReplace: vi.fn(),
  mockSelectChat: vi.fn(),
  mockSetContext: vi.fn(),
  mockWhenInitialized: vi.fn(() => Promise.resolve()),
}))

vi.mock('next/router', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
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
vi.mock('@/lib/profile', () => ({
  useProfile: () => ({ profile: { id: 1 } }),
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

beforeEach(() => vi.clearAllMocks())

describe('useCreateChat', () => {
  beforeEach(() => {
    mockWhenInitialized.mockImplementation(() => Promise.resolve())
  })

  it('creates and opens Explorer chats without changing the sidebar selection', async () => {
    const { result } = renderHook(() => useCreateChat())

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
    expect(mockPush).toHaveBeenCalledWith('/project/default/explorer/chat/chat-2')
    expect(mockSelectChat).not.toHaveBeenCalled()

    act(() => result.current.openChat('chat-1'))

    expect(mockPush).toHaveBeenLastCalledWith('/project/default/explorer/chat/chat-1')
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

    const { result } = renderHook(() => useCreateChat())

    let created: Promise<string | undefined> | undefined
    await act(async () => {
      created = result.current.createChat({ name: 'Investigate errors' })
    })

    expect(mockCreateChat).not.toHaveBeenCalled()
    expect(mockPush).not.toHaveBeenCalled()

    await act(async () => {
      resolveHydration()
      await created
    })

    expect(mockCreateChat).toHaveBeenCalledWith({
      name: 'Investigate errors',
      initialMessage: undefined,
    })
    expect(mockPush).toHaveBeenCalledWith('/project/default/explorer/chat/chat-2')
  })
})

describe('useCreateQuery', () => {
  it('replaces the start route when opening the preferred query on startup', () => {
    const { result } = renderHook(() => useCreateQuery())

    expect(result.current.createQuery({ replace: true })).toBe('query-new')
    expect(mockCreateDraft).toHaveBeenCalledExactlyOnceWith({
      id: 'query-new',
      projectRef: 'default',
      sql: undefined,
      name: undefined,
      autoRun: undefined,
    })
    expect(mockReplace).toHaveBeenCalledWith('/project/default/explorer/query/query-new')
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('creates a draft and opens it as an Explorer query tab', () => {
    const { result } = renderHook(() => useCreateQuery())

    expect(result.current.createQuery({ sql: 'select 1', name: 'Untitled query' })).toBe(
      'query-new'
    )
    expect(mockCreateDraft).toHaveBeenCalledWith({
      id: 'query-new',
      projectRef: 'default',
      sql: 'select 1',
      name: 'Untitled query',
    })
    expect(mockPush).toHaveBeenCalledWith('/project/default/explorer/query/query-new')
  })

  it('forwards autoRun to the draft so its query tab can run itself once mounted', () => {
    const { result } = renderHook(() => useCreateQuery())

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

describe('useOpenNotebookTemplate', () => {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      {children}
    </QueryClientProvider>
  )

  const mockSavedNotebooks = (names: string[]) =>
    addAPIMock({
      method: 'get',
      path: '/platform/projects/:ref/content',
      response: {
        data: names.map((name, index) => ({
          id: `notebook-${index + 1}`,
          name,
          type: 'notebook' as const,
          visibility: 'project' as const,
          favorite: false,
          owner_id: 1,
          owner: { id: 1, username: 'owner' },
          project_id: 1,
          inserted_at: '2026-01-01T00:00:00.000Z',
          updated_at: '2026-01-01T00:00:00.000Z',
          updated_by: null,
        })),
      },
    })

  const openTemplate = async () => {
    const { result } = renderHook(() => useOpenNotebookTemplate(), { wrapper })
    await act(async () => {
      await result.current.openNotebookTemplate({ name: 'Security audit', buildCells: () => [] })
    })
  }

  beforeEach(() => {
    for (const id of Object.keys(notebooksState.notebooks)) delete notebooksState.notebooks[id]
  })

  // Clicking a template again should take the user back to their notebook, not pile up copies
  it('opens the saved notebook with the template name instead of adding another', async () => {
    mockSavedNotebooks(['Security audit (old)', 'Security audit'])

    await openTemplate()

    expect(mockPush).toHaveBeenCalledExactlyOnceWith(
      '/project/default/explorer/notebook/notebook-2'
    )
    expect(notebooksState.notebooks['query-new']).toBeUndefined()
  })

  it('creates the notebook when none has the template name', async () => {
    mockSavedNotebooks(['Security audit (old)'])

    await openTemplate()

    expect(notebooksState.notebooks['query-new']?.notebook.name).toBe('Security audit')
    expect(mockPush).toHaveBeenCalledExactlyOnceWith('/project/default/explorer/notebook/query-new')
  })

  // A notebook created moments ago may not be saved yet, so the server can't find it
  it('opens a notebook created from the template that has not been saved yet', async () => {
    mockSavedNotebooks([])
    await openTemplate()
    mockPush.mockClear()

    await openTemplate()

    expect(mockPush).toHaveBeenCalledExactlyOnceWith('/project/default/explorer/notebook/query-new')
    expect(Object.keys(notebooksState.notebooks)).toEqual(['query-new'])
  })
})
