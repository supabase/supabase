import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useCreateChat } from '../hooks'

const { mockCreateChat, mockPush, mockSelectChat, mockSetContext, mockSetModel } = vi.hoisted(
  () => ({
    mockCreateChat: vi.fn(() => 'chat-2'),
    mockPush: vi.fn(),
    mockSelectChat: vi.fn(),
    mockSetContext: vi.fn(),
    mockSetModel: vi.fn(),
  })
)

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
}))

describe('useCreateChat', () => {
  beforeEach(() => vi.clearAllMocks())

  it('creates and opens Explorer chats without changing the sidebar selection', () => {
    const { result } = renderHook(() => useCreateChat())

    act(() => {
      result.current.createChat({
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
})
