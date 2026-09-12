import { act, render, screen } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { describe, expect, it } from 'vitest'

import {
  AiAssistantStateContext,
  createAiAssistantState,
  useAiAssistantChatList,
  type AiAssistantState,
} from './ai-assistant-state'

const ChatList = () => {
  const chats = useAiAssistantChatList()

  return (
    <ul>
      {chats.map((chat) => (
        <li key={chat.id}>{chat.name}</li>
      ))}
    </ul>
  )
}

const renderChatList = (state: AiAssistantState) => {
  const Wrapper = ({ children }: PropsWithChildren) => (
    <AiAssistantStateContext.Provider value={state}>{children}</AiAssistantStateContext.Provider>
  )

  return render(<ChatList />, { wrapper: Wrapper })
}

describe('useAiAssistantChatList', () => {
  // createChat, createBranch, deleteChat and loadPersistedState all replace state.chats wholesale,
  // so subscribing to the object itself goes stale after the first replacement
  it('rerenders when a chat is created after the first render', async () => {
    const state = createAiAssistantState()
    renderChatList(state)

    expect(screen.queryByText('Explorer chat')).not.toBeInTheDocument()

    await act(async () => {
      state.createChat({ name: 'Explorer chat' })
    })

    expect(await screen.findByText('Explorer chat')).toBeInTheDocument()
  })

  it('rerenders when chats are replaced by hydration and again when a chat is deleted', async () => {
    const state = createAiAssistantState()
    renderChatList(state)

    await act(async () => {
      state.loadPersistedState({
        projectRef: 'default',
        activeChatId: 'persisted-chat',
        chats: {
          'persisted-chat': {
            id: 'persisted-chat',
            name: 'Persisted chat',
            messages: [],
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
      })
    })

    expect(await screen.findByText('Persisted chat')).toBeInTheDocument()

    await act(async () => {
      state.deleteChat('persisted-chat')
    })

    expect(screen.queryByText('Persisted chat')).not.toBeInTheDocument()
  })
})
