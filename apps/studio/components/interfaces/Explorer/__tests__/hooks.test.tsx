import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useCreateChat, useCreateQuery } from '../hooks'

const {
  mockCreateChat,
  mockCreateDraft,
  mockPush,
  mockSelectChat,
  mockSetContext,
  mockWhenInitialized,
} = vi.hoisted(() => ({
  mockCreateChat: vi.fn(() => 'chat-2'),
  mockCreateDraft: vi.fn(),
  mockPush: vi.fn(),
  mockSelectChat: vi.fn(),
  mockSetContext: vi.fn(),
  mockWhenInitialized: vi.fn(() => Promise.resolve()),
}))

vi.mock('next/router', () => ({ useRouter: () => ({ push: mockPush }) }))
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

  it('creates an empty draft when no sql or name is provided', () => {
    const { result } = renderHook(() => useCreateQuery())

    expect(result.current.createQuery()).toBe('query-new')
    expect(mockCreateDraft).toHaveBeenCalledWith({
      id: 'query-new',
      projectRef: 'default',
      sql: undefined,
      name: undefined,
    })
  })
})
