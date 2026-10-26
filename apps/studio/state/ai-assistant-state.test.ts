import { proxy, ref } from 'valtio/vanilla'
import { describe, expect, it } from 'vitest'

import {
  createAiAssistantState,
  sanitizeForCloning,
  whenAiAssistantInitialized,
} from './ai-assistant-state'

describe('AI assistant chat message sync', () => {
  // FE-3954: syncing the live array into valtio corrupted it with Proxies, breaking structuredClone in addToolApprovalResponse
  it('does not corrupt the live SDK message array when synced into valtio state', () => {
    const state = proxy<{ chats: Record<string, any>; chatInstances: Record<string, any> }>({
      chats: {},
      chatInstances: {},
    })
    state.chats['chat-1'] = { id: 'chat-1', messages: [] }

    const liveSdkMessages = [
      {
        id: 'message-1',
        role: 'assistant',
        parts: [
          { type: 'text', text: "Sure, here's a query" },
          {
            type: 'tool-execute_sql',
            toolCallId: 'tool-1',
            state: 'approval-requested',
            approval: { id: 'approval-1' },
          },
        ],
      },
    ]
    state.chatInstances['chat-1'] = ref({ messages: liveSdkMessages })

    const chat = state.chats['chat-1']
    chat.messages = liveSdkMessages.map((message) => sanitizeForCloning(message))

    // mirrors addToolApprovalResponse's own update logic
    const lastMessage = liveSdkMessages[liveSdkMessages.length - 1]
    const updatedParts = lastMessage.parts.map((part: any) =>
      part.state === 'approval-requested' && part.approval?.id === 'approval-1'
        ? { ...part, state: 'approval-responded', approval: { id: 'approval-1', approved: true } }
        : part
    )
    const replacedMessage = { ...lastMessage, parts: updatedParts }

    expect(() => structuredClone(replacedMessage)).not.toThrow()
  })
})

describe('AI assistant chat surface isolation', () => {
  it('creates chats without changing the sidebar selection', () => {
    const state = createAiAssistantState()
    const sidebarChatId = state.newChat({ name: 'Sidebar chat' })

    const explorerChatId = state.createChat({ name: 'Explorer chat' })

    expect(explorerChatId).not.toBe(sidebarChatId)
    expect(state.activeChatId).toBe(sidebarChatId)
    expect(state.chats[explorerChatId]?.name).toBe('Explorer chat')
  })

  it('branches a specified chat without changing the sidebar selection', () => {
    const state = createAiAssistantState()
    const sidebarChatId = state.newChat({ name: 'Sidebar chat' })
    const explorerChatId = state.createChat({ name: 'Explorer chat' })
    state.chats[explorerChatId].messages = [
      { id: 'message-1', role: 'user', parts: [{ type: 'text', text: 'Hello' }] },
    ]

    const branchId = state.createBranch(explorerChatId, 'message-1')

    expect(branchId).toBeDefined()
    expect(state.activeChatId).toBe(sidebarChatId)
    expect(state.chats[branchId!]?.branchedFrom).toEqual({
      chatId: explorerChatId,
      messageId: 'message-1',
    })
  })

  it('mutates an explicit chat without changing or clearing the sidebar chat', () => {
    const state = createAiAssistantState()
    const sidebarChatId = state.newChat({ name: 'Sidebar chat' })
    const explorerChatId = state.createChat({ name: 'Explorer chat' })
    state.chats[sidebarChatId].messages = [
      { id: 'sidebar-message', role: 'user', parts: [{ type: 'text', text: 'Keep me' }] },
    ]
    state.chats[explorerChatId].messages = [
      { id: 'explorer-message', role: 'user', parts: [{ type: 'text', text: 'Clear me' }] },
    ]
    state.chatInstances[explorerChatId].messages = [
      { id: 'explorer-message', role: 'user', parts: [{ type: 'text', text: 'Clear me' }] },
    ]

    state.clearMessages(explorerChatId)

    expect(state.activeChatId).toBe(sidebarChatId)
    expect(state.chats[sidebarChatId].messages).toHaveLength(1)
    expect(state.chats[explorerChatId].messages).toHaveLength(0)
    expect(state.chatInstances[explorerChatId].messages).toHaveLength(0)
  })

  it('keeps explicit chat message edits synchronized with the live chat instance', () => {
    const state = createAiAssistantState()
    const chatId = state.createChat({ name: 'Explorer chat' })
    const messages = [
      { id: 'message-1', role: 'user' as const, parts: [{ type: 'text' as const, text: 'First' }] },
      {
        id: 'message-2',
        role: 'user' as const,
        parts: [{ type: 'text' as const, text: 'Second' }],
      },
    ]
    state.chats[chatId].messages = messages
    state.chatInstances[chatId].messages = messages

    state.deleteMessagesAfter('message-2', { chatId })
    state.updateMessage(
      { id: 'message-1', role: 'user', parts: [{ type: 'text', text: 'Updated' }] },
      chatId
    )

    expect(state.chats[chatId].messages).toEqual([
      { id: 'message-1', role: 'user', parts: [{ type: 'text', text: 'Updated' }] },
    ])
    expect(state.chatInstances[chatId].messages).toEqual(state.chats[chatId].messages)
  })
})

describe('whenAiAssistantInitialized', () => {
  it('resolves immediately once the state has hydrated', async () => {
    const state = createAiAssistantState()
    state.isInitialized = true

    await expect(whenAiAssistantInitialized(state)).resolves.toBeUndefined()
  })

  // loadPersistedState replaces state.chats wholesale, so a chat created before hydration is lost
  it('defers chat creation until hydration lands so the new chat survives', async () => {
    const state = createAiAssistantState()

    const pending = whenAiAssistantInitialized(state)
    const droppedChatId = state.createChat({ name: 'Created too early' })

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
    state.isInitialized = true

    expect(state.chats[droppedChatId]).toBeUndefined()

    await pending
    const chatId = state.createChat({ name: 'Created after hydration' })

    expect(state.chats[chatId]?.name).toBe('Created after hydration')
    expect(state.chats['persisted-chat']).toBeDefined()
  })
})
