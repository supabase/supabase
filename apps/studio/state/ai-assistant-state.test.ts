import { proxy, ref } from 'valtio/vanilla'
import { describe, expect, it } from 'vitest'

import { sanitizeForCloning } from './ai-assistant-state'

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
