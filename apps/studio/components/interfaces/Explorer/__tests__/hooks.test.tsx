import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useCreateChat } from '../hooks'

const {
  mockCreateChat,
  mockPush,
  mockSelectChat,
  mockSetContext,
  mockSetModel,
  mockWhenInitialized,
} = vi.hoisted(() => ({
  mockCreateChat: vi.fn(() => 'chat-2'),
  mockPush: vi.fn(),
  mockSelectChat: vi.fn(),
  mockSetContext: vi.fn(),
  mockSetModel: vi.fn(),
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
vi.mock('@/state/ai-assistant-state', () => ({
  useAiAssistantState: () => ({
    createChat: mockCreateChat,
    selectChat: mockSelectChat,
    setContext: mockSetContext,
    setModel: mockSetModel,
  }),
  whenAiAssistantInitialized: () => mockWhenInitialized(),
}))

describe('useCreateChat', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockWhenInitialized.mockImplementation(() => Promise.resolve())
  })

  it('creates and opens Explorer chats without changing the sidebar selection', async () => {
    const { result } = renderHook(() => useCreateChat())

    await act(async () => {
      await result.current.createChat({
        name: 'Investigate errors',
        initialMessage: 'What happened?',
        model: 'gpt-5.4-nano',
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
    expect(mockSetModel).toHaveBeenCalledWith('gpt-5.4-nano')
    expect(mockPush).toHaveBeenCalledWith('/project/default/explorer/chat/chat-2')
    expect(mockSelectChat).not.toHaveBeenCalled()

    act(() => result.current.openChat('chat-1'))

    expect(mockPush).toHaveBeenLastCalledWith('/project/default/explorer/chat/chat-1')
    expect(mockSelectChat).not.toHaveBeenCalled()
  })

  // Hydration replaces the chat map and the model wholesale, so a chat created mid-load would be
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
      created = result.current.createChat({ name: 'Investigate errors', model: 'gpt-5.4-nano' })
    })

    expect(mockCreateChat).not.toHaveBeenCalled()
    expect(mockSetModel).not.toHaveBeenCalled()
    expect(mockPush).not.toHaveBeenCalled()

    await act(async () => {
      resolveHydration()
      await created
    })

    expect(mockCreateChat).toHaveBeenCalledWith({
      name: 'Investigate errors',
      initialMessage: undefined,
    })
    expect(mockSetModel).toHaveBeenCalledWith('gpt-5.4-nano')
    expect(mockPush).toHaveBeenCalledWith('/project/default/explorer/chat/chat-2')
  })
})
